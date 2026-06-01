import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.mark.django_db
def test_favorites_requires_auth():
    assert APIClient().get("/api/v1/playback/favorites").status_code == 401


@pytest.mark.django_db
def test_favorites_crud():
    user, ep = UserFactory(), EpisodeFactory()
    c = _client(user)
    resp = c.post("/api/v1/playback/favorites", {"episode_slug": ep.slug}, format="json")
    assert resp.status_code == 201
    assert len(c.get("/api/v1/playback/favorites").json()["results"]) == 1
    # idempotent: posting again does not 500 / does not duplicate
    c.post("/api/v1/playback/favorites", {"episode_slug": ep.slug}, format="json")
    assert len(c.get("/api/v1/playback/favorites").json()["results"]) == 1
    assert c.delete(f"/api/v1/playback/favorites/{ep.slug}").status_code == 204
    assert len(c.get("/api/v1/playback/favorites").json()["results"]) == 0


@pytest.mark.django_db
def test_favorites_isolated_between_users():
    u1, u2, ep = UserFactory(), UserFactory(), EpisodeFactory()
    _client(u1).post("/api/v1/playback/favorites", {"episode_slug": ep.slug}, format="json")
    assert len(_client(u2).get("/api/v1/playback/favorites").json()["results"]) == 0


@pytest.mark.django_db
def test_favorites_excludes_soft_deleted_episode():
    user, ep = UserFactory(), EpisodeFactory()
    c = _client(user)
    c.post("/api/v1/playback/favorites", {"episode_slug": ep.slug}, format="json")
    ep.delete()  # soft-delete
    assert len(c.get("/api/v1/playback/favorites").json()["results"]) == 0


@pytest.mark.django_db
def test_queue_crud_ordered():
    user = UserFactory()
    c = _client(user)
    e1, e2 = EpisodeFactory(), EpisodeFactory()
    c.post("/api/v1/playback/queue", {"episode_slug": e1.slug, "position": 1}, format="json")
    c.post("/api/v1/playback/queue", {"episode_slug": e2.slug, "position": 0}, format="json")
    results = c.get("/api/v1/playback/queue").json()["results"]
    assert len(results) == 2
    assert results[0]["episode"]["slug"] == e2.slug  # ordered by position (0 before 1)


@pytest.mark.django_db
def test_queue_delete_and_isolation():
    u1, u2 = UserFactory(), UserFactory()
    ep = EpisodeFactory()
    r = _client(u1).post(
        "/api/v1/playback/queue", {"episode_slug": ep.slug, "position": 0}, format="json"
    )
    item_id = r.json()["id"]
    # not u2's item → 403 or 404
    assert _client(u2).delete(f"/api/v1/playback/queue/{item_id}").status_code in (403, 404)
    assert _client(u1).delete(f"/api/v1/playback/queue/{item_id}").status_code == 204
