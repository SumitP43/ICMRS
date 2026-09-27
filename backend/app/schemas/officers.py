import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class OfficerCreate(BaseModel):
    user_id: uuid.UUID
    department_id: uuid.UUID
    badge_number: str
    title: str = "Municipal Field Officer"
    zone: str = "District 04 (Central)"

class OfficerResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    department_id: uuid.UUID
    department_name: Optional[str] = None
    badge_number: str
    title: str
    zone: str
    is_available: bool
    active_complaint_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class AssignOfficerRequest(BaseModel):
    officer_id: uuid.UUID
    notes: Optional[str] = None
