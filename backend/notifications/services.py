from django.db import transaction


@transaction.atomic
def notify(*, user, kind, title, body="", url="", payload=None):
    from notifications.models import Notification
    from notifications.serializers import NotificationSerializer

    n = Notification.objects.create(
        user=user, kind=kind, title=title, body=body, url=url, payload=payload or {}
    )
    _push(f"notif.user.{user.id}", "notify.message", NotificationSerializer(n).data)
    return n


def broadcast_stream_status(status):
    from notifications.serializers import StreamStatusSerializer

    _push("stream_status", "status.message", StreamStatusSerializer(status).data)


def _push(group, msg_type, data):
    """Best-effort push do channel layer; brak warstwy/Redis nie wywala operacji."""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    layer = get_channel_layer()
    if layer is None:
        return
    try:
        async_to_sync(layer.group_send)(group, {"type": msg_type, "data": data})
    except Exception:  # noqa: BLE001 — push jest pomocniczy; notyfikacja jest w bazie
        pass
