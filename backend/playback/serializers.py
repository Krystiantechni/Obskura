from rest_framework import serializers

from catalog.serializers import EpisodeListSerializer
from playback.models import Progress


class ProgressWriteSerializer(serializers.Serializer):
    position_s = serializers.IntegerField(min_value=0)
    completed = serializers.BooleanField(default=False, required=False)


class ProgressReadSerializer(serializers.ModelSerializer):
    episode = EpisodeListSerializer(read_only=True)

    class Meta:
        model = Progress
        fields = ["position_s", "completed", "updated_at", "episode"]
        read_only_fields = ["position_s", "completed", "updated_at", "episode"]
