import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.database.models.complaint import Complaint, ComplaintAssignment, ComplaintUpdate
from backend.app.database.models.department import Department, Officer
from backend.app.database.models.user import User
from backend.app.core.exceptions import NotFoundException, BadRequestException
from backend.app.services.notification import create_notification
from backend.app.services.audit import record_audit_log
from backend.app.redis.pubsub import publish_event

def assign_complaint_to_department(
    db: Session,
    complaint: Complaint,
    department_id: uuid.UUID,
    admin_user: Optional[User] = None
) -> Complaint:
    dept = db.query(Department).filter(Department.id == department_id).first()
    if not dept:
        raise NotFoundException("Department not found")

    old_dept = complaint.department.name if complaint.department else "Unassigned"
    complaint.department_id = dept.id
    
    # Update pipeline step if currently at step 1
    if complaint.pipeline_step == 1:
        complaint.pipeline_step = 2
        complaint.pipeline_step_name = "Step 2 of 5: Work Order Issued & Routed"
        complaint.pipeline_percent = 40
        complaint.status = "Assigned & Scheduled"

    update_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=admin_user.id if admin_user else None,
        author_name=admin_user.name if admin_user else "Municipal Telemetry System",
        author_role=admin_user.role if admin_user else "system",
        update_type="dispatch",
        message=f"Department routing confirmed: reassigned from {old_dept} to {dept.name}."
    )
    db.add(update_entry)
    db.commit()
    db.refresh(complaint)

    record_audit_log(
        db,
        entity_type="complaint",
        entity_id=str(complaint.complaint_number),
        action="ASSIGN",
        actor_id=admin_user.id if admin_user else None,
        change_summary=f"Routed to department {dept.name}."
    )
    return complaint

def assign_complaint_to_officer(
    db: Session,
    complaint: Complaint,
    officer_id: uuid.UUID,
    assigned_by_user: Optional[User] = None,
    notes: Optional[str] = None
) -> ComplaintAssignment:
    officer = db.query(Officer).filter(Officer.id == officer_id).first()
    if not officer:
        raise NotFoundException("Field officer not found")

    # Mark any existing active assignments as reassigned
    active_assignments = db.query(ComplaintAssignment).filter(
        ComplaintAssignment.complaint_id == complaint.id,
        ComplaintAssignment.status.in_(["Assigned", "Accepted", "In Progress"])
    ).all()
    for old_assign in active_assignments:
        old_assign.status = "Reassigned"
        old_assign.completed_at = datetime.now(timezone.utc)

    # Create new assignment record
    new_assign = ComplaintAssignment(
        complaint_id=complaint.id,
        officer_id=officer.id,
        assigned_by_id=assigned_by_user.id if assigned_by_user else None,
        status="Assigned",
        notes=notes or "Assigned for on-site municipal investigation."
    )
    db.add(new_assign)

    # Update complaint state
    complaint.assigned_officer_id = officer.id
    complaint.department_id = officer.department_id
    if complaint.pipeline_step < 3:
        complaint.pipeline_step = 2
        complaint.pipeline_step_name = f"Step 2 of 5: Assigned to Officer {officer.user.name}"
        complaint.pipeline_percent = 40
        complaint.status = "Assigned & Scheduled"

    officer.active_complaint_count += 1

    # Record update log
    update_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        author_id=assigned_by_user.id if assigned_by_user else None,
        author_name=assigned_by_user.name if assigned_by_user else "Civic Dispatch",
        author_role=assigned_by_user.role if assigned_by_user else "admin",
        update_type="dispatch",
        message=f"Ticket assigned to Officer {officer.user.name} ({officer.badge_number}) for field action."
    )
    db.add(update_entry)
    db.commit()
    db.refresh(complaint)
    db.refresh(new_assign)

    # Notify officer
    create_notification(
        db,
        user_id=officer.user_id,
        title="New Incident Work Order Assigned",
        message=f"Incident {complaint.complaint_number} ({complaint.title}) has been assigned to your unit.",
        notification_type="assigned",
        complaint_id=complaint.id
    )

    # Notify citizen
    if complaint.citizen_id:
        create_notification(
            db,
            user_id=complaint.citizen_id,
            title="Field Officer Assigned",
            message=f"Officer {officer.user.name} from {officer.department.name} has been assigned to your ticket {complaint.complaint_number}.",
            notification_type="status_changed",
            complaint_id=complaint.id
        )

    # Broadcast complaint update
    publish_event(f"complaints:{complaint.id}", {
        "event": "officer_assigned",
        "complaint_id": str(complaint.id),
        "officer_name": officer.user.name,
        "status": complaint.status
    })

    return new_assign
