from rest_framework import serializers

from community.models import Category, Post, PostStatus, Thread


def _author_name(user):
    """Pseudonim autora: display_name lub lokalna część emaila. Nigdy pełny email."""
    if user is None:
        return ""
    return user.display_name or user.email.split("@")[0]


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            "name",
            "slug",
            "description",
            "icon",
            "is_moderated",
            "order",
            "threads_count",
        ]
        read_only_fields = fields


class ThreadListSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    category_slug = serializers.SlugField(source="category.slug", read_only=True)
    episode_slug = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return _author_name(obj.author)

    def get_episode_slug(self, obj):
        return obj.episode.slug if obj.episode_id else None

    class Meta:
        model = Thread
        fields = [
            "slug",
            "title",
            "author_name",
            "category_slug",
            "episode_slug",
            "is_pinned",
            "is_locked",
            "posts_count",
            "views_count",
            "last_post_at",
            "created_at",
        ]
        read_only_fields = fields


class PostSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    def get_author_name(self, obj):
        return _author_name(obj.author)

    class Meta:
        model = Post
        fields = [
            "id",
            "author_name",
            "body",
            "status",
            "is_first",
            "reaction_count",
            "reactions_breakdown",
            "created_at",
        ]
        read_only_fields = fields


class ThreadDetailSerializer(ThreadListSerializer):
    first_post = serializers.SerializerMethodField()

    def get_first_post(self, obj):
        post = next(
            (p for p in obj.posts.all() if p.is_first and p.status == PostStatus.PUBLISHED),
            None,
        )
        if post is None:
            post = obj.posts.filter(is_first=True).first()
        return PostSerializer(post).data if post is not None else None

    class Meta(ThreadListSerializer.Meta):
        fields = ThreadListSerializer.Meta.fields + ["first_post"]
        read_only_fields = fields


class ThreadCreateSerializer(serializers.Serializer):
    """Kontrakt POST /community/threads (lustro przyszłego Zod schema)."""

    category_slug = serializers.SlugField()
    title = serializers.CharField(max_length=200)
    body = serializers.CharField()
    episode_slug = serializers.SlugField(required=False, allow_blank=True)


class PostCreateSerializer(serializers.Serializer):
    """Kontrakt POST /community/threads/<slug>/posts."""

    body = serializers.CharField()
