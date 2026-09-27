import uuid
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from backend.app.database.models.user import User
    from backend.app.database.models.complaint import Complaint, ComplaintAssignment

class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    default_sla_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    members: Mapped[List["User"]] = relationship("User", foreign_keys="[User.department_id]", back_populates="department")
    officers: Mapped[List["Officer"]] = relationship("Officer", back_populates="department", cascade="all, delete-orphan")
    complaints: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="department")

class Officer(Base, TimestampMixin):
    __tablename__ = "officers"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False, index=True)
    badge_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(100), default="Municipal Field Officer", nullable=False)
    zone: Mapped[str] = mapped_column(String(100), default="District 04 (Central)", nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active_complaint_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="officer_profile")
    department: Mapped["Department"] = relationship("Department", back_populates="officers")
    assigned_complaints: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="assigned_officer")
    assignments: Mapped[List["ComplaintAssignment"]] = relationship("ComplaintAssignment", back_populates="officer")

    __table_args__ = (
        Index("ix_officers_dept_available", "department_id", "is_available"),
    )
