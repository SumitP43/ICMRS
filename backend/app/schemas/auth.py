import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: Optional[str] = Field(default="citizen", pattern="^(citizen|officer|admin)$")
    phone: Optional[str] = None
    ward_or_sector: Optional[str] = None
    badge_number: Optional[str] = None
    department_id: Optional[uuid.UUID] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    ward_or_sector: Optional[str] = None
    badge_number: Optional[str] = None
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
