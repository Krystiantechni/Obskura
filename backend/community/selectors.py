from django.core.cache import cache
from django.db.models import Exists, OuterRef, Q

from community.models import Category, Post, PostStatus, Report, ReportStatus, Thread

CACHE_TTL = 60 * 15  # 15 min


def is_moderator(user) -> bool:
    """Moderacja = jawna rola is_moderator LUB staff/superuser (lustro IsModerator)."""
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    return bool(getattr(user, "is_moderator", False) or user.is_staff or user.is_superuser)


def categories():
    return Category.objects.filter(is_active=True).order_by("order")


def categories_cached():
    data = cache.get("community:categories")
    if data is None:
        data = list(categories())
        cache.set("community:categories", data, CACHE_TTL)
    return data


def _published_first_post(threads_ref):
    """Subquery: czy wątek `threads_ref` ma opublikowany pierwszy post."""
    return Post.all_objects.filter(
        thread=threads_ref,
        is_first=True,
        is_deleted=False,
        status=PostStatus.PUBLISHED,
    )


def visible_threads(*, viewer):
    """Wątki widoczne dla `viewer`.

    Reguła (spec §5): wątek widoczny, gdy jego pierwszy post jest PUBLISHED.
    Moderator widzi wszystko; autor dodatkowo widzi własne wątki (pending first post).
    Jeden zapytaniowy plan — Exists subquery + select_related, bez N+1.
    """
    qs = Thread.objects.select_related("category", "author", "episode")
    if is_moderator(viewer):
        return qs
    qs = qs.annotate(_first_published=Exists(_published_first_post(OuterRef("pk"))))
    visible = Q(_first_published=True)
    if viewer is not None and getattr(viewer, "is_authenticated", False):
        visible |= Q(author=viewer)
    return qs.filter(visible)


def threads(*, viewer, category=None, episode=None):
    qs = visible_threads(viewer=viewer)
    if category:
        qs = qs.filter(category__slug=category)
    if episode:
        qs = qs.filter(episode__slug=episode)
    return qs


def thread_detail(*, viewer, slug):
    return visible_threads(viewer=viewer).filter(slug=slug).first()


def post_visible_to(*, viewer, post) -> bool:
    """Czy `viewer` widzi pojedynczy post (PUBLISHED; autor swoje; moderator wszystko)."""
    if post.status == PostStatus.PUBLISHED:
        return True
    if is_moderator(viewer):
        return True
    if viewer is not None and getattr(viewer, "is_authenticated", False):
        return post.author_id == viewer.id
    return False


def visible_posts(*, viewer, thread):
    """Posty wątku widoczne dla `viewer`, select_related na autorze (zero N+1)."""
    qs = thread.posts.select_related("author")
    if is_moderator(viewer):
        return qs
    visible = Q(status=PostStatus.PUBLISHED)
    if viewer is not None and getattr(viewer, "is_authenticated", False):
        visible |= Q(author=viewer)
    return qs.filter(visible)


def moderation_queue():
    """Posts awaiting moderator attention: PENDING + FLAGGED, oldest first."""
    return (
        Post.all_objects.filter(status__in=[PostStatus.PENDING, PostStatus.FLAGGED])
        .select_related("author", "thread")
        .order_by("created_at", "id")
    )


def open_reports():
    """Unhandled reports for the moderator queue, oldest first."""
    return (
        Report.objects.filter(status=ReportStatus.OPEN)
        .select_related("reporter", "post", "post__thread")
        .order_by("created_at", "id")
    )
