from rest_framework import serializers

from catalog.models import Chapter, Creator, Episode, Genre, Season, TranscriptLine


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


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = ["n", "key", "title", "time_str", "sec"]
        read_only_fields = ["n", "key", "title", "time_str", "sec"]


class TranscriptLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscriptLine
        fields = ["key", "order", "sec", "speaker", "marker", "text"]
        read_only_fields = ["key", "order", "sec", "speaker", "marker", "text"]


class EpisodeDetailSerializer(serializers.ModelSerializer):
    season = SeasonSerializer(read_only=True)
    genre = GenreSerializer(read_only=True)
    creators = CreatorSerializer(many=True, read_only=True)
    chapters = ChapterSerializer(many=True, read_only=True)
    transcript = TranscriptLineSerializer(many=True, read_only=True)
    audio_url = serializers.SerializerMethodField()

    def get_audio_url(self, obj):
        from membership.selectors import can_access_audio

        request = self.context.get("request")
        user = request.user if request else None
        if not can_access_audio(user=user, episode=obj):
            return None
        return obj.audio_url

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
            "chapters",
            "transcript",
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
            "poster",
            "video_preview",
            "rating_avg",
            "plays_count",
            "is_true_horror",
            "kind",
            "premium",
            "published_at",
            "chapters",
            "transcript",
        ]
