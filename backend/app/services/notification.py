import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.database.models.notification import Notification
from backend.app.redis.pubsub import publish_event
from backend.app.core.logging import logger

def create_notification(
    db: Session,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str = "complaint_created",
    complaint_id: Optional[uuid.UUID] = None
) -> Notification:
    """Create in-app notification and broadcast via WebSocket / PubSub."""
    notif = Notification(
        user_id=user_id,
        complaint_id=complaint_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Broadcast notification to user's real-time channel
    publish_event(f"notifications:{user_id}", {
        "id": str(notif.id),
        "user_id": str(user_id),
        "complaint_id": str(complaint_id) if complaint_id else None,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "created_at": notif.created_at.isoformat()
    })

    # Broadcast to global broadcast channel for admins/officers
    publish_event("notifications:global", {
        "id": str(notif.id),
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "created_at": notif.created_at.isoformat()
    })

    return notif

def get_user_notifications(db: Session, user_id: uuid.UUID, limit: int = 50) -> List[Notification]:
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(limit).all()

def mark_notification_as_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif

def mark_all_notifications_as_read(db: Session, user_id: uuid.UUID) -> int:
    updated = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return updated
