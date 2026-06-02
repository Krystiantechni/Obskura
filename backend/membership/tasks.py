from datetime import timedelta

from celery import shared_task
from django.utils import timezone


@shared_task
def expire_subscriptions():
    from membership.models import Subscription, SubStatus

    return Subscription.objects.filter(
        status__in=[SubStatus.TRIALING, SubStatus.ACTIVE],
        period_end__isnull=False,
        period_end__lt=timezone.now(),
    ).update(status=SubStatus.EXPIRED)


@shared_task
def cleanup_stale_pending():
    from membership.models import Patronage, PatronageStatus, Subscription, SubStatus

    cutoff = timezone.now() - timedelta(hours=24)
    subs = Subscription.objects.filter(status=SubStatus.INCOMPLETE, created_at__lt=cutoff).update(
        status=SubStatus.EXPIRED
    )
    pats = Patronage.objects.filter(status=PatronageStatus.PENDING, created_at__lt=cutoff).update(
        status=PatronageStatus.CANCELED
    )
    return {"subscriptions": subs, "patronages": pats}
