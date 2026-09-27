import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models.department import Department
from backend.app.schemas.departments import DepartmentCreate, DepartmentResponse
from backend.app.schemas.common import ResponseEnvelope
from backend.app.core.permissions import require_role
from backend.app.database.models.user import User
from backend.app.core.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=List[DepartmentResponse])
@router.get("/", response_model=List[DepartmentResponse])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).filter(Department.is_active == True).all()

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Department).filter(
        (Department.code == data.code) | (Department.name == data.name)
    ).first()
    if existing:
        raise ConflictException("A department with this code or name already exists")

    dept = Department(
        code=data.code,
        name=data.name,
        description=data.description,
        contact_email=data.contact_email,
        contact_phone=data.contact_phone,
        default_sla_hours=data.default_sla_hours,
        is_active=True
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/{id}", response_model=DepartmentResponse)
def get_department(id: uuid.UUID, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise NotFoundException("Department not found")
    return dept
