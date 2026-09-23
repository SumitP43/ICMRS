import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    complaint_id: Optional[uuid.UUID] = None
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
