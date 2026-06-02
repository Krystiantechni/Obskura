from rest_framework import serializers

from notifications.models import Notification, StreamStatus


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "kind", "title", "body", "url", "payload", "read_at", "created_at"]
        read_only_fields = fields


class StreamStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = StreamStatus
        fields = ["is_live", "title", "started_at"]
        read_only_fields = fields
