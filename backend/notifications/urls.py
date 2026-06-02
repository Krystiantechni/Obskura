from django.urls import path

from notifications.views import (
    MarkAllReadView,
    MarkReadView,
    NotificationListView,
    StreamStatusView,
    UnreadCountView,
)

urlpatterns = [
    path("notifications", NotificationListView.as_view(), name="notifications-list"),
    path(
        "notifications/unread-count",
        UnreadCountView.as_view(),
        name="notifications-unread-count",
    ),
    path("notifications/read-all", MarkAllReadView.as_view(), name="notifications-read-all"),
    path("notifications/<int:pk>/read", MarkReadView.as_view(), name="notifications-mark-read"),
    path("stream/status", StreamStatusView.as_view(), name="stream-status"),
]
