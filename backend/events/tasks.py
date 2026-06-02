from datetime import timedelta

from celery import shared_task
from django.utils import timezone


@shared_task
def cleanup_stale_registrations():
    from events.models import Registration, RegStatus

    cutoff = timezone.now() - timedelta(hours=24)
    return Registration.objects.filter(
        status=RegStatus.PENDING, created_at__lt=cutoff
    ).update(status=RegStatus.CANCELED)
