from datetime import timedelta

import pytest
from django.utils import timezone

from membership.models import Patronage, PatronageStatus, Subscription, SubStatus
from membership.tests.factories import (
    PatronageFactory,
    SubscriptionFactory,
)


@pytest.mark.django_db
class TestExpireSubscriptions:
    def test_active_with_past_period_end_becomes_expired(self):
        sub = SubscriptionFactory(
            status=SubStatus.ACTIVE,
            period_end=timezone.now() - timedelta(hours=1),
        )
        from membership.tasks import expire_subscriptions

        count = expire_subscriptions.delay().get()
        sub.refresh_from_db()
        assert sub.status == SubStatus.EXPIRED
        assert count >= 1

    def test_active_with_future_period_end_stays_active(self):
        sub = SubscriptionFactory(
            status=SubStatus.ACTIVE,
            period_end=timezone.now() + timedelta(days=30),
        )
        from membership.tasks import expire_subscriptions

        expire_subscriptions.delay().get()
        sub.refresh_from_db()
        assert sub.status == SubStatus.ACTIVE

    def test_trialing_with_past_period_end_becomes_expired(self):
        sub = SubscriptionFactory(
            status=SubStatus.TRIALING,
            period_end=timezone.now() - timedelta(days=1),
        )
        from membership.tasks import expire_subscriptions

        expire_subscriptions.delay().get()
        sub.refresh_from_db()
        assert sub.status == SubStatus.EXPIRED


@pytest.mark.django_db
class TestCleanupStalePending:
    def test_old_incomplete_subscription_becomes_expired(self):
        sub = SubscriptionFactory(status=SubStatus.INCOMPLETE)
        old_time = timezone.now() - timedelta(hours=25)
        Subscription.objects.filter(pk=sub.pk).update(created_at=old_time)

        from membership.tasks import cleanup_stale_pending

        result = cleanup_stale_pending.delay().get()
        sub.refresh_from_db()
        assert sub.status == SubStatus.EXPIRED
        assert result["subscriptions"] >= 1

    def test_old_pending_patronage_becomes_canceled(self):
        pat = PatronageFactory(status=PatronageStatus.PENDING)
        old_time = timezone.now() - timedelta(hours=25)
        Patronage.objects.filter(pk=pat.pk).update(created_at=old_time)

        from membership.tasks import cleanup_stale_pending

        result = cleanup_stale_pending.delay().get()
        pat.refresh_from_db()
        assert pat.status == PatronageStatus.CANCELED
        assert result["patronages"] >= 1

    def test_fresh_incomplete_subscription_stays(self):
        sub = SubscriptionFactory(status=SubStatus.INCOMPLETE)
        # created_at is auto_now_add → just now, inside 24h window

        from membership.tasks import cleanup_stale_pending

        cleanup_stale_pending.delay().get()
        sub.refresh_from_db()
        assert sub.status == SubStatus.INCOMPLETE

    def test_fresh_pending_patronage_stays(self):
        pat = PatronageFactory(status=PatronageStatus.PENDING)
        # created_at is auto_now_add → just now, inside 24h window

        from membership.tasks import cleanup_stale_pending

        cleanup_stale_pending.delay().get()
        pat.refresh_from_db()
        assert pat.status == PatronageStatus.PENDING
