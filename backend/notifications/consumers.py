import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.group = f"notif.user.{user.id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def notify_message(self, event):
        await self.send(text_data=json.dumps(event["data"], default=str))


class StatusConsumer(AsyncWebsocketConsumer):
    GROUP = "stream_status"

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP, self.channel_name)
        await self.accept()
        from notifications.models import StreamStatus
        from notifications.serializers import StreamStatusSerializer

        status = await database_sync_to_async(StreamStatus.load)()
        await self.send(text_data=json.dumps(StreamStatusSerializer(status).data, default=str))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.GROUP, self.channel_name)

    async def status_message(self, event):
        await self.send(text_data=json.dumps(event["data"], default=str))
