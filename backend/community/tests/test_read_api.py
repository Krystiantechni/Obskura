import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from community.models import PostStatus, Thread
from community.tests.factories import (
    CategoryFactory,
    FirstPostFactory,
    PostFactory,
    ThreadFactory,
)


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _published_thread(**kwargs):
    """Wątek z opublikowanym pierwszym postem — widoczny publicznie."""
    thread = ThreadFactory(**kwargs)
    FirstPostFactory(thread=thread, author=thread.author, status=PostStatus.PUBLISHED)
    return thread


@pytest.mark.django_db
def test_threads_cursor_pagination_walks_all_pages_once():
    """>page_size wątków: kursor (-last_post_at, -id) zwraca każdy DOKŁADNIE raz.

    Regresja: pierwsze pole kursora MUSI być monotoniczne (nie boolean is_pinned),
    inaczej DRF CursorPagination gubi/duplikuje wiersze między stronami.
    """
    cat = CategoryFactory(is_moderated=False)
    created = [_published_thread(category=cat).slug for _ in range(25)]
    assert len(created) == 25

    seen = []
    url = "/api/v1/community/threads"
    client = APIClient()
    for _ in range(10):  # bezpiecznik na nieskończoną pętlę
        body = client.get(url).json()
        seen.extend(t["slug"] for t in body["results"])
        if not body.get("next"):
            break
        url = body["next"]

    assert len(seen) == 25
    assert len(set(seen)) == 25  # zero duplikatów / pominięć
    assert set(seen) == set(created)


# --- categories ---------------------------------------------------------


@pytest.mark.django_db
def test_categories_public():
    CategoryFactory.create_batch(3)
    res = APIClient().get("/api/v1/community/categories")
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 3
    assert {"name", "slug", "threads_count"} <= set(body[0].keys())


@pytest.mark.django_db
def test_categories_inactive_hidden_and_ordered():
    CategoryFactory(slug="b", order=2, is_active=True)
    CategoryFactory(slug="a", order=1, is_active=True)
    CategoryFactory(slug="hidden", order=0, is_active=False)
    res = APIClient().get("/api/v1/community/categories")
    slugs = [c["slug"] for c in res.json()]
    assert slugs == ["a", "b"]


@pytest.mark.django_db
def test_categories_cache_hit_second_request_no_queries(django_assert_num_queries):
    CategoryFactory.create_batch(2)
    c = APIClient()
    c.get("/api/v1/community/categories")  # warms cache
    with django_assert_num_queries(0):
        res = c.get("/api/v1/community/categories")
    assert res.status_code == 200
    assert len(res.json()) == 2


# --- threads list -------------------------------------------------------


@pytest.mark.django_db
def test_threads_list_public_pinned_first():
    cat = CategoryFactory()
    _published_thread(category=cat, slug="plain", is_pinned=False)
    _published_thread(category=cat, slug="sticky", is_pinned=True)
    res = APIClient().get("/api/v1/community/threads")
    assert res.status_code == 200
    results = res.json()["results"]
    assert results[0]["slug"] == "sticky"


@pytest.mark.django_db
def test_threads_list_only_visible():
    cat = CategoryFactory()
    _published_thread(category=cat, slug="shown")
    hidden = ThreadFactory(category=cat, slug="hidden")
    FirstPostFactory(thread=hidden, author=hidden.author, status=PostStatus.PENDING)
    res = APIClient().get("/api/v1/community/threads")
    slugs = [t["slug"] for t in res.json()["results"]]
    assert "shown" in slugs
    assert "hidden" not in slugs


@pytest.mark.django_db
def test_threads_filter_by_category_and_episode():
    cat_a = CategoryFactory(slug="cat-a")
    cat_b = CategoryFactory(slug="cat-b")
    ep = EpisodeFactory(slug="mgla-nad")
    _published_thread(category=cat_a, slug="in-a", episode=ep)
    _published_thread(category=cat_b, slug="in-b")
    by_cat = APIClient().get("/api/v1/community/threads?category=cat-a").json()["results"]
    assert [t["slug"] for t in by_cat] == ["in-a"]
    by_ep = APIClient().get("/api/v1/community/threads?episode=mgla-nad").json()["results"]
    assert [t["slug"] for t in by_ep] == ["in-a"]


@pytest.mark.django_db
def test_threads_author_sees_own_pending_in_list():
    author = UserFactory()
    cat = CategoryFactory()
    pending = ThreadFactory(category=cat, slug="my-pending", author=author)
    FirstPostFactory(thread=pending, author=author, status=PostStatus.PENDING)
    mine = _client(author).get("/api/v1/community/threads").json()["results"]
    assert "my-pending" in [t["slug"] for t in mine]
    stranger = _client(UserFactory()).get("/api/v1/community/threads").json()["results"]
    assert "my-pending" not in [t["slug"] for t in stranger]


@pytest.mark.django_db
def test_threads_moderator_sees_all_in_list():
    mod = UserFactory(is_moderator=True)
    cat = CategoryFactory()
    pending = ThreadFactory(category=cat, slug="awaiting")
    FirstPostFactory(thread=pending, author=pending.author, status=PostStatus.PENDING)
    seen = _client(mod).get("/api/v1/community/threads").json()["results"]
    assert "awaiting" in [t["slug"] for t in seen]


@pytest.mark.django_db
def test_threads_list_no_nplus1(django_assert_num_queries):
    cat = CategoryFactory()
    ep = EpisodeFactory()
    for i in range(10):
        _published_thread(category=cat, slug=f"t-{i}", episode=ep)
    # 1 page (cursor) + 1 count-ish; select_related collapses author/category/episode.
    with django_assert_num_queries(1):
        APIClient().get("/api/v1/community/threads")


# --- thread detail ------------------------------------------------------


@pytest.mark.django_db
def test_thread_detail_increments_views_and_lists_posts():
    cat = CategoryFactory()
    thread = _published_thread(category=cat, slug="haunt")
    PostFactory(thread=thread, status=PostStatus.PUBLISHED)
    PostFactory(thread=thread, status=PostStatus.PENDING)  # hidden from public
    res = APIClient().get("/api/v1/community/threads/haunt")
    assert res.status_code == 200
    body = res.json()
    assert body["thread"]["slug"] == "haunt"
    assert body["thread"]["views_count"] == 1
    bodies = [p["body"] for p in body["posts"]["results"]]
    assert all("PENDING" not in b for b in bodies)
    # only first + one published reply are visible (2 posts)
    assert len(body["posts"]["results"]) == 2
    Thread.objects.get(slug="haunt")  # sanity: still alive
    again = APIClient().get("/api/v1/community/threads/haunt").json()
    assert again["thread"]["views_count"] == 2


@pytest.mark.django_db
def test_thread_detail_404_when_first_post_pending_for_stranger():
    cat = CategoryFactory()
    thread = ThreadFactory(category=cat, slug="secret")
    FirstPostFactory(thread=thread, author=thread.author, status=PostStatus.PENDING)
    res = APIClient().get("/api/v1/community/threads/secret")
    assert res.status_code == 404
