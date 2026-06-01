import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from community.models import Post, PostStatus, Thread
from community.tests.factories import CategoryFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.mark.django_db
def test_create_thread_requires_auth():
    cat = CategoryFactory(is_moderated=False)
    r = APIClient().post(
        "/api/v1/community/threads",
        {"category_slug": cat.slug, "title": "Coś w tunelu", "body": "Słyszę kroki."},
        format="json",
    )
    assert r.status_code == 401


@pytest.mark.django_db
def test_create_thread_non_moderated_is_published_and_visible():
    cat = CategoryFactory(is_moderated=False)
    author = UserFactory()

    r = _client(author).post(
        "/api/v1/community/threads",
        {"category_slug": cat.slug, "title": "Coś w tunelu", "body": "Słyszę kroki."},
        format="json",
    )
    assert r.status_code == 201
    slug = r.json()["slug"]

    thread = Thread.objects.get(slug=slug)
    first = thread.posts.get(is_first=True) if False else Post.all_objects.get(thread=thread)
    assert first.is_first is True
    assert first.status == PostStatus.PUBLISHED
    assert thread.last_post_at is not None

    # visible to an anonymous viewer (first post published)
    listing = APIClient().get("/api/v1/community/threads").json()
    assert any(t["slug"] == slug for t in listing["results"])


@pytest.mark.django_db
def test_create_thread_moderated_is_pending_and_hidden_from_others_but_visible_to_author():
    cat = CategoryFactory(is_moderated=True)
    author = UserFactory()

    r = _client(author).post(
        "/api/v1/community/threads",
        {"category_slug": cat.slug, "title": "Zgłoszenie", "body": "Treść do moderacji."},
        format="json",
    )
    assert r.status_code == 201
    slug = r.json()["slug"]

    first = Post.all_objects.get(thread__slug=slug)
    assert first.status == PostStatus.PENDING

    # hidden from anonymous listing
    anon = APIClient().get("/api/v1/community/threads").json()
    assert all(t["slug"] != slug for t in anon["results"])

    # hidden from another logged-in user
    other = _client(UserFactory()).get("/api/v1/community/threads").json()
    assert all(t["slug"] != slug for t in other["results"])

    # visible to the author
    mine = _client(author).get("/api/v1/community/threads").json()
    assert any(t["slug"] == slug for t in mine["results"])


@pytest.mark.django_db
def test_create_thread_unknown_category_404():
    r = _client(UserFactory()).post(
        "/api/v1/community/threads",
        {"category_slug": "nie-istnieje", "title": "X", "body": "Y"},
        format="json",
    )
    assert r.status_code == 404


@pytest.mark.django_db
def test_create_thread_with_episode_links_it():
    cat = CategoryFactory(is_moderated=False)
    ep = EpisodeFactory()
    r = _client(UserFactory()).post(
        "/api/v1/community/threads",
        {
            "category_slug": cat.slug,
            "title": "Dyskusja o odcinku",
            "body": "Co to było na końcu?",
            "episode_slug": ep.slug,
        },
        format="json",
    )
    assert r.status_code == 201
    thread = Thread.objects.get(slug=r.json()["slug"])
    assert thread.episode_id == ep.id


@pytest.mark.django_db
def test_create_post_requires_auth():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    r = APIClient().post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Cześć."},
        format="json",
    )
    assert r.status_code == 401


@pytest.mark.django_db
def test_create_post_bumps_counts_and_last_post_at():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    before = Thread.objects.get(pk=thread.pk).last_post_at

    r = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Też to słyszałem."},
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["status"] == PostStatus.PUBLISHED
    assert r.json()["is_first"] is False

    thread.refresh_from_db()
    # posts_count counts published replies, excluding the first post
    assert thread.posts_count == 1
    assert thread.last_post_at >= before


@pytest.mark.django_db
def test_create_post_on_locked_thread_is_403_thread_locked():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    thread.is_locked = True
    thread.save(update_fields=["is_locked"])

    r = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Wcisnę się."},
        format="json",
    )
    assert r.status_code == 403
    assert r.json()["detail"] == "thread_locked" or r.json().get("code") == "thread_locked"


@pytest.mark.django_db
def test_moderator_can_post_on_locked_thread():
    cat = CategoryFactory(is_moderated=False)
    thread = _make_thread(cat)
    thread.is_locked = True
    thread.save(update_fields=["is_locked"])
    mod = UserFactory(is_moderator=True)

    r = _client(mod).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Zamknięte, ale moderator może."},
        format="json",
    )
    assert r.status_code == 201


@pytest.mark.django_db
def test_create_post_moderated_category_is_pending_and_not_counted():
    cat = CategoryFactory(is_moderated=True)
    thread = _make_thread(cat, first_status=PostStatus.PUBLISHED)

    r = _client(UserFactory()).post(
        f"/api/v1/community/threads/{thread.slug}/posts",
        {"body": "Czekam na moderację."},
        format="json",
    )
    assert r.status_code == 201
    assert r.json()["status"] == PostStatus.PENDING

    thread.refresh_from_db()
    # pending reply must NOT bump posts_count (published-only) nor last_post_at
    assert thread.posts_count == 0


@pytest.mark.django_db
def test_threads_count_tracks_published_first_post():
    from community.models import Category

    cat = CategoryFactory(is_moderated=False)
    _make_thread(cat)
    cat_row = Category.objects.get(pk=cat.pk)
    assert cat_row.threads_count == 1

    # moderated category → pending first post → not counted until approved
    mcat = CategoryFactory(is_moderated=True)
    _make_thread(mcat, first_status=PostStatus.PENDING)
    mcat_row = Category.objects.get(pk=mcat.pk)
    assert mcat_row.threads_count == 0


def _make_thread(category, *, first_status=PostStatus.PUBLISHED):
    """Build a Thread + first Post directly (bypassing the API) for reply tests."""
    from django.utils import timezone

    author = UserFactory()
    thread = Thread.objects.create(
        category=category,
        author=author,
        title="Wątek testowy",
        last_post_at=timezone.now(),
    )
    Post.objects.create(
        thread=thread,
        author=author,
        body="Pierwszy post.",
        is_first=True,
        status=first_status,
    )
    thread.refresh_from_db()
    return thread
