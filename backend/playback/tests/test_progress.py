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
def test_progress_requires_auth():
    ep = EpisodeFactory()
    assert APIClient().get(f"/api/v1/playback/progress/{ep.slug}").status_code == 401


@pytest.mark.django_db
def test_progress_upsert_and_increments_plays_once():
    user, ep = UserFactory(), EpisodeFactory(plays_count=0)
    c = _client(user)
    r1 = c.put(
        f"/api/v1/playback/progress/{ep.slug}",
        {"position_s": 30, "completed": False},
        format="json",
    )
    assert r1.status_code in (200, 201)
    ep.refresh_from_db()
    assert ep.plays_count == 1
    c.put(f"/api/v1/playback/progress/{ep.slug}", {"position_s": 60}, format="json")
    ep.refresh_from_db()
    assert ep.plays_count == 1  # no extra increment on update
    r = c.get(f"/api/v1/playback/progress/{ep.slug}")
    assert r.json()["position_s"] == 60
