import uuid
from backend.app.database.session import SessionLocal
from backend.app.database.models.complaint import Complaint
from backend.app.services.ai import run_ai_complaint_analysis
from backend.app.core.logging import logger

def process_complaint_ai_task(complaint_id: str):
    """Background task to run AI classification, prioritization and duplicate detection."""
    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter(Complaint.id == uuid.UUID(complaint_id)).first()
        if complaint:
            run_ai_complaint_analysis(db, complaint)
            logger.info(f"AI task completed for complaint {complaint.complaint_number}")
    except Exception as e:
        logger.error(f"Error executing AI background task for complaint {complaint_id}: {e}")
    finally:
        db.close()
