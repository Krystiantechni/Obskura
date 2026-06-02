from notifications.models import Notification


def user_notifications(*, user):
    return Notification.objects.filter(user=user).order_by("-created_at")


def unread_count(*, user):
    return Notification.objects.filter(user=user, read_at__isnull=True).count()
