from datetime import timedelta

import pytest
from django.utils import timezone

from events.models import Registration, RegStatus
from events.tests.factories import RegistrationFactory


@pytest.mark.django_db
class TestCleanupStaleRegistrations:
    def test_old_pending_becomes_canceled(self):
        reg = RegistrationFactory(status=RegStatus.PENDING)
        old_time = timezone.now() - timedelta(hours=25)
        Registration.objects.filter(pk=reg.pk).update(created_at=old_time)

        from events.tasks import cleanup_stale_registrations

        count = cleanup_stale_registrations.delay().get()
        reg.refresh_from_db()
        assert reg.status == RegStatus.CANCELED
        assert count >= 1

    def test_fresh_pending_stays(self):
        reg = RegistrationFactory(status=RegStatus.PENDING)
        # created_at is auto_now_add → just now, inside 24h window

        from events.tasks import cleanup_stale_registrations

        cleanup_stale_registrations.delay().get()
        reg.refresh_from_db()
        assert reg.status == RegStatus.PENDING

    def test_confirmed_untouched(self):
        reg = RegistrationFactory(status=RegStatus.CONFIRMED)
        old_time = timezone.now() - timedelta(hours=25)
        Registration.objects.filter(pk=reg.pk).update(created_at=old_time)

        from events.tasks import cleanup_stale_registrations

        cleanup_stale_registrations.delay().get()
        reg.refresh_from_db()
        assert reg.status == RegStatus.CONFIRMED
