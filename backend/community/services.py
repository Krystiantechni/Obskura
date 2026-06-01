from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, PermissionDenied

from community.models import (
    ModAction,
    ModerationAction,
    Post,
    PostStatus,
    Reaction,
    Report,
    ReportReason,
    ReportStatus,
    Thread,
)
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


@transaction.atomic
def report_post(*, user, post, reason, detail=""):
    """User report. Idempotent per (reporter, post) via get_or_create.

    Zgłoszenie NIE zmienia statusu posta — post zostaje widoczny. To chroni przed
    griefingiem (pojedynczy report nie ukrywa treści ani nie zbija liczników).
    Post trafia do kolejki moderacji przez powiązany open Report (selectors.moderation_queue);
    moderator decyduje (remove/dismiss).
    """
    report, _created = Report.objects.get_or_create(
        reporter=user,
        post=post,
        defaults={
            "reason": reason or ReportReason.OTHER,
            "detail": detail or "",
            "status": ReportStatus.OPEN,
        },
    )
    return report


# Post status transition per moderator action.
_POST_ACTION_STATUS = {
    ModAction.APPROVE: PostStatus.PUBLISHED,
    ModAction.RESTORE: PostStatus.PUBLISHED,
    ModAction.REJECT: PostStatus.REMOVED,
    ModAction.REMOVE: PostStatus.REMOVED,
}


@transaction.atomic
def moderate_post(*, moderator, post, action, reason=""):
    """Approve/restore -> PUBLISHED, reject/remove -> REMOVED. Append-only audit."""
    new_status = _POST_ACTION_STATUS[action]
    if post.status != new_status:
        post.status = new_status
        post.save(update_fields=["status", "updated_at"])
    ModerationAction.objects.create(
        moderator=moderator,
        post=post,
        thread=None,
        action=action,
        reason=reason or "",
    )
    return post


# Thread flag action -> (field, value).
_THREAD_FLAG_FIELD = {
    ModAction.PIN: ("is_pinned", True),
    ModAction.UNPIN: ("is_pinned", False),
    ModAction.LOCK: ("is_locked", True),
    ModAction.UNLOCK: ("is_locked", False),
}


@transaction.atomic
def set_thread_flag(*, moderator, thread, action):
    """Pin/unpin/lock/unlock a thread. Append-only audit."""
    field, value = _THREAD_FLAG_FIELD[action]
    setattr(thread, field, value)
    thread.save(update_fields=[field, "updated_at"])
    ModerationAction.objects.create(
        moderator=moderator,
        post=None,
        thread=thread,
        action=action,
        reason="",
    )
    return thread


@transaction.atomic
def resolve_report(*, moderator, report, status, resolution=""):
    """Resolve/dismiss a report; stamp handled_by + resolution."""
    report.status = status
    report.handled_by = moderator
    report.resolution = resolution or ""
    report.save(update_fields=["status", "handled_by", "resolution", "updated_at"])
    return report
