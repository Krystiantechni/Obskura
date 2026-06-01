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


def _first_post_in(threads_ref, statuses):
    """Subquery: czy pierwszy (nie-usunięty) post wątku ma jeden ze statusów."""
    return Post.all_objects.filter(
        thread=threads_ref,
        is_first=True,
        is_deleted=False,
        status__in=statuses,
    )


def _published_first_post(threads_ref):
    """Subquery: czy wątek `threads_ref` ma opublikowany pierwszy post."""
    return _first_post_in(threads_ref, [PostStatus.PUBLISHED])


def visible_threads(*, viewer):
    """Wątki widoczne dla `viewer`.

    Reguła (spec §5): wątek widoczny, gdy jego pierwszy post jest PUBLISHED.
    Moderator widzi wszystko; autor dodatkowo widzi własne wątki, których pierwszy
    post czeka na moderację (PENDING/FLAGGED) — ale NIE usunięte (REMOVED).
    Jeden zapytaniowy plan — Exists subquery + select_related, bez N+1.
    """
    qs = Thread.objects.select_related("category", "author", "episode")
    if is_moderator(viewer):
        return qs
    qs = qs.annotate(
        _first_published=Exists(_published_first_post(OuterRef("pk"))),
        _first_awaiting=Exists(
            _first_post_in(OuterRef("pk"), [PostStatus.PENDING, PostStatus.FLAGGED])
        ),
    )
    visible = Q(_first_published=True)
    if viewer is not None and getattr(viewer, "is_authenticated", False):
        visible |= Q(author=viewer) & Q(_first_awaiting=True)
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
    """Czy `viewer` widzi pojedynczy post.

    Soft-deleted → niewidoczny dla nikogo. PUBLISHED → wszyscy. Moderator → wszystko.
    Autor → własne PENDING/FLAGGED (nie REMOVED).
    """
    if getattr(post, "is_deleted", False):
        return False
    if post.status == PostStatus.PUBLISHED:
        return True
    if is_moderator(viewer):
        return True
    if viewer is not None and getattr(viewer, "is_authenticated", False):
        return post.author_id == viewer.id and post.status != PostStatus.REMOVED
    return False


def visible_posts(*, viewer, thread):
    """Posty wątku widoczne dla `viewer`, select_related na autorze (zero N+1).

    PUBLISHED dla wszystkich; autor dodatkowo własne PENDING/FLAGGED (nie REMOVED);
    moderator wszystko. (`thread.posts` = SoftDeleteManager → bez is_deleted.)
    """
    qs = thread.posts.select_related("author")
    if is_moderator(viewer):
        return qs
    visible = Q(status=PostStatus.PUBLISHED)
    if viewer is not None and getattr(viewer, "is_authenticated", False):
        visible |= Q(author=viewer) & ~Q(status=PostStatus.REMOVED)
    return qs.filter(visible)


def moderation_queue():
    """Posty wymagające uwagi moderatora: PENDING/FLAGGED LUB z otwartym zgłoszeniem.

    Zgłoszenie (report) nie ukrywa posta ani nie zmienia statusu — post trafia do
    kolejki przez powiązany open Report, a moderator decyduje (remove/dismiss).
    """
    return (
        Post.all_objects.filter(is_deleted=False)
        .filter(
            Q(status__in=[PostStatus.PENDING, PostStatus.FLAGGED])
            | Q(reports__status=ReportStatus.OPEN)
        )
        .select_related("author", "thread")
        .distinct()
        .order_by("created_at", "id")
    )


def open_reports():
    """Unhandled reports for the moderator queue, oldest first."""
    return (
        Report.objects.filter(status=ReportStatus.OPEN)
        .select_related("reporter", "post", "post__thread")
        .order_by("created_at", "id")
    )
