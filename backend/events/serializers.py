from rest_framework import serializers

from events.models import Event
from events.selectors import can_see_recording


class EventListSerializer(serializers.ModelSerializer):
    host_name = serializers.SerializerMethodField()
    seats_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "slug",
            "title",
            "mode",
            "starts_at",
            "duration_minutes",
            "host_name",
            "cover_image",
            "capacity",
            "seats_taken",
            "seats_remaining",
            "price_pln",
            "is_free",
            "is_featured",
            "status",
        ]

    def get_host_name(self, obj):
        if obj.host_id is None:
            return ""
        return obj.host.name if obj.host else ""

    def get_seats_remaining(self, obj):
        if obj.capacity is None:
            return None
        return obj.capacity - obj.seats_taken


class EventDetailSerializer(EventListSerializer):
    recording_url = serializers.SerializerMethodField()

    class Meta(EventListSerializer.Meta):
        fields = EventListSerializer.Meta.fields + [
            "description",
            "recording_url",
            "recording_access",
        ]

    def get_recording_url(self, obj):
        request = self.context.get("request")
        user = request.user if request else None
        if can_see_recording(user=user, event=obj):
            return obj.recording_url or None
        return None
