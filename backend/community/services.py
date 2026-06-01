from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, PermissionDenied

from community.models import Post, PostStatus, Reaction, Thread
from community.selectors import is_moderator


@transaction.atomic
def create_thread(*, user, category, title, body, episode=None):
    """Tworzy wątek + pierwszy post (is_first).

    Pierwszy post jest PENDING jeśli kategoria jest moderowana, inaczej PUBLISHED.
    last_post_at = teraz (signal go potem utrzymuje przy kolejnych postach).
    """
    status = PostStatus.PENDING if category.is_moderated else PostStatus.PUBLISHED
    thread = Thread.objects.create(
        category=category,
        author=user,
        title=title,
        episode=episode,
        last_post_at=timezone.now(),
    )
    Post.objects.create(
        thread=thread,
        author=user,
        body=body,
        is_first=True,
        status=status,
    )
    return thread


@transaction.atomic
def create_post(*, user, thread, body):
    """Odpowiedź w wątku.

    Wątek zablokowany → PermissionDenied (kod thread_locked) dla nie-moderatora.
    Status PENDING jeśli kategoria moderowana, inaczej PUBLISHED.
    """
    if thread.is_locked and not is_moderator(user):
        raise PermissionDenied(ErrorDetail("thread_locked", code="thread_locked"))
    status = PostStatus.PENDING if thread.category.is_moderated else PostStatus.PUBLISHED
    return Post.objects.create(
        thread=thread,
        author=user,
        body=body,
        is_first=False,
        status=status,
    )


@transaction.atomic
def toggle_reaction(*, user, post, kind):
    """Przełącz reakcję użytkownika na poście.

    Brak reakcji → utwórz (reacted=True). Istniejąca reakcja tego rodzaju →
    usuń (reacted=False). Unikalność wymusza UniqueConstraint(post, user, kind);
    signal przelicza reaction_count i reactions_breakdown.
    """
    reaction, created = Reaction.objects.get_or_create(post=post, user=user, kind=kind)
    if not created:
        reaction.delete()
        return {"reacted": False}
    return {"reacted": True}
