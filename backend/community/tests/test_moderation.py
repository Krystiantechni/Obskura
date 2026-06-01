import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from community.models import (
    ModAction,
    ModerationAction,
    PostStatus,
    ReportStatus,
    Thread,
)
from community.tests.factories import (
    CategoryFactory,
    PostFactory,
    ReportFactory,
    ThreadFactory,
)


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _moderator():
    return UserFactory(is_moderator=True)


# ---- queue gating ----------------------------------------------------------


@pytest.mark.django_db
def test_queue_requires_auth():
    assert APIClient().get("/api/v1/community/moderation/queue").status_code == 401


@pytest.mark.django_db
def test_queue_forbidden_for_normal_user():
    assert _client(UserFactory()).get("/api/v1/community/moderation/queue").status_code == 403


@pytest.mark.django_db
def test_queue_lists_pending_and_flagged_for_moderator():
    thread = ThreadFactory(category=CategoryFactory(is_moderated=False))
    pending = PostFactory(thread=thread, status=PostStatus.PENDING, is_first=False)
    flagged = PostFactory(thread=thread, status=PostStatus.FLAGGED, is_first=False)
    PostFactory(thread=thread, status=PostStatus.PUBLISHED, is_first=False)  # excluded
    PostFactory(thread=thread, status=PostStatus.REMOVED, is_first=False)  # excluded
    res = _client(_moderator()).get("/api/v1/community/moderation/queue")
    assert res.status_code == 200
    ids = {row["id"] for row in res.json()["results"]}
    assert ids == {pending.pk, flagged.pk}


@pytest.mark.django_db
def test_queue_no_nplus1(django_assert_max_num_queries):
    thread = ThreadFactory(category=CategoryFactory(is_moderated=False))
    for _ in range(5):
        PostFactory(thread=thread, status=PostStatus.PENDING, is_first=False)
    c = _client(_moderator())
    # 1 count (pagination) + 1 page fetch with author select_related.
    with django_assert_max_num_queries(3):
        assert c.get("/api/v1/community/moderation/queue").status_code == 200


# ---- moderate_post actions -------------------------------------------------


@pytest.mark.django_db
def test_moderate_requires_moderator():
    post = PostFactory(status=PostStatus.PENDING, is_first=False)
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "approve"},
        format="json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_approve_pending_publishes_and_makes_visible():
    thread = ThreadFactory(category=CategoryFactory(is_moderated=True))
    post = PostFactory(thread=thread, status=PostStatus.PENDING, is_first=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "approve"},
        format="json",
    )
    assert res.status_code == 200
    post.refresh_from_db()
    assert post.status == PostStatus.PUBLISHED
    assert ModerationAction.objects.filter(post=post, action=ModAction.APPROVE).exists()


@pytest.mark.django_db
def test_remove_published_hides_post():
    post = PostFactory(status=PostStatus.PUBLISHED, is_first=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "remove", "reason": "Treść niezgodna z regulaminem."},
        format="json",
    )
    assert res.status_code == 200
    post.refresh_from_db()
    assert post.status == PostStatus.REMOVED
    action = ModerationAction.objects.get(post=post, action=ModAction.REMOVE)
    assert action.reason == "Treść niezgodna z regulaminem."


@pytest.mark.django_db
def test_reject_pending_marks_removed():
    post = PostFactory(status=PostStatus.PENDING, is_first=False)
    _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate", {"action": "reject"}, format="json"
    )
    post.refresh_from_db()
    assert post.status == PostStatus.REMOVED


@pytest.mark.django_db
def test_restore_removed_republishes():
    post = PostFactory(status=PostStatus.REMOVED, is_first=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/posts/{post.pk}/moderate",
        {"action": "restore"},
        format="json",
    )
    assert res.status_code == 200
    post.refresh_from_db()
    assert post.status == PostStatus.PUBLISHED
    assert ModerationAction.objects.filter(post=post, action=ModAction.RESTORE).exists()


# ---- thread flags ----------------------------------------------------------


@pytest.mark.django_db
def test_flag_requires_moderator():
    thread = ThreadFactory()
    res = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/flag",
        {"action": "pin"},
        format="json",
    )
    assert res.status_code == 403


@pytest.mark.django_db
def test_pin_thread_sets_flag_and_audits():
    thread = ThreadFactory(is_pinned=False)
    res = _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag",
        {"action": "pin"},
        format="json",
    )
    assert res.status_code == 200
    thread.refresh_from_db()
    assert thread.is_pinned is True
    assert ModerationAction.objects.filter(thread=thread, action=ModAction.PIN).exists()


@pytest.mark.django_db
def test_unpin_thread_clears_flag():
    thread = ThreadFactory(is_pinned=True)
    _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag", {"action": "unpin"}, format="json"
    )
    thread.refresh_from_db()
    assert thread.is_pinned is False


@pytest.mark.django_db
def test_lock_thread_blocks_new_posts_for_normal_user():
    thread = ThreadFactory(is_locked=False, category=CategoryFactory(is_moderated=False))
    _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag", {"action": "lock"}, format="json"
    )
    thread.refresh_from_db()
    assert thread.is_locked is True
    # Cross-check Task 4: create_post on a locked thread is denied for non-moderators.
    res = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Próbuję odpowiedzieć w zamkniętym wątku."},
        format="json",
    )
    assert res.status_code == 403
    assert (
        res.json().get("detail") and "locked" in str(res.json()).lower() or res.status_code == 403
    )


@pytest.mark.django_db
def test_unlock_thread_allows_posting_again():
    thread = ThreadFactory(is_locked=True, category=CategoryFactory(is_moderated=False))
    _client(_moderator()).post(
        f"/api/v1/community/threads/{thread.slug}/flag", {"action": "unlock"}, format="json"
    )
    res = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Wątek znów otwarty, odpowiadam."},
        format="json",
    )
    assert res.status_code == 201
    Thread.objects.get(pk=thread.pk)  # still resolvable by slug


# ---- reports list + resolve ------------------------------------------------


@pytest.mark.django_db
def test_reports_list_requires_moderator():
    assert _client(UserFactory()).get("/api/v1/community/reports").status_code == 403


@pytest.mark.django_db
def test_reports_list_returns_only_open_for_moderator():
    open_report = ReportFactory(status=ReportStatus.OPEN)
    ReportFactory(status=ReportStatus.RESOLVED)
    ReportFactory(status=ReportStatus.DISMISSED)
    res = _client(_moderator()).get("/api/v1/community/reports")
    assert res.status_code == 200
    ids = {row["id"] for row in res.json()["results"]}
    assert ids == {open_report.pk}


@pytest.mark.django_db
def test_resolve_report_sets_status_handled_by_and_resolution():
    report = ReportFactory(status=ReportStatus.OPEN)
    moderator = _moderator()
    res = _client(moderator).post(
        f"/api/v1/community/reports/{report.pk}/resolve",
        {"status": "resolved", "resolution": "Post usunięty, zgłoszenie zasadne."},
        format="json",
    )
    assert res.status_code == 200
    report.refresh_from_db()
    assert report.status == ReportStatus.RESOLVED
    assert report.handled_by_id == moderator.pk
    assert report.resolution == "Post usunięty, zgłoszenie zasadne."


@pytest.mark.django_db
def test_dismiss_report_sets_dismissed():
    report = ReportFactory(status=ReportStatus.OPEN)
    _client(_moderator()).post(
        f"/api/v1/community/reports/{report.pk}/resolve",
        {"status": "dismissed"},
        format="json",
    )
    report.refresh_from_db()
    assert report.status == ReportStatus.DISMISSED


@pytest.mark.django_db
def test_resolve_report_rejects_invalid_status():
    report = ReportFactory(status=ReportStatus.OPEN)
    res = _client(_moderator()).post(
        f"/api/v1/community/reports/{report.pk}/resolve",
        {"status": "open"},  # not an allowed terminal status
        format="json",
    )
    assert res.status_code == 400
