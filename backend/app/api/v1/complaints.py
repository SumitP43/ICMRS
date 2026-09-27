import uuid
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.schemas.common import ResponseEnvelope
from backend.app.schemas.complaints import (
    ComplaintCreate,
    ComplaintPatch,
    ComplaintResponse,
    ComplaintEvidenceCreate,
    ResolveComplaintRequest,
    CitizenFeedbackCreate
)
from backend.app.schemas.officers import AssignOfficerRequest
from backend.app.database.models.user import User
from backend.app.core.permissions import get_current_user, get_optional_current_user, require_role
from backend.app.services.complaint import (
    create_complaint,
    get_complaints,
    get_complaint_by_id_or_number,
    patch_complaint,
    delete_complaint,
    add_complaint_evidence,
    resolve_complaint,
    submit_citizen_feedback,
    format_complaint_response
)
from backend.app.services.assignment import assign_complaint_to_officer, assign_complaint_to_department
from backend.app.database.models.complaint import ComplaintUpdate

router = APIRouter(prefix="/complaints", tags=["Complaints"])

@router.get("", response_model=List[ComplaintResponse])
@router.get("/", response_model=List[ComplaintResponse])
def list_complaints(
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department_id: Optional[uuid.UUID] = None,
    assigned_officer_id: Optional[uuid.UUID] = None,
    citizen_id: Optional[uuid.UUID] = None,
    citizen_email: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    return get_complaints(
        db=db,
        category=category,
        status=status,
        priority=priority,
        department_id=department_id,
        assigned_officer_id=assigned_officer_id,
        citizen_id=citizen_id,
        citizen_email=citizen_email,
        search=search,
        limit=limit,
        offset=offset
    )

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def file_complaint(
    data: ComplaintCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return create_complaint(db, data, current_user)

@router.get("/{identifier}", response_model=ComplaintResponse)
def get_complaint(
    identifier: str,
    db: Session = Depends(get_db)
):
    complaint = get_complaint_by_id_or_number(db, identifier)
    return format_complaint_response(complaint)

@router.patch("/{identifier}", response_model=ComplaintResponse)
def update_complaint(
    identifier: str,
    data: ComplaintPatch,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return patch_complaint(db, identifier, data, current_user)

@router.delete("/{identifier}", status_code=status.HTTP_204_NO_CONTENT)
def remove_complaint(
    identifier: str,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    delete_complaint(db, identifier, current_user)
    return None

@router.post("/{identifier}/evidence", response_model=ResponseEnvelope[dict])
def upload_evidence(
    identifier: str,
    data: ComplaintEvidenceCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    ev = add_complaint_evidence(db, identifier, data, current_user)
    return ResponseEnvelope(
        success=True,
        message="Evidence recorded successfully",
        data={
            "id": str(ev.id),
            "file_url": ev.file_url,
            "evidence_type": ev.evidence_type,
            "created_at": ev.created_at.isoformat()
        }
    )

@router.post("/{identifier}/resolve", response_model=ComplaintResponse)
def resolve_ticket(
    identifier: str,
    data: ResolveComplaintRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return resolve_complaint(db, identifier, data, current_user)

@router.post("/{identifier}/feedback", response_model=ComplaintResponse)
def rate_resolution(
    identifier: str,
    data: CitizenFeedbackCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    return submit_citizen_feedback(db, identifier, data, current_user)

@router.post("/{identifier}/assign", response_model=ComplaintResponse)
def assign_officer(
    identifier: str,
    data: AssignOfficerRequest,
    current_user: User = Depends(require_role(["admin", "officer"])),
    db: Session = Depends(get_db)
):
    complaint = get_complaint_by_id_or_number(db, identifier)
    assign_complaint_to_officer(db, complaint, data.officer_id, current_user, data.notes)
    return format_complaint_response(complaint)

@router.post("/{identifier}/notes", response_model=ComplaintResponse)
def add_note(
    identifier: str,
    note_payload: Dict[str, Any],
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    complaint = get_complaint_by_id_or_number(db, identifier)
    author_name = note_payload.get("author") or (current_user.name if current_user else "Field Officer")
    author_role = note_payload.get("role") or (current_user.role if current_user else "officer")
    note_text = note_payload.get("text") or note_payload.get("message") or ""

    if note_text:
        db.add(ComplaintUpdate(
            complaint_id=complaint.id,
            author_id=current_user.id if current_user else None,
            author_name=author_name,
            author_role=author_role,
            update_type="note",
            message=note_text
        ))
        db.commit()
        db.refresh(complaint)

    return format_complaint_response(complaint)
