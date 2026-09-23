import uuid
from backend.app.database.session import SessionLocal
from backend.app.services.notification import create_notification
from backend.app.core.logging import logger

def dispatch_notification_task(
    user_id_str: str,
    title: str,
    message: str,
    notification_type: str = "complaint_created",
    complaint_id_str: str = None
):
    """Background task to dispatch push/WebSocket notification."""
    db = SessionLocal()
    try:
        user_id = uuid.UUID(user_id_str)
        complaint_id = uuid.UUID(complaint_id_str) if complaint_id_str else None
        create_notification(db, user_id, title, message, notification_type, complaint_id)
    except Exception as e:
        logger.error(f"Error executing notification task: {e}")
    finally:
        db.close()
