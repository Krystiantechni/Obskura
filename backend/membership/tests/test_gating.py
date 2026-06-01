from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory, SeasonFactory
from membership import selectors, services
from membership.models import PatronageStatus, PlanCode, SubStatus
from membership.tests.factories import (
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
    SubscriptionFactory,
)


def _live_sub(user, code):
    plan = PlanFactory(code=code)
    return SubscriptionFactory(
        user=user,
        plan=plan,
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )


@pytest.mark.django_db
def test_entitlement_anonymous_has_no_access():
    ent = selectors.entitlement(user=None)
    assert ent["full_access"] is False
    assert ent["plan_code"] is None


@pytest.mark.django_db
def test_entitlement_logged_in_without_subscription_is_free():
    user = UserFactory()
    ent = selectors.entitlement(user=user)
    assert ent["full_access"] is False
    assert ent["plan_code"] == PlanCode.FREE
    assert ent["monthly_quota"] == 20


@pytest.mark.django_db
@pytest.mark.parametrize("code", [PlanCode.SOLO, PlanCode.KLAN])
def test_entitlement_active_subscriber_has_full_access(code):
    user = UserFactory()
    _live_sub(user, code)
    ent = selectors.entitlement(user=user)
    assert ent["full_access"] is True
    assert ent["plan_code"] == code
    assert ent["monthly_quota"] is None


@pytest.mark.django_db
def test_entitlement_paid_patron_current_season_has_full_access():
    user = UserFactory()
    season = SeasonFactory(number=99)
    tier = PatronTierFactory(season=season)
    PatronageFactory(user=user, tier=tier, status=PatronageStatus.PAID)
    ent = selectors.entitlement(user=user)
    assert ent["full_access"] is True


@pytest.mark.django_db
def test_can_access_audio_premium_hidden_for_anon_and_free():
    ep = EpisodeFactory(premium=True)
    free_user = UserFactory()
    assert selectors.can_access_audio(user=None, episode=ep) is False
    assert selectors.can_access_audio(user=free_user, episode=ep) is False


@pytest.mark.django_db
def test_can_access_audio_premium_visible_for_subscriber_and_patron():
    ep = EpisodeFactory(premium=True)
    sub_user = UserFactory()
    _live_sub(sub_user, PlanCode.SOLO)
    patron_user = UserFactory()
    tier = PatronTierFactory(season=SeasonFactory(number=98))
    PatronageFactory(user=patron_user, tier=tier, status=PatronageStatus.PAID)
    assert selectors.can_access_audio(user=sub_user, episode=ep) is True
    assert selectors.can_access_audio(user=patron_user, episode=ep) is True


@pytest.mark.django_db
def test_can_access_audio_nonpremium_public_for_anon():
    ep = EpisodeFactory(premium=False)
    assert selectors.can_access_audio(user=None, episode=ep) is True


@pytest.mark.django_db
def test_can_access_audio_read_does_not_consume_quota():
    user = UserFactory()
    period = services.current_period()
    for _ in range(30):
        ep = EpisodeFactory(premium=False)
        assert selectors.can_access_audio(user=user, episode=ep) is True
    # browsing 30 episodes must not have created any grant
    assert selectors.free_grants_used(user=user, period=period) == 0


@pytest.mark.django_db
def test_register_play_full_access_is_noop():
    user = UserFactory()
    _live_sub(user, PlanCode.KLAN)
    ep = EpisodeFactory(premium=True)
    services.register_play(user=user, episode=ep)  # no raise
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 0


@pytest.mark.django_db
def test_register_play_premium_denied_for_free_user():
    user = UserFactory()
    ep = EpisodeFactory(premium=True)
    with pytest.raises(PermissionDenied) as exc:
        services.register_play(user=user, episode=ep)
    assert exc.value.detail.code == "premium_required"


@pytest.mark.django_db
def test_register_play_free_quota_20_ok_21st_denied():
    user = UserFactory()
    episodes = [EpisodeFactory(premium=False) for _ in range(21)]
    for ep in episodes[:20]:
        services.register_play(user=user, episode=ep)  # 20 distinct OK
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 20
    with pytest.raises(PermissionDenied) as exc:
        services.register_play(user=user, episode=episodes[20])
    assert exc.value.detail.code == "quota_exceeded"
    # the 21st (denied) grant must be rolled back, leaving exactly 20
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 20


@pytest.mark.django_db
def test_register_play_replay_same_episode_same_month_does_not_consume():
    user = UserFactory()
    ep = EpisodeFactory(premium=False)
    services.register_play(user=user, episode=ep)
    services.register_play(user=user, episode=ep)  # replay — same grant
    services.register_play(user=user, episode=ep)
    assert selectors.free_grants_used(user=user, period=services.current_period()) == 1
