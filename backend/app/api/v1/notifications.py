import uuid
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.database.models.user import User
from backend.app.schemas.notifications import NotificationResponse
from backend.app.schemas.common import ResponseEnvelope
from backend.app.core.permissions import get_current_user
from backend.app.services.notification import (
    get_user_notifications,
    mark_notification_as_read,
    mark_all_notifications_as_read
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
@router.get("/", response_model=List[NotificationResponse])
def list_my_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_notifications(db, current_user.id, limit=limit)

@router.patch("/{id}/read", response_model=ResponseEnvelope[dict])
def read_notification(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = mark_notification_as_read(db, id, current_user.id)
    return ResponseEnvelope(
        success=True,
        message="Notification marked as read",
        data={"id": str(id), "is_read": True}
    )

@router.post("/read-all", response_model=ResponseEnvelope[dict])
def read_all(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated = mark_all_notifications_as_read(db, current_user.id)
    return ResponseEnvelope(
        success=True,
        message=f"Marked {updated} notification(s) as read",
        data={"updated_count": updated}
    )
