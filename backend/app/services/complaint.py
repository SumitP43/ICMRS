import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from backend.app.database.models.complaint import (
    Complaint,
    ComplaintAIAnalysis,
    ComplaintAssignment,
    ComplaintEvidence,
    ComplaintUpdate
)
from backend.app.database.models.department import Department, Officer
from backend.app.database.models.user import User
from backend.app.schemas.complaints import (
    ComplaintCreate,
    ComplaintPatch,
    ComplaintResponse,
    CoordinatesSchema,
    OfficerNoteSchema,
    StatusHistoryEntrySchema,
    AttachmentSchema,
    AIAnalysisResponse,
    ComplaintEvidenceCreate,
    ResolveComplaintRequest,
    CitizenFeedbackCreate
)
from backend.app.utils.id_generator import generate_complaint_number
from backend.app.services.sla import create_sla_record, update_sla_priority, compute_sla_display
from backend.app.services.ai import run_ai_complaint_analysis
from backend.app.services.notification import create_notification
from backend.app.services.audit import record_audit_log
from backend.app.redis.cache import get_cached, set_cached, invalidate_pattern
from backend.app.redis.pubsub import publish_event
from backend.app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from backend.app.core.logging import logger

def format_complaint_response(complaint: Complaint) -> ComplaintResponse:
    """Transform SQLAlchemy Complaint model into frontend CivicComplaint schema."""
    now = datetime.now(timezone.utc)
    
    # Coordinates
    coords = CoordinatesSchema(
        lat=complaint.latitude,
        lng=complaint.longitude
    )

    # SLA calculations
    if complaint.sla_record:
        sla_remaining, sla_status, total_sla_hours = compute_sla_display(complaint, complaint.sla_record)
    else:
        sla_remaining = "24h 00m SLA nominal"
        sla_status = "nominal"
        total_sla_hours = 24

    # Time logged display
    created = complaint.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    elapsed_seconds = (now - created).total_seconds()
    if elapsed_seconds < 3600:
        time_logged = f"Logged {int(elapsed_seconds // 60)}m ago" if elapsed_seconds > 60 else "Just now"
    elif elapsed_seconds < 86400:
        time_logged = f"Logged {int(elapsed_seconds // 3600)} hrs ago"
    else:
        time_logged = f"Logged {int(elapsed_seconds // 86400)} days ago"

    # Officer notes
    notes_list: List[OfficerNoteSchema] = []
    for update in (complaint.updates or []):
        if update.update_type in ["note", "investigation", "dispatch", "resolution"]:
            created_dt = update.created_at
            if created_dt.tzinfo is None:
                created_dt = created_dt.replace(tzinfo=timezone.utc)
            delta = (now - created_dt).total_seconds()
            time_str = f"{int(delta // 3600)} hours ago" if delta >= 3600 else f"{int(delta // 60)} mins ago"
            if delta < 60:
                time_str = "Just now"
            notes_list.append(OfficerNoteSchema(
                id=str(update.id),
                author=update.author_name,
                role=update.author_role,
                time=time_str,
                text=update.message
            ))

    # Evidence / attachments
    attachments_list: List[AttachmentSchema] = []
    for ev in (complaint.evidence or []):
        attachments_list.append(AttachmentSchema(
            id=str(ev.id),
            name=ev.file_name,
            url=ev.file_url,
            type=ev.mime_type,
            size=ev.file_size,
            uploadedAt=ev.created_at.isoformat()
        ))

    # Status history
    status_history_list: List[StatusHistoryEntrySchema] = []
    for update in (complaint.updates or []):
        if update.update_type in ["status_change", "dispatch", "resolution"]:
            status_history_list.append(StatusHistoryEntrySchema(
                status=update.new_status or complaint.status,
                timestamp=update.created_at.isoformat(),
                updatedBy=update.author_name,
                role=update.author_role,
                notes=update.message
            ))

    # AI Analysis details
    ai_resp = None
    if complaint.ai_analysis:
        ai_resp = AIAnalysisResponse(
            predicted_category=complaint.ai_analysis.predicted_category,
            predicted_priority=complaint.ai_analysis.predicted_priority,
            recommended_department=complaint.ai_analysis.recommended_crew,
            recommended_crew=complaint.ai_analysis.recommended_crew,
            severity_score=complaint.ai_analysis.severity_score,
            confidence_score=complaint.ai_analysis.confidence_score,
            explanation=complaint.ai_analysis.explanation,
            is_duplicate=complaint.is_duplicate,
            duplicate_of=str(complaint.duplicate_of_id) if complaint.duplicate_of_id else None,
            duplicate_score=complaint.duplicate_score
        )

    # Find primary image from initial evidence if available
    img_url = None
    before_img = None
    after_img = None
    for ev in (complaint.evidence or []):
        if ev.evidence_type in ["initial_photo", "document"] and not img_url:
            img_url = ev.file_url
        elif ev.evidence_type == "before":
            before_img = ev.file_url
        elif ev.evidence_type == "after":
            after_img = ev.file_url

    # Primary image fallback if before image exists
    if not img_url and before_img:
        img_url = before_img

    dept_name = complaint.department.name if complaint.department else "District 04 Municipal Response Bureau"
    officer_name = complaint.assigned_officer.user.name if complaint.assigned_officer else None

    return ComplaintResponse(
        id=complaint.complaint_number,
        complaintNumber=complaint.complaint_number,
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        location=complaint.location,
        coordinates=coords,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        status=complaint.status,
        priority=complaint.priority,
        citizenName=complaint.citizen_name,
        citizenEmail=complaint.citizen_email,
        citizenToken=complaint.citizen_token or "Verified Resident",
        department=dept_name,
        assignedOfficer=officer_name,
        assignedCrew=complaint.assigned_crew or "Delhi Municipal Rapid Unit",
        pipelineStep=complaint.pipeline_step,
        pipelineStepName=complaint.pipeline_step_name,
        pipelinePercent=complaint.pipeline_percent,
        timeLogged=time_logged,
        slaRemaining=sla_remaining,
        totalSlaHours=total_sla_hours,
        slaStatus=sla_status,
        imageUrl=img_url,
        imageAlt=f"Civic documentary photograph of {complaint.category} hazard at {complaint.location}",
        beforeImageUrl=before_img,
        afterImageUrl=after_img,
        gpsTagged=True,
        resolutionDetails=complaint.resolution_details,
        resolvedTime=complaint.resolved_at.isoformat() if complaint.resolved_at else None,
        rating=complaint.feedback_rating,
        officerNotes=notes_list,
        attachments=attachments_list,
        statusHistory=status_history_list,
        aiAnalysis=ai_resp,
        is_duplicate=complaint.is_duplicate,
        duplicate_of_id=str(complaint.duplicate_of_id) if complaint.duplicate_of_id else None,
        duplicate_score=complaint.duplicate_score,
        createdAt=complaint.created_at.isoformat(),
        updatedAt=complaint.updated_at.isoformat()
    )

def create_complaint(
    db: Session,
    data: ComplaintCreate,
    current_user: Optional[User] = None
) -> ComplaintResponse:
    """Create, analyze with AI, calculate SLA, persist, and dispatch complaint."""
    complaint_num = generate_complaint_number()
    
    # Coordinate resolution
    lat = data.latitude
    lng = data.longitude
    if (lat is None or lng is None) and data.coordinates:
        lat = data.coordinates.lat
        lng = data.coordinates.lng
    if lat is None or lng is None:
        lat = 28.6315
        lng = 77.2167

    c_name = data.citizenName or (current_user.name if current_user else "Marcus Vance")
    c_email = data.citizenEmail or (current_user.email if current_user else "citizen@icmrs.gov")
    citizen_id = current_user.id if current_user else None

    # Resolve department
    department_record = None
    if data.department:
        department_record = db.query(Department).filter(
            (Department.name.ilike(f"%{data.department}%")) | (Department.name == data.department)
        ).first()

    complaint = Complaint(
        complaint_number=complaint_num,
        title=data.title,
        description=data.description,
        category=data.category,
        location=data.location,
        latitude=lat,
        longitude=lng,
        status="In Progress",
        priority=data.priority or "Medium",
        citizen_id=citizen_id,
        citizen_name=c_name,
        citizen_email=c_email,
        citizen_token="Verified Resident",
        department_id=department_record.id if department_record else None,
        assigned_crew=data.assignedCrew or "Delhi Municipal Rapid Unit",
        pipeline_step=1,
        pipeline_step_name="Step 1 of 5: Telemetry Received & Dispatched",
        pipeline_percent=20
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # 1. Initial Status History Update
    initial_update = ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=citizen_id,
        author_name=c_name,
        author_role="citizen",
        update_type="status_change",
        previous_status="Created",
        new_status="In Progress",
        message=f"Complaint registered into municipal telemetry database: {complaint_num}."
    )
    db.add(initial_update)

    # 2. Attach photographic evidence if provided
    if data.imageUrl:
        ev = ComplaintEvidence(
            complaint_id=complaint.id,
            uploaded_by_id=citizen_id,
            evidence_type="initial_photo",
            file_url=data.imageUrl,
            file_name="Scene Photographic Evidence",
            mime_type="image/jpeg",
            description="Initial photographic evidence submitted with complaint."
        )
        db.add(ev)

    if data.attachments:
        for att in data.attachments:
            if att.url != data.imageUrl:
                db.add(ComplaintEvidence(
                    complaint_id=complaint.id,
                    uploaded_by_id=citizen_id,
                    evidence_type="document",
                    file_url=att.url,
                    file_name=att.name,
                    file_size=att.size,
                    mime_type=att.type,
                    description=f"Citizen attachment {att.name}"
                ))

    db.commit()
    db.refresh(complaint)

    # 3. Create SLA tracking record
    create_sla_record(db, complaint)

    # 4. Run AI Analysis (classification, priority, duplicate detection)
    try:
        run_ai_complaint_analysis(db, complaint)
    except Exception as e:
        logger.error(f"AI Analysis pipeline note: {e}")

    db.refresh(complaint)

    # 5. Invalidate caches & publish real-time notification
    invalidate_pattern("complaints:*")
    publish_event("complaints:new", {
        "complaint_number": complaint.complaint_number,
        "title": complaint.title,
        "category": complaint.category,
        "priority": complaint.priority,
        "location": complaint.location
    })

    record_audit_log(
        db,
        entity_type="complaint",
        entity_id=complaint.complaint_number,
        action="CREATE",
        actor_id=citizen_id,
        actor_email=c_email,
        actor_role="citizen",
        change_summary=f"Incident {complaint.complaint_number} created: {complaint.title}"
    )

    return format_complaint_response(complaint)

def get_complaint_by_id_or_number(db: Session, identifier: str) -> Complaint:
    """Find complaint by UUID or complaint number e.g. #ICMRS-2026-XXXXXX."""
    complaint = None
    try:
        u_id = uuid.UUID(identifier)
        complaint = db.query(Complaint).filter(Complaint.id == u_id).first()
    except (ValueError, AttributeError):
        pass

    if not complaint:
        complaint = db.query(Complaint).filter(
            (Complaint.complaint_number == identifier) |
            (Complaint.complaint_number == f"#{identifier.lstrip('#')}")
        ).first()

    if not complaint:
        raise NotFoundException(f"Complaint '{identifier}' not found in municipal database")
    return complaint

def get_complaints(
    db: Session,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[uuid.UUID] = None,
    assigned_officer_id: Optional[uuid.UUID] = None,
    citizen_id: Optional[uuid.UUID] = None,
    citizen_email: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[ComplaintResponse]:
    query = db.query(Complaint)

    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if assigned_officer_id:
        query = query.filter(Complaint.assigned_officer_id == assigned_officer_id)
    if citizen_id:
        query = query.filter(Complaint.citizen_id == citizen_id)
    if citizen_email:
        query = query.filter(Complaint.citizen_email == citizen_email.lower())
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(s),
                Complaint.description.ilike(s),
                Complaint.location.ilike(s),
                Complaint.complaint_number.ilike(s),
                Complaint.citizen_name.ilike(s)
            )
        )

    records = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit).all()
    return [format_complaint_response(c) for c in records]

def patch_complaint(
    db: Session,
    identifier: str,
    patch_data: ComplaintPatch,
    current_user: Optional[User] = None
) -> ComplaintResponse:
    complaint = get_complaint_by_id_or_number(db, identifier)
    old_status = complaint.status
    old_priority = complaint.priority

    # Coordinates
    if patch_data.latitude is not None:
        complaint.latitude = patch_data.latitude
    if patch_data.longitude is not None:
        complaint.longitude = patch_data.longitude
    if patch_data.coordinates:
        complaint.latitude = patch_data.coordinates.lat
        complaint.longitude = patch_data.coordinates.lng

    # Fields
    if patch_data.title:
        complaint.title = patch_data.title
    if patch_data.description:
        complaint.description = patch_data.description
    if patch_data.category:
        complaint.category = patch_data.category
    if patch_data.location:
        complaint.location = patch_data.location
    if patch_data.pipelineStep:
        complaint.pipeline_step = patch_data.pipelineStep
    if patch_data.pipelineStepName:
        complaint.pipeline_step_name = patch_data.pipelineStepName
    if patch_data.pipelinePercent:
        complaint.pipeline_percent = patch_data.pipelinePercent
    if patch_data.assignedCrew:
        complaint.assigned_crew = patch_data.assignedCrew
    if patch_data.resolutionDetails:
        complaint.resolution_details = patch_data.resolutionDetails
    if patch_data.resolvedTime:
        complaint.resolved_at = datetime.now(timezone.utc)

    # Priority change check
    if patch_data.priority and patch_data.priority != old_priority:
        complaint.priority = patch_data.priority
        update_sla_priority(db, complaint, patch_data.priority)

    # Status change check
    is_status_changed = bool(patch_data.status and patch_data.status != old_status)
    if is_status_changed:
        complaint.status = patch_data.status
        if patch_data.status == "Resolved":
            complaint.pipeline_step = 5
            complaint.pipeline_step_name = "Step 5 of 5: Certified Sign-off & Remediated"
            complaint.pipeline_percent = 100
            complaint.resolved_at = datetime.now(timezone.utc)

    # Add status history note if supplied or if status altered
    author_name = patch_data.updatedBy or (current_user.name if current_user else "Field Officer")
    author_role = patch_data.updaterRole or (current_user.role if current_user else "officer")
    note_text = patch_data.statusNote or patch_data.updateNote
    if not note_text and is_status_changed:
        note_text = f"Status transitioned from '{old_status}' to '{complaint.status}'."

    if note_text or is_status_changed:
        db.add(ComplaintUpdate(
            complaint_id=complaint.id,
            author_id=current_user.id if current_user else None,
            author_name=author_name,
            author_role=author_role,
            update_type="status_change" if is_status_changed else "note",
            previous_status=old_status,
            new_status=complaint.status,
            message=note_text or "Status updated in database."
        ))

    db.commit()
    db.refresh(complaint)

    # Invalidate cache and broadcast
    invalidate_pattern("complaints:*")
    publish_event(f"complaints:{complaint.id}", {
        "event": "complaint_updated",
        "complaint_number": complaint.complaint_number,
        "status": complaint.status,
        "priority": complaint.priority,
        "pipeline_step": complaint.pipeline_step
    })

    return format_complaint_response(complaint)

def delete_complaint(db: Session, identifier: str, current_user: User):
    """Delete complaint (Admin only)."""
    complaint = get_complaint_by_id_or_number(db, identifier)
    c_num = complaint.complaint_number
    db.delete(complaint)
    db.commit()
    invalidate_pattern("complaints:*")
    record_audit_log(
        db,
        entity_type="complaint",
        entity_id=c_num,
        action="DELETE",
        actor_id=current_user.id,
        actor_email=current_user.email,
        actor_role=current_user.role,
        change_summary=f"Incident {c_num} deleted by admin."
    )

def add_complaint_evidence(
    db: Session,
    identifier: str,
    data: ComplaintEvidenceCreate,
    current_user: Optional[User] = None
) -> ComplaintEvidence:
    complaint = get_complaint_by_id_or_number(db, identifier)
    ev = ComplaintEvidence(
        complaint_id=complaint.id,
        uploaded_by_id=current_user.id if current_user else None,
        evidence_type=data.evidence_type,
        file_url=data.file_url,
        file_name=data.file_name,
        file_size=data.file_size,
        mime_type=data.mime_type,
        description=data.description
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

def resolve_complaint(
    db: Session,
    identifier: str,
    data: ResolveComplaintRequest,
    current_user: Optional[User] = None
) -> ComplaintResponse:
    complaint = get_complaint_by_id_or_number(db, identifier)
    now = datetime.now(timezone.utc)
    
    complaint.status = "Resolved"
    complaint.pipeline_step = 5
    complaint.pipeline_step_name = "Step 5 of 5: Certified Sign-off"
    complaint.pipeline_percent = 100
    complaint.resolution_details = data.resolution_details
    complaint.resolved_at = now

    # Add after image if provided
    if data.after_image_url:
        db.add(ComplaintEvidence(
            complaint_id=complaint.id,
            uploaded_by_id=current_user.id if current_user else None,
            evidence_type="after",
            file_url=data.after_image_url,
            file_name="Remediation Inspection Photographic Proof",
            mime_type="image/jpeg",
            description="Resolution verification photograph"
        ))

    # Record resolution update
    author_name = current_user.name if current_user else "Municipal Field Officer"
    author_role = current_user.role if current_user else "officer"
    db.add(ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=current_user.id if current_user else None,
        author_name=author_name,
        author_role=author_role,
        update_type="resolution",
        previous_status="In Progress",
        new_status="Resolved",
        message=data.status_note or f"Incident remediated: {data.resolution_details}"
    ))

    # Decrement officer active count if assigned
    if complaint.assigned_officer:
        complaint.assigned_officer.active_complaint_count = max(0, complaint.assigned_officer.active_complaint_count - 1)

    db.commit()
    db.refresh(complaint)

    # Notify citizen
    if complaint.citizen_id:
        create_notification(
            db,
            user_id=complaint.citizen_id,
            title="Complaint Resolved & Certified",
            message=f"Your civic ticket {complaint.complaint_number} has been remediated and certified closed.",
            notification_type="resolved",
            complaint_id=complaint.id
        )

    record_audit_log(
        db,
        entity_type="complaint",
        entity_id=complaint.complaint_number,
        action="RESOLVE",
        actor_id=current_user.id if current_user else None,
        change_summary=f"Complaint {complaint.complaint_number} resolved: {data.resolution_details[:100]}"
    )

    invalidate_pattern("complaints:*")
    return format_complaint_response(complaint)

def submit_citizen_feedback(
    db: Session,
    identifier: str,
    data: CitizenFeedbackCreate,
    current_user: Optional[User] = None
) -> ComplaintResponse:
    complaint = get_complaint_by_id_or_number(db, identifier)
    complaint.feedback_rating = data.rating
    complaint.feedback_comment = data.comment
    complaint.feedback_submitted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(complaint)

    record_audit_log(
        db,
        entity_type="complaint",
        entity_id=complaint.complaint_number,
        action="FEEDBACK",
        actor_id=current_user.id if current_user else None,
        change_summary=f"Feedback submitted: Rating {data.rating}/5."
    )
    return format_complaint_response(complaint)
