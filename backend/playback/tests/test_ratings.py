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
def test_rating_requires_auth():
    ep = EpisodeFactory()
    res = APIClient().put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 4}, format="json")
    assert res.status_code == 401


@pytest.mark.django_db
def test_rating_upsert_updates_episode_avg():
    u1, u2, ep = UserFactory(), UserFactory(), EpisodeFactory(rating_avg=0)
    _client(u1).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 4}, format="json")
    _client(u2).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 2}, format="json")
    ep.refresh_from_db()
    assert float(ep.rating_avg) == 3.0  # (4+2)/2


@pytest.mark.django_db
def test_rating_rejects_out_of_range():
    user, ep = UserFactory(), EpisodeFactory()
    res = _client(user).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 9}, format="json")
    assert res.status_code == 400


@pytest.mark.django_db
def test_rating_change_recomputes_avg():
    u, ep = UserFactory(), EpisodeFactory()
    c = _client(u)
    c.put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 5}, format="json")
    c.put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 1}, format="json")  # same user updates
    ep.refresh_from_db()
    assert float(ep.rating_avg) == 1.0


@pytest.mark.django_db
def test_rating_get_own():
    user, ep = UserFactory(), EpisodeFactory()
    c = _client(user)
    c.put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 3}, format="json")
    res = c.get(f"/api/v1/playback/ratings/{ep.slug}")
    assert res.status_code == 200
    assert res.json()["value"] == 3


@pytest.mark.django_db
def test_rating_get_404_when_none():
    user, ep = UserFactory(), EpisodeFactory()
    assert _client(user).get(f"/api/v1/playback/ratings/{ep.slug}").status_code == 404


@pytest.mark.django_db
def test_rating_rejects_zero():
    user, ep = UserFactory(), EpisodeFactory()
    res = _client(user).put(f"/api/v1/playback/ratings/{ep.slug}", {"value": 0}, format="json")
    assert res.status_code == 400
