from datetime import timedelta

import pytest
from django.utils import timezone
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from membership import selectors, services
from membership.models import SubStatus
from membership.tests.factories import PlanFactory, SubscriptionFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _play(client, ep, position_s=10):
    return client.put(
        f"/api/v1/playback/progress/{ep.slug}",
        {"position_s": position_s, "completed": False},
        format="json",
    )


@pytest.mark.django_db
def test_play_premium_denied_for_free_user():
    user = UserFactory()
    ep = EpisodeFactory(premium=True, audio_url="/audio/p.mp3")
    res = _play(_client(user), ep)
    assert res.status_code == 403
    assert (
        res.json()["detail"] == "premium_required" or res.data["detail"].code == "premium_required"
    )


@pytest.mark.django_db
def test_play_premium_allowed_for_active_subscriber():
    user = UserFactory()
    SubscriptionFactory(
        user=user,
        plan=PlanFactory(code="klan"),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    ep = EpisodeFactory(premium=True, audio_url="/audio/p.mp3")
    assert _play(_client(user), ep).status_code in (200, 201)


@pytest.mark.django_db
def test_free_user_plays_20_ok_21st_quota_exceeded():
    user = UserFactory()
    c = _client(user)
    episodes = [EpisodeFactory(premium=False) for _ in range(21)]
    for ep in episodes[:20]:
        assert _play(c, ep).status_code in (200, 201)
    res = _play(c, episodes[20])
    assert res.status_code == 403
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 20


@pytest.mark.django_db
def test_replay_same_episode_same_month_does_not_consume():
    user = UserFactory()
    c = _client(user)
    ep = EpisodeFactory(premium=False)
    assert _play(c, ep, position_s=10).status_code in (200, 201)
    assert _play(c, ep, position_s=20).status_code in (200, 201)  # replay, no new grant
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 1


@pytest.mark.django_db
def test_browsing_detail_does_not_consume_quota(django_assert_num_queries):
    user = UserFactory()
    c = _client(user)
    eps = [EpisodeFactory(premium=False) for _ in range(5)]
    for ep in eps:
        assert c.get(f"/api/v1/catalog/episodes/{ep.slug}").status_code == 200
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 0
    # N+1 guard: a single premium detail GET must stay within a stable query budget
    prem = EpisodeFactory(premium=True)
    with django_assert_num_queries(9):
        c.get(f"/api/v1/catalog/episodes/{prem.slug}")
