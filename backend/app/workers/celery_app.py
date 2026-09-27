import os
from backend.app.config import settings
from backend.app.core.logging import logger

try:
    from celery import Celery
    celery_app = Celery(
        "icmrs_worker",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
        include=[
            "backend.app.workers.ai_tasks",
            "backend.app.workers.notification_tasks",
            "backend.app.workers.sla_tasks",
        ]
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        task_track_started=True,
        task_time_limit=300,
        beat_schedule={
            "check-sla-breaches-every-5-minutes": {
                "task": "backend.app.workers.sla_tasks.check_all_sla_deadlines",
                "schedule": 300.0,
            }
        }
    )
except ImportError:
    celery_app = None
    logger.info("Celery library not loaded. Worker tasks will execute through integrated asynchronous executor.")
