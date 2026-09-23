import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DepartmentCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    default_sla_hours: int = 24

class DepartmentResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    default_sla_hours: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
