from datetime import timedelta

import pytest
from django.utils import timezone
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from membership.models import SubStatus
from membership.tests.factories import PlanFactory, SubscriptionFactory


def _auth(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.mark.django_db
def test_premium_audio_hidden_for_anonymous():
    EpisodeFactory(premium=True, audio_url="/audio/ep-12.mp3", slug="prem")
    res = APIClient().get("/api/v1/catalog/episodes/prem")
    assert res.status_code == 200
    assert res.json()["audio_url"] is None  # gated


@pytest.mark.django_db
def test_premium_audio_hidden_for_free_authenticated():
    # Tier-gating: zwykły zalogowany (free, bez subskrypcji) NIE widzi premium audio.
    EpisodeFactory(premium=True, audio_url="/audio/ep-12.mp3", slug="prem2")
    c = _auth(UserFactory())
    assert c.get("/api/v1/catalog/episodes/prem2").json()["audio_url"] is None


@pytest.mark.django_db
def test_premium_audio_visible_for_active_subscriber():
    EpisodeFactory(premium=True, audio_url="/audio/ep-12.mp3", slug="prem3")
    user = UserFactory()
    SubscriptionFactory(
        user=user,
        plan=PlanFactory(code="solo"),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    c = _auth(user)
    assert c.get("/api/v1/catalog/episodes/prem3").json()["audio_url"] == "/audio/ep-12.mp3"


@pytest.mark.django_db
def test_nonpremium_audio_always_visible():
    EpisodeFactory(premium=False, audio_url="/audio/ep-2.mp3", slug="free2")
    res = APIClient().get("/api/v1/catalog/episodes/free2")
    assert res.json()["audio_url"] == "/audio/ep-2.mp3"


@pytest.mark.django_db
def test_bad_token_stays_public_and_gated():
    # Stary/nieważny token NIE może dać 401 na publicznym katalogu — fallback do anonima.
    EpisodeFactory(premium=True, audio_url="/audio/ep-12.mp3", slug="prembad")
    c = APIClient()
    c.credentials(HTTP_AUTHORIZATION="Token deadbeefstaletoken")
    res = c.get("/api/v1/catalog/episodes/prembad")
    assert res.status_code == 200  # public — not 401
    assert res.json()["audio_url"] is None  # treated as anonymous → gated
