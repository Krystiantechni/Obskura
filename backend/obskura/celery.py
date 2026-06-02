import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")

app = Celery("obskura")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
