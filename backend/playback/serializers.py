from rest_framework import serializers

from catalog.serializers import EpisodeListSerializer
from playback.models import Favorite, Progress, QueueItem, Rating


class ProgressWriteSerializer(serializers.Serializer):
    position_s = serializers.IntegerField(min_value=0)
    completed = serializers.BooleanField(default=False, required=False)


class FavoriteWriteSerializer(serializers.Serializer):
    episode_slug = serializers.SlugField()


class QueueWriteSerializer(serializers.Serializer):
    episode_slug = serializers.SlugField()
    position = serializers.IntegerField(min_value=0, default=0, required=False)


class ProgressReadSerializer(serializers.ModelSerializer):
    episode = EpisodeListSerializer(read_only=True)

    class Meta:
        model = Progress
        fields = ["position_s", "completed", "updated_at", "episode"]
        read_only_fields = ["position_s", "completed", "updated_at", "episode"]


class FavoriteSerializer(serializers.ModelSerializer):
    episode = EpisodeListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "episode"]
        read_only_fields = ["id", "episode"]


class QueueItemSerializer(serializers.ModelSerializer):
    episode = EpisodeListSerializer(read_only=True)

    class Meta:
        model = QueueItem
        fields = ["id", "position", "episode"]
        read_only_fields = ["id", "position", "episode"]


class RatingWriteSerializer(serializers.Serializer):
    value = serializers.IntegerField(min_value=1, max_value=5)


class RatingReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ["value"]
        read_only_fields = ["value"]
