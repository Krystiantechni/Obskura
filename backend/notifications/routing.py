from django.urls import re_path

from notifications.consumers import NotificationConsumer, StatusConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications$", NotificationConsumer.as_asgi()),
    re_path(r"^ws/stream$", StatusConsumer.as_asgi()),
]
