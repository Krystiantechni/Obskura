from rest_framework import serializers

from catalog.models import Creator, Episode, Genre, Season


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["name", "slug", "accent"]
        read_only_fields = ["name", "slug", "accent"]


class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = ["number", "title", "slug", "cover", "published_at"]
        read_only_fields = ["number", "title", "slug", "cover", "published_at"]


class CreatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Creator
        fields = ["name", "slug", "role", "bio", "avatar"]
        read_only_fields = ["name", "slug", "role", "bio", "avatar"]


class EpisodeListSerializer(serializers.ModelSerializer):
    season = serializers.IntegerField(source="season.number", read_only=True)
    genre = serializers.SlugField(source="genre.slug", read_only=True)

    class Meta:
        model = Episode
        fields = [
            "slug",
            "number",
            "season",
            "title",
            "title_em",
            "genre",
            "duration_s",
            "poster",
            "video_preview",
            "rating_avg",
            "plays_count",
            "is_true_horror",
            "kind",
            "premium",
            "published_at",
        ]
        read_only_fields = [
            "slug",
            "number",
            "season",
            "title",
            "title_em",
            "genre",
            "duration_s",
            "poster",
            "video_preview",
            "rating_avg",
            "plays_count",
            "is_true_horror",
            "kind",
            "premium",
            "published_at",
        ]


class EpisodeDetailSerializer(serializers.ModelSerializer):
    season = SeasonSerializer(read_only=True)
    genre = GenreSerializer(read_only=True)
    creators = CreatorSerializer(many=True, read_only=True)

    class Meta:
        model = Episode
        fields = [
            "slug",
            "number",
            "season",
            "title",
            "title_em",
            "genre",
            "creators",
            "duration_s",
            "audio_url",
            "poster",
            "video_preview",
            "rating_avg",
            "plays_count",
            "is_true_horror",
            "kind",
            "premium",
            "published_at",
        ]
        read_only_fields = [
            "slug",
            "number",
            "season",
            "title",
            "title_em",
            "genre",
            "creators",
            "duration_s",
            "audio_url",
            "poster",
            "video_preview",
            "rating_avg",
            "plays_count",
            "is_true_horror",
            "kind",
            "premium",
            "published_at",
        ]
