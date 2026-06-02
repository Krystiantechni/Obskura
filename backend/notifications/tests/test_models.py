import pytest

from accounts.tests.factories import UserFactory
from notifications.models import Notification, NotificationKind, StreamStatus
from notifications.tests.factories import NotificationFactory


@pytest.mark.django_db
class TestNotification:
    def test_create_notification_defaults(self):
        user = UserFactory()
        n = Notification.objects.create(
            user=user,
            kind=NotificationKind.SYSTEM,
            title="Test notification",
        )
        assert n.pk is not None
        assert n.read_at is None
        assert n.body == ""
        assert n.url == ""
        assert n.payload == {}

    def test_str(self):
        user = UserFactory()
        n = Notification.objects.create(
            user=user,
            kind=NotificationKind.REPLY,
            title="Odpowiedź",
        )
        assert f"u{user.id}" in str(n)
        assert "reply" in str(n)
        assert "Odpowiedź" in str(n)

    def test_is_unread_when_read_at_is_null(self):
        user = UserFactory()
        n = Notification.objects.create(
            user=user,
            kind=NotificationKind.SYSTEM,
            title="Unread",
        )
        assert n.read_at is None

    def test_factory_creates_notification(self):
        n = NotificationFactory()
        assert n.pk is not None
        assert n.kind == NotificationKind.SYSTEM
        assert n.title.startswith("Powiadomienie")

    def test_indexes_exist(self):
        index_fields = [tuple(idx.fields) for idx in Notification._meta.indexes]
        assert ("user", "-created_at") in index_fields
        assert ("user", "read_at") in index_fields


@pytest.mark.django_db
class TestStreamStatus:
    def test_load_returns_singleton(self):
        s = StreamStatus.load()
        assert s.pk == 1
        assert s.is_live is False

    def test_load_called_twice_returns_same_pk(self):
        s1 = StreamStatus.load()
        s2 = StreamStatus.load()
        assert s1.pk == s2.pk == 1
        assert StreamStatus.objects.count() == 1

    def test_second_save_keeps_pk_1(self):
        s1 = StreamStatus(is_live=True, title="Stream 1")
        s1.save()
        assert s1.pk == 1

        s2 = StreamStatus(is_live=False, title="Stream 2")
        s2.save()
        assert s2.pk == 1
        # Only one row in the table
        assert StreamStatus.objects.count() == 1

    def test_str_live(self):
        s = StreamStatus.load()
        s.is_live = True
        s.save()
        assert str(s) == "LIVE"

    def test_str_offline(self):
        s = StreamStatus.load()
        s.is_live = False
        s.save()
        assert str(s) == "offline"
