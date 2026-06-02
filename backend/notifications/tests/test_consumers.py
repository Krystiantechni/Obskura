import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from knox.models import AuthToken

from accounts.tests.factories import UserFactory
from notifications.models import NotificationKind, StreamStatus


@database_sync_to_async
def _create_user_and_token():
    user = UserFactory()
    _, token = AuthToken.objects.create(user)
    return user, token


@database_sync_to_async
def _create_user():
    return UserFactory()


@database_sync_to_async
def _notify_sync(user, kind, title):
    from notifications.services import notify

    return notify(user=user, kind=kind, title=title)


@database_sync_to_async
def _notification_count(user):
    from notifications.models import Notification

    return Notification.objects.filter(user=user).count()


@database_sync_to_async
def _broadcast_stream_status_sync(status):
    from notifications.services import broadcast_stream_status

    broadcast_stream_status(status)


@database_sync_to_async
def _load_stream_status():
    return StreamStatus.load()


# ---------------------------------------------------------------------------
# NotificationConsumer
# ---------------------------------------------------------------------------


@pytest.mark.django_db(transaction=True)
async def test_notification_consumer_authed_connects():
    """Authed user with valid Knox token → WS accepted."""
    from obskura.asgi import application

    user, token = await _create_user_and_token()
    communicator = WebsocketCommunicator(application, f"/ws/notifications?token={token}")
    connected, _ = await communicator.connect()
    assert connected is True
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_notification_consumer_no_token_rejected():
    """No token → consumer closes with 4401 (not connected)."""
    from obskura.asgi import application

    communicator = WebsocketCommunicator(application, "/ws/notifications")
    connected, _ = await communicator.connect()
    assert connected is False
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_notification_consumer_bad_token_rejected():
    """Bad (invalid) token → consumer closes (not connected)."""
    from obskura.asgi import application

    communicator = WebsocketCommunicator(application, "/ws/notifications?token=bogustoken123")
    connected, _ = await communicator.connect()
    assert connected is False
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_notification_consumer_receives_notify_push():
    """After notify(user=...) the connected consumer receives JSON with the title."""
    from obskura.asgi import application

    user, token = await _create_user_and_token()
    communicator = WebsocketCommunicator(application, f"/ws/notifications?token={token}")
    connected, _ = await communicator.connect()
    assert connected is True

    await _notify_sync(user, NotificationKind.SYSTEM, "Test push title")

    data = await communicator.receive_json_from()
    assert data["title"] == "Test push title"
    await communicator.disconnect()


# ---------------------------------------------------------------------------
# StatusConsumer
# ---------------------------------------------------------------------------


@pytest.mark.django_db(transaction=True)
async def test_status_consumer_connects_public():
    """StatusConsumer has no auth requirement — anyone can connect."""
    from obskura.asgi import application

    communicator = WebsocketCommunicator(application, "/ws/stream")
    connected, _ = await communicator.connect()
    assert connected is True
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_status_consumer_sends_current_status_on_connect():
    """On connect, StatusConsumer immediately sends the current StreamStatus."""
    from obskura.asgi import application

    communicator = WebsocketCommunicator(application, "/ws/stream")
    connected, _ = await communicator.connect()
    assert connected is True

    data = await communicator.receive_json_from()
    assert "is_live" in data
    await communicator.disconnect()


@pytest.mark.django_db(transaction=True)
async def test_status_consumer_receives_broadcast():
    """broadcast_stream_status() → connected StatusConsumer receives updated status."""
    from obskura.asgi import application

    communicator = WebsocketCommunicator(application, "/ws/stream")
    connected, _ = await communicator.connect()
    assert connected is True

    # Consume the initial status frame sent on connect
    await communicator.receive_json_from()

    # Trigger a broadcast
    status = await _load_stream_status()
    await _broadcast_stream_status_sync(status)

    data = await communicator.receive_json_from()
    assert "is_live" in data
    await communicator.disconnect()


# ---------------------------------------------------------------------------
# notify() persistence (non-async)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_notify_persists_notification_row():
    """notify() must create a Notification row in the DB."""
    from notifications.services import notify

    user = UserFactory()
    notify(user=user, kind=NotificationKind.SYSTEM, title="Persisted title")

    from notifications.models import Notification

    assert Notification.objects.filter(user=user, title="Persisted title").exists()
