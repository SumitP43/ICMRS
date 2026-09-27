import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database.base import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from backend.app.database.models.complaint import Complaint

class SLARecord(Base, TimestampMixin):
    __tablename__ = "sla_records"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    complaint_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("complaints.id", ondelete="CASCADE"), unique=True, nullable=False)
    max_hours: Mapped[int] = mapped_column(Integer, default=24, nullable=False)
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_breached: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    breached_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    warning_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    escalation_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0: Nominal, 1: Warning, 2: Breached / Critical

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="sla_record")

    __table_args__ = (
        Index("ix_sla_records_breach_check", "is_breached", "deadline"),
    )
