"""
SpaceMind OS — Celery Application
Broker: Redis.  Beat: daily maintenance + medical expiry checks at 06:00 UTC.
"""
from celery import Celery
from celery.schedules import crontab

from spacemind.core.config import settings

celery_app = Celery(
    "spacemind",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["spacemind.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "maintenance-check-daily": {
            "task": "spacemind.workers.tasks.check_maintenance_alerts",
            "schedule": crontab(hour=6, minute=0),
            "kwargs": {},
        },
        "medical-expiry-check-daily": {
            "task": "spacemind.workers.tasks.check_medical_expiry",
            "schedule": crontab(hour=6, minute=5),
            "kwargs": {"days_ahead": 30},
        },
    },
)
