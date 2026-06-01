import pytest
from django.db import IntegrityError
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from community.models import PostStatus, Reaction, ReactionKind
from community.tests.factories import CategoryFactory, PostFactory, ThreadFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _published_post():
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(category=category)
    return PostFactory(thread=thread, status=PostStatus.PUBLISHED)


@pytest.mark.django_db
def test_reaction_requires_auth():
    post = _published_post()
    res = APIClient().post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 401


@pytest.mark.django_db
def test_reaction_rejects_unknown_kind():
    post = _published_post()
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": "rofl"},
        format="json",
    )
    assert res.status_code == 400


@pytest.mark.django_db
def test_toggle_on_sets_reacted_true_count_and_breakdown():
    post = _published_post()
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 200
    body = res.json()
    assert body["reacted"] is True
    assert body["reaction_count"] == 1
    assert body["reactions_breakdown"] == {"like": 1}
    post.refresh_from_db()
    assert post.reaction_count == 1
    assert post.reactions_breakdown == {"like": 1}


@pytest.mark.django_db
def test_toggle_again_removes_reaction():
    post = _published_post()
    c = _client(UserFactory())
    url = f"/api/v1/community/posts/{post.pk}/reactions"
    c.post(url, {"kind": ReactionKind.LIKE}, format="json")
    res = c.post(url, {"kind": ReactionKind.LIKE}, format="json")
    assert res.status_code == 200
    body = res.json()
    assert body["reacted"] is False
    assert body["reaction_count"] == 0
    assert body["reactions_breakdown"] == {}
    post.refresh_from_db()
    assert post.reaction_count == 0
    assert post.reactions_breakdown == {}


@pytest.mark.django_db
def test_two_users_same_kind_count_two():
    post = _published_post()
    url = f"/api/v1/community/posts/{post.pk}/reactions"
    _client(UserFactory()).post(url, {"kind": ReactionKind.SPOOKY}, format="json")
    _client(UserFactory()).post(url, {"kind": ReactionKind.SPOOKY}, format="json")
    post.refresh_from_db()
    assert post.reaction_count == 2
    assert post.reactions_breakdown == {"spooky": 2}


@pytest.mark.django_db
def test_different_kinds_in_breakdown():
    post = _published_post()
    url = f"/api/v1/community/posts/{post.pk}/reactions"
    _client(UserFactory()).post(url, {"kind": ReactionKind.LIKE}, format="json")
    _client(UserFactory()).post(url, {"kind": ReactionKind.LOVE}, format="json")
    post.refresh_from_db()
    assert post.reaction_count == 2
    assert post.reactions_breakdown == {"like": 1, "love": 1}


@pytest.mark.django_db
def test_unique_constraint_prevents_duplicate_rows():
    post = _published_post()
    user = UserFactory()
    Reaction.objects.create(post=post, user=user, kind=ReactionKind.LIKE)
    with pytest.raises(IntegrityError):
        Reaction.objects.create(post=post, user=user, kind=ReactionKind.LIKE)


@pytest.mark.django_db
def test_reaction_on_removed_post_404():
    category = CategoryFactory(is_moderated=False)
    thread = ThreadFactory(category=category)
    post = PostFactory(thread=thread, status=PostStatus.REMOVED)
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 404
    assert Reaction.objects.count() == 0


@pytest.mark.django_db
def test_reaction_on_pending_post_404_for_other_user():
    category = CategoryFactory(is_moderated=True)
    thread = ThreadFactory(category=category)
    post = PostFactory(thread=thread, status=PostStatus.PENDING)
    res = _client(UserFactory()).post(
        f"/api/v1/community/posts/{post.pk}/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 404


@pytest.mark.django_db
def test_reaction_on_missing_post_404():
    res = _client(UserFactory()).post(
        "/api/v1/community/posts/999999/reactions",
        {"kind": ReactionKind.LIKE},
        format="json",
    )
    assert res.status_code == 404
