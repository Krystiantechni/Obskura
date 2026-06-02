import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from notifications.models import NotificationKind, StreamStatus
from notifications.tests.factories import NotificationFactory

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _authed_client(user):
    """Return APIClient force-authenticated as user."""
    c = APIClient()
    c.force_authenticate(user=user)
    return c


# ---------------------------------------------------------------------------
# GET /api/v1/notifications — list (own only, cursor-paginated, auth required)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestNotificationList:
    URL = "/api/v1/notifications"

    def test_unauthenticated_returns_401(self):
        res = APIClient().get(self.URL)
        assert res.status_code == 401

    def test_authenticated_returns_200_with_results(self):
        user = UserFactory()
        NotificationFactory.create_batch(3, user=user)
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        body = res.json()
        assert "results" in body
        assert len(body["results"]) == 3

    def test_only_own_notifications_returned(self):
        user = UserFactory()
        other = UserFactory()
        NotificationFactory.create_batch(2, user=user)
        NotificationFactory.create_batch(5, user=other)
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        results = res.json()["results"]
        assert len(results) == 2

    def test_empty_list_for_user_with_no_notifications(self):
        user = UserFactory()
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        body = res.json()
        assert body["results"] == []

    def test_notification_fields_present(self):
        user = UserFactory()
        n = NotificationFactory(
            user=user,
            kind=NotificationKind.SYSTEM,
            title="Test title",
            body="Test body",
        )
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        item = res.json()["results"][0]
        assert item["id"] == n.id
        assert item["kind"] == "system"
        assert item["title"] == "Test title"
        assert item["body"] == "Test body"
        assert "read_at" in item
        assert "created_at" in item


# ---------------------------------------------------------------------------
# GET /api/v1/notifications/unread-count — unread counter
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestUnreadCount:
    URL = "/api/v1/notifications/unread-count"

    def test_unauthenticated_returns_401(self):
        res = APIClient().get(self.URL)
        assert res.status_code == 401

    def test_returns_unread_count(self):
        user = UserFactory()
        NotificationFactory.create_batch(3, user=user, read_at=None)
        NotificationFactory(user=user, read_at=timezone.now())
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        body = res.json()
        assert body == {"unread": 3}

    def test_zero_when_all_read(self):
        user = UserFactory()
        NotificationFactory.create_batch(2, user=user, read_at=timezone.now())
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        assert res.json() == {"unread": 0}

    def test_only_counts_own_user(self):
        user = UserFactory()
        other = UserFactory()
        NotificationFactory.create_batch(5, user=other, read_at=None)
        res = _authed_client(user).get(self.URL)
        assert res.status_code == 200
        assert res.json() == {"unread": 0}


# ---------------------------------------------------------------------------
# POST /api/v1/notifications/{id}/read — mark single notification read
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMarkRead:
    def _url(self, pk):
        return f"/api/v1/notifications/{pk}/read"

    def test_unauthenticated_returns_401(self):
        n = NotificationFactory()
        res = APIClient().post(self._url(n.pk))
        assert res.status_code == 401

    def test_marks_own_notification_read(self):
        user = UserFactory()
        n = NotificationFactory(user=user, read_at=None)
        res = _authed_client(user).post(self._url(n.pk))
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == n.id
        assert body["read_at"] is not None
        n.refresh_from_db()
        assert n.read_at is not None

    def test_another_users_notification_returns_404(self):
        user = UserFactory()
        other = UserFactory()
        n = NotificationFactory(user=other, read_at=None)
        res = _authed_client(user).post(self._url(n.pk))
        assert res.status_code == 404

    def test_already_read_notification_not_changed(self):
        user = UserFactory()
        read_time = timezone.now() - timezone.timedelta(hours=1)
        n = NotificationFactory(user=user, read_at=read_time)
        res = _authed_client(user).post(self._url(n.pk))
        assert res.status_code == 200
        n.refresh_from_db()
        # read_at should remain the original value (not overwritten)
        assert abs((n.read_at - read_time).total_seconds()) < 1

    def test_nonexistent_notification_returns_404(self):
        user = UserFactory()
        res = _authed_client(user).post(self._url(99999))
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# POST /api/v1/notifications/read-all — mark all own unread as read
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestMarkAllRead:
    URL = "/api/v1/notifications/read-all"

    def test_unauthenticated_returns_401(self):
        res = APIClient().post(self.URL)
        assert res.status_code == 401

    def test_marks_all_own_unread(self):
        user = UserFactory()
        NotificationFactory.create_batch(4, user=user, read_at=None)
        res = _authed_client(user).post(self.URL)
        assert res.status_code == 200
        body = res.json()
        assert body == {"updated": 4}
        from notifications.models import Notification

        unread = Notification.objects.filter(user=user, read_at__isnull=True).count()
        assert unread == 0

    def test_does_not_affect_already_read(self):
        user = UserFactory()
        NotificationFactory.create_batch(2, user=user, read_at=None)
        NotificationFactory.create_batch(3, user=user, read_at=timezone.now())
        res = _authed_client(user).post(self.URL)
        assert res.status_code == 200
        assert res.json() == {"updated": 2}

    def test_does_not_affect_other_users(self):
        user = UserFactory()
        other = UserFactory()
        NotificationFactory.create_batch(3, user=other, read_at=None)
        NotificationFactory(user=user, read_at=None)
        res = _authed_client(user).post(self.URL)
        assert res.status_code == 200
        assert res.json() == {"updated": 1}
        # other user's notifications stay unread
        from notifications.models import Notification

        still_unread = Notification.objects.filter(user=other, read_at__isnull=True).count()
        assert still_unread == 3

    def test_zero_updated_when_nothing_to_mark(self):
        user = UserFactory()
        res = _authed_client(user).post(self.URL)
        assert res.status_code == 200
        assert res.json() == {"updated": 0}


# ---------------------------------------------------------------------------
# GET /api/v1/stream/status — public stream status
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestStreamStatus:
    URL = "/api/v1/stream/status"

    def test_public_no_auth_required(self):
        res = APIClient().get(self.URL)
        assert res.status_code == 200

    def test_returns_stream_status_fields(self):
        res = APIClient().get(self.URL)
        assert res.status_code == 200
        body = res.json()
        assert "is_live" in body
        assert "title" in body
        assert "started_at" in body

    def test_reflects_singleton_state(self):
        s = StreamStatus.load()
        s.is_live = True
        s.title = "Horror Night"
        s.save()
        res = APIClient().get(self.URL)
        assert res.status_code == 200
        body = res.json()
        assert body["is_live"] is True
        assert body["title"] == "Horror Night"

    def test_default_is_offline(self):
        res = APIClient().get(self.URL)
        body = res.json()
        assert body["is_live"] is False
