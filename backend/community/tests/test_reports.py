import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from community.models import Post, PostStatus, Report, ReportStatus
from community.tests.factories import (
    CategoryFactory,
    PostFactory,
    ThreadFactory,
)


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.fixture
def reply():
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(category=category)
    return PostFactory(thread=thread, status=PostStatus.PUBLISHED, is_first=False)


@pytest.mark.django_db
def test_report_requires_auth(reply):
    res = APIClient().post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "spam"},
        format="json",
    )
    assert res.status_code == 401


@pytest.mark.django_db
def test_report_creates_open_report_without_hiding_post(reply):
    from community.selectors import moderation_queue

    reporter = UserFactory()
    res = _client(reporter).post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "spam", "detail": "Bot spam."},
        format="json",
    )
    assert res.status_code == 201
    report = Report.objects.get(reporter=reporter, post=reply)
    assert report.reason == "spam"
    assert report.detail == "Bot spam."
    assert report.status == ReportStatus.OPEN
    reply.refresh_from_db()
    # Report NIE ukrywa posta (anty-griefing) — zostaje PUBLISHED…
    assert reply.status == PostStatus.PUBLISHED
    # …ale trafia do kolejki moderacji przez otwarte zgłoszenie.
    assert reply.pk in set(moderation_queue().values_list("pk", flat=True))


@pytest.mark.django_db
def test_report_unique_per_reporter_and_post(reply):
    reporter = UserFactory()
    c = _client(reporter)
    first = c.post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "spam"},
        format="json",
    )
    second = c.post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "offensive", "detail": "again"},
        format="json",
    )
    assert first.status_code == 201
    assert second.status_code == 200  # idempotent: existing report returned, no duplicate
    assert Report.objects.filter(reporter=reporter, post=reply).count() == 1


@pytest.mark.django_db
def test_report_two_distinct_reporters_allowed(reply):
    _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report", {"reason": "spam"}, format="json"
    )
    _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report", {"reason": "spoiler"}, format="json"
    )
    assert Report.objects.filter(post=reply).count() == 2


@pytest.mark.django_db
def test_report_invalid_reason_rejected(reply):
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report",
        {"reason": "nonsense"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_report_already_removed_post_stays_removed(reply):
    Post.all_objects.filter(pk=reply.pk).update(status=PostStatus.REMOVED)
    _client(UserFactory()).post(
        f"/api/v1/community/posts/{reply.pk}/report", {"reason": "spam"}, format="json"
    )
    reply.refresh_from_db()
    assert reply.status == PostStatus.REMOVED  # report never changes post status
