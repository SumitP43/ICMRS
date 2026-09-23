from backend.app.database.session import SessionLocal
from backend.app.services.sla import check_all_sla_deadlines
from backend.app.core.logging import logger

def check_all_sla_deadlines_task():
    """Periodic Celery / background task to monitor SLA deadlines."""
    db = SessionLocal()
    try:
        check_all_sla_deadlines(db)
        logger.info("SLA monitoring check completed successfully.")
    except Exception as e:
        logger.error(f"Error checking SLA deadlines: {e}")
    finally:
        db.close()
