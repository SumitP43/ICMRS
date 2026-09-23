import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple, Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database.models.sla import SLARecord
from backend.app.database.models.complaint import Complaint
from backend.app.services.notification import create_notification
from backend.app.services.audit import record_audit_log
from backend.app.core.logging import logger

def get_max_hours_for_priority(priority: str) -> int:
    p = priority.capitalize()
    if p == "Critical":
        return settings.SLA_CRITICAL_HOURS
    elif p == "High":
        return settings.SLA_HIGH_HOURS
    elif p == "Medium":
        return settings.SLA_MEDIUM_HOURS
    elif p == "Low":
        return settings.SLA_LOW_HOURS
    return settings.SLA_HIGH_HOURS

def create_sla_record(db: Session, complaint: Complaint) -> SLARecord:
    """Create new SLA tracking record for complaint."""
    max_hours = get_max_hours_for_priority(complaint.priority)
    now = datetime.now(timezone.utc)
    deadline = now + timedelta(hours=max_hours)

    record = SLARecord(
        complaint_id=complaint.id,
        max_hours=max_hours,
        deadline=deadline,
        is_breached=False,
        warning_sent=False,
        escalation_level=0
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def update_sla_priority(db: Session, complaint: Complaint, new_priority: str) -> SLARecord:
    """Recalculate SLA record when priority is altered."""
    record = db.query(SLARecord).filter(SLARecord.complaint_id == complaint.id).first()
    if not record:
        complaint.priority = new_priority
        return create_sla_record(db, complaint)

    max_hours = get_max_hours_for_priority(new_priority)
    created = complaint.created_at
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
        
    deadline = created + timedelta(hours=max_hours)
    now = datetime.now(timezone.utc)

    record.max_hours = max_hours
    record.deadline = deadline
    record.is_breached = (now > deadline)
    if record.is_breached:
        record.breached_at = record.breached_at or now
        record.escalation_level = 2

    db.commit()
    db.refresh(record)
    return record

def compute_sla_display(complaint: Complaint, sla_record: SLARecord) -> Tuple[str, str, int]:
    """
    Format SLA remaining string, status tag, and total hours for frontend UI.
    Returns: (sla_remaining_str, sla_status: 'urgent'|'warning'|'nominal'|'resolved', total_hours)
    """
    if complaint.status == "Resolved":
        return "Certified Closed", "resolved", sla_record.max_hours

    now = datetime.now(timezone.utc)
    deadline = sla_record.deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)

    diff_seconds = (deadline - now).total_seconds()

    if diff_seconds <= 0:
        overdue_h = int(abs(diff_seconds) // 3600)
        overdue_m = int((abs(diff_seconds) % 3600) // 60)
        return f"SLA Breached ({overdue_h}h {overdue_m}m overdue)", "urgent", sla_record.max_hours

    hours = int(diff_seconds // 3600)
    mins = int((diff_seconds % 3600) // 60)

    total_seconds = sla_record.max_hours * 3600
    ratio = diff_seconds / (total_seconds or 1)

    if ratio <= 0.20 or complaint.priority == "Critical":
        status_tag = "urgent"
    elif ratio <= 0.40:
        status_tag = "warning"
    else:
        status_tag = "nominal"

    remaining_str = f"{hours}h {mins:02d}m SLA remaining"
    return remaining_str, status_tag, sla_record.max_hours

def check_all_sla_deadlines(db: Session):
    """Periodic task: detect approaching breaches and breached complaints."""
    now = datetime.now(timezone.utc)
    active_slas = db.query(SLARecord).join(Complaint).filter(Complaint.status != "Resolved").all()

    for sla in active_slas:
        complaint = sla.complaint
        deadline = sla.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        diff = (deadline - now).total_seconds()
        total = sla.max_hours * 3600

        # Check breach
        if diff <= 0 and not sla.is_breached:
            sla.is_breached = True
            sla.breached_at = now
            sla.escalation_level = 2
            db.commit()

            # Create notification
            if complaint.citizen_id:
                create_notification(
                    db,
                    user_id=complaint.citizen_id,
                    title="SLA Update Notice",
                    message=f"Ticket {complaint.complaint_number} is undergoing emergency supervisor escalation.",
                    notification_type="sla_breach",
                    complaint_id=complaint.id
                )
            record_audit_log(
                db,
                entity_type="sla",
                entity_id=str(complaint.complaint_number),
                action="ESCALATE",
                change_summary=f"SLA deadline breached for ticket {complaint.complaint_number}."
            )
        # Check warning (80% elapsed)
        elif diff > 0 and (diff / total) <= 0.20 and not sla.warning_sent:
            sla.warning_sent = True
            sla.escalation_level = 1
            db.commit()
