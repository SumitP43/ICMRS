import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models.department import Officer, Department
from backend.app.database.models.user import User
from backend.app.schemas.officers import OfficerCreate, OfficerResponse
from backend.app.core.permissions import require_role
from backend.app.core.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/officers", tags=["Officers"])

@router.get("", response_model=List[OfficerResponse])
@router.get("/", response_model=List[OfficerResponse])
def list_officers(
    department_id: Optional[uuid.UUID] = None,
    zone: Optional[str] = None,
    available_only: bool = False,
    db: Session = Depends(get_db)
):
    query = db.query(Officer)
    if department_id:
        query = query.filter(Officer.department_id == department_id)
    if zone:
        query = query.filter(Officer.zone == zone)
    if available_only:
        query = query.filter(Officer.is_available == True)

    officers = query.all()
    results = []
    for off in officers:
        results.append(OfficerResponse(
            id=off.id,
            user_id=off.user_id,
            user_name=off.user.name if off.user else "Officer",
            user_email=off.user.email if off.user else None,
            department_id=off.department_id,
            department_name=off.department.name if off.department else None,
            badge_number=off.badge_number,
            title=off.title,
            zone=off.zone,
            is_available=off.is_available,
            active_complaint_count=off.active_complaint_count,
            created_at=off.created_at
        ))
    return results

@router.post("", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED)
def create_officer(
    data: OfficerCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise NotFoundException("User not found")
    dept = db.query(Department).filter(Department.id == data.department_id).first()
    if not dept:
        raise NotFoundException("Department not found")

    existing = db.query(Officer).filter(Officer.badge_number == data.badge_number).first()
    if existing:
        raise ConflictException("An officer with this badge number already exists")

    officer = Officer(
        user_id=data.user_id,
        department_id=data.department_id,
        badge_number=data.badge_number,
        title=data.title,
        zone=data.zone,
        is_available=True,
        active_complaint_count=0
    )
    user.role = "officer"
    user.badge_number = data.badge_number
    user.department_id = data.department_id

    db.add(officer)
    db.commit()
    db.refresh(officer)

    return OfficerResponse(
        id=officer.id,
        user_id=officer.user_id,
        user_name=user.name,
        user_email=user.email,
        department_id=officer.department_id,
        department_name=dept.name,
        badge_number=officer.badge_number,
        title=officer.title,
        zone=officer.zone,
        is_available=officer.is_available,
        active_complaint_count=officer.active_complaint_count,
        created_at=officer.created_at
    )

@router.get("/{id}", response_model=OfficerResponse)
def get_officer(id: uuid.UUID, db: Session = Depends(get_db)):
    off = db.query(Officer).filter(Officer.id == id).first()
    if not off:
        raise NotFoundException("Officer not found")
    return OfficerResponse(
        id=off.id,
        user_id=off.user_id,
        user_name=off.user.name if off.user else "Officer",
        user_email=off.user.email if off.user else None,
        department_id=off.department_id,
        department_name=off.department.name if off.department else None,
        badge_number=off.badge_number,
        title=off.title,
        zone=off.zone,
        is_available=off.is_available,
        active_complaint_count=off.active_complaint_count,
        created_at=off.created_at
    )
