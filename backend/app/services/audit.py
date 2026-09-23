import uuid
from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from backend.app.database.models.audit import AuditLog
from backend.app.core.logging import logger

def record_audit_log(
    db: Session,
    entity_type: str,
    entity_id: str,
    action: str,
    change_summary: str,
    actor_id: Optional[uuid.UUID] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Record immutable audit log entry."""
    try:
        log_entry = AuditLog(
            entity_type=entity_type,
            entity_id=str(entity_id),
            action=action,
            actor_id=actor_id,
            actor_email=actor_email,
            actor_role=actor_role,
            ip_address=ip_address,
            change_summary=change_summary,
            details=details or {}
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
        db.rollback()
        raise
