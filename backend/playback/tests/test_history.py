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
def test_history_lists_user_progress():
    user = UserFactory()
    c = _client(user)
    e1, e2 = EpisodeFactory(), EpisodeFactory()
    c.put(f"/api/v1/playback/progress/{e1.slug}", {"position_s": 10}, format="json")
    c.put(f"/api/v1/playback/progress/{e2.slug}", {"position_s": 20}, format="json")
    res = c.get("/api/v1/playback/history")
    assert res.status_code == 200
    assert len(res.json()["results"]) == 2


@pytest.mark.django_db
def test_history_excludes_soft_deleted_episodes():
    user = UserFactory()
    c = _client(user)
    ep = EpisodeFactory()
    c.put(f"/api/v1/playback/progress/{ep.slug}", {"position_s": 10}, format="json")
    ep.delete()  # soft-delete the episode
    res = c.get("/api/v1/playback/history")
    assert len(res.json()["results"]) == 0  # hidden episode -> not in history


@pytest.mark.django_db
def test_history_isolated_per_user():
    u1, u2 = UserFactory(), UserFactory()
    ep = EpisodeFactory()
    _client(u1).put(f"/api/v1/playback/progress/{ep.slug}", {"position_s": 5}, format="json")
    assert len(_client(u2).get("/api/v1/playback/history").json()["results"]) == 0


@pytest.mark.django_db
def test_history_no_nplus1(django_assert_max_num_queries):
    user = UserFactory()
    c = _client(user)
    for _ in range(5):
        ep = EpisodeFactory()
        c.put(f"/api/v1/playback/progress/{ep.slug}", {"position_s": 10}, format="json")
    # Stała liczba zapytań niezależnie od liczby wpisów — select_related na episode/season/genre.
    with django_assert_max_num_queries(6):
        c.get("/api/v1/playback/history")
