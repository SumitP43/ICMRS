import uuid
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from backend.app.database.models.user import User
    from backend.app.database.models.department import Department, Officer
    from backend.app.database.models.sla import SLARecord
    from backend.app.database.models.notification import Notification

class Complaint(Base, TimestampMixin):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    complaint_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Status: 'Pending Triage', 'In Progress', 'Assigned & Scheduled', 'Dispatched', 'Under Review', 'Resolved'
    status: Mapped[str] = mapped_column(String(50), default="Pending Triage", nullable=False, index=True)
    
    # Priority: 'Low', 'Medium', 'High', 'Critical'
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False, index=True)
    
    # Citizen details
    citizen_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    citizen_name: Mapped[str] = mapped_column(String(255), nullable=False)
    citizen_email: Mapped[str] = mapped_column(String(255), nullable=False)
    citizen_token: Mapped[Optional[str]] = mapped_column(String(100), default="Verified Resident", nullable=True)

    # Assignment details
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_officer_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("officers.id", ondelete="SET NULL"), nullable=True, index=True)
    assigned_crew: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Telemetry Pipeline tracking
    pipeline_step: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # 1 to 5
    pipeline_step_name: Mapped[str] = mapped_column(String(100), default="Step 1 of 5: Telemetry Received & Dispatched", nullable=False)
    pipeline_percent: Mapped[int] = mapped_column(Integer, default=20, nullable=False)

    # Duplicate detection linkage
    is_duplicate: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    duplicate_of_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("complaints.id", ondelete="SET NULL"), nullable=True)
    duplicate_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Resolution & Feedback
    resolution_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    feedback_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    feedback_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback_submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    citizen: Mapped[Optional["User"]] = relationship("User", foreign_keys=[citizen_id], back_populates="complaints_filed")
    department: Mapped[Optional["Department"]] = relationship("Department", back_populates="complaints")
    assigned_officer: Mapped[Optional["Officer"]] = relationship("Officer", back_populates="assigned_complaints")
    ai_analysis: Mapped[Optional["ComplaintAIAnalysis"]] = relationship("ComplaintAIAnalysis", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    assignments: Mapped[List["ComplaintAssignment"]] = relationship("ComplaintAssignment", back_populates="complaint", cascade="all, delete-orphan", order_by="desc(ComplaintAssignment.assigned_at)")
    evidence: Mapped[List["ComplaintEvidence"]] = relationship("ComplaintEvidence", back_populates="complaint", cascade="all, delete-orphan")
    updates: Mapped[List["ComplaintUpdate"]] = relationship("ComplaintUpdate", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintUpdate.created_at")
    sla_record: Mapped[Optional["SLARecord"]] = relationship("SLARecord", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="complaint", cascade="all, delete-orphan")
    duplicates: Mapped[List["Complaint"]] = relationship("Complaint", back_populates="parent_complaint", foreign_keys=[duplicate_of_id])
    parent_complaint: Mapped[Optional["Complaint"]] = relationship("Complaint", back_populates="duplicates", remote_side=[id], foreign_keys=[duplicate_of_id])

    __table_args__ = (
        Index("ix_complaints_geo", "latitude", "longitude"),
        Index("ix_complaints_status_priority", "status", "priority"),
        Index("ix_complaints_created_at", "created_at"),
    )

class ComplaintAIAnalysis(Base, TimestampMixin):
    __tablename__ = "complaint_ai_analysis"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True, nullable=False)
    predicted_category: Mapped[str] = mapped_column(String(100), nullable=False)
    predicted_priority: Mapped[str] = mapped_column(String(20), nullable=False)
    recommended_department_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    recommended_crew: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    severity_score: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.90, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="gemini-3.8-flash", nullable=False)

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="ai_analysis")

class ComplaintAssignment(Base, TimestampMixin):
    __tablename__ = "complaint_assignments"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    officer_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("officers.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="Assigned", nullable=False)  # 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Reassigned'
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="assignments")
    officer: Mapped["Officer"] = relationship("Officer", back_populates="assignments")

class ComplaintEvidence(Base, TimestampMixin):
    __tablename__ = "complaint_evidence"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    evidence_type: Mapped[str] = mapped_column(String(50), default="initial_photo", nullable=False)  # 'initial_photo', 'investigation', 'before', 'after', 'document'
    file_url: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str] = mapped_column(String(100), default="image/jpeg", nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="evidence")

class ComplaintUpdate(Base, TimestampMixin):
    __tablename__ = "complaint_updates"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    author_name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_role: Mapped[str] = mapped_column(String(50), default="officer", nullable=False)
    update_type: Mapped[str] = mapped_column(String(50), default="note", nullable=False)  # 'status_change', 'note', 'dispatch', 'escalation', 'resolution'
    previous_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="updates")
