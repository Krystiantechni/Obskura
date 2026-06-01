from datetime import timedelta

import pytest
from django.db import IntegrityError
from django.utils import timezone

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory, SeasonFactory
from membership.models import (
    BillingPeriod,
    FreePlayGrant,
    Patronage,
    PatronageStatus,
    PatronCode,
    PatronTier,
    Plan,
    PlanCode,
    Subscription,
    SubStatus,
)
from membership.tests.factories import (
    FreePlayGrantFactory,
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
    SubscriptionFactory,
)


@pytest.mark.django_db
def test_create_all_models():
    plan = PlanFactory(code=PlanCode.FREE, name="Próg", price_month=0, monthly_quota=20)
    assert plan.pk and plan.currency == "PLN" and plan.is_active is True
    sub = SubscriptionFactory(plan=plan)
    assert sub.pk and sub.status == SubStatus.ACTIVE and sub.auto_renew is True
    tier = PatronTierFactory()
    assert tier.pk and tier.currency == "PLN"
    pat = PatronageFactory(tier=tier)
    assert pat.pk and pat.status == PatronageStatus.PENDING and pat.amount == tier.amount
    grant = FreePlayGrantFactory()
    assert grant.pk and grant.period == "2026-06"


@pytest.mark.django_db
def test_plan_code_unique():
    PlanFactory(code=PlanCode.KLAN)
    with pytest.raises(IntegrityError):
        Plan.objects.create(code=PlanCode.KLAN, name="Klan dup", price_month=49, price_year=39)


@pytest.mark.django_db
def test_subscription_unique_active_per_user():
    user = UserFactory()
    SubscriptionFactory(user=user, status=SubStatus.ACTIVE)
    with pytest.raises(IntegrityError):
        Subscription.objects.create(
            user=user,
            plan=PlanFactory(code=PlanCode.KLAN),
            status=SubStatus.TRIALING,
            billing_period=BillingPeriod.MONTH,
        )


@pytest.mark.django_db
def test_subscription_partial_constraint_allows_non_live_duplicate():
    # Constraint only covers trialing/active — a canceled row alongside an active one is fine.
    user = UserFactory()
    SubscriptionFactory(user=user, status=SubStatus.CANCELED)
    SubscriptionFactory(user=user, status=SubStatus.ACTIVE)
    assert Subscription.objects.filter(user=user).count() == 2


@pytest.mark.django_db
def test_patron_tier_unique_season_code():
    season = SeasonFactory()
    PatronTierFactory(season=season, code=PatronCode.ALLY)
    with pytest.raises(IntegrityError):
        PatronTier.objects.create(
            season=season, code=PatronCode.ALLY, role_label="x", title="dup", amount=450
        )


@pytest.mark.django_db
def test_patronage_unique_active_user_tier():
    user, tier = UserFactory(), PatronTierFactory()
    PatronageFactory(user=user, tier=tier, status=PatronageStatus.PAID)
    with pytest.raises(IntegrityError):
        Patronage.objects.create(
            user=user, tier=tier, amount=tier.amount, status=PatronageStatus.PENDING
        )


@pytest.mark.django_db
def test_patronage_refunded_does_not_block_new():
    # Constraint only covers pending/paid — refunded leaves the slot open.
    user, tier = UserFactory(), PatronTierFactory()
    PatronageFactory(user=user, tier=tier, status=PatronageStatus.REFUNDED)
    PatronageFactory(user=user, tier=tier, status=PatronageStatus.PAID)
    assert Patronage.objects.filter(user=user, tier=tier).count() == 2


@pytest.mark.django_db
def test_free_grant_unique_user_episode_period():
    user, episode = UserFactory(), EpisodeFactory()
    FreePlayGrantFactory(user=user, episode=episode, period="2026-06")
    with pytest.raises(IntegrityError):
        FreePlayGrant.objects.create(user=user, episode=episode, period="2026-06")


@pytest.mark.django_db
def test_free_grant_different_period_ok():
    user, episode = UserFactory(), EpisodeFactory()
    FreePlayGrantFactory(user=user, episode=episode, period="2026-06")
    FreePlayGrantFactory(user=user, episode=episode, period="2026-07")
    assert FreePlayGrant.objects.filter(user=user, episode=episode).count() == 2


@pytest.mark.django_db
def test_subscription_is_live():
    future = timezone.now() + timedelta(days=10)
    past = timezone.now() - timedelta(days=1)
    assert SubscriptionFactory(status=SubStatus.ACTIVE, period_end=future).is_live is True
    assert SubscriptionFactory(status=SubStatus.TRIALING, period_end=future).is_live is True
    # No period_end set yet (fresh checkout) — live status still counts as live.
    assert SubscriptionFactory(status=SubStatus.ACTIVE, period_end=None).is_live is True
    assert SubscriptionFactory(status=SubStatus.CANCELED, period_end=future).is_live is False
    assert SubscriptionFactory(status=SubStatus.ACTIVE, period_end=past).is_live is False


def test_text_choices_values():
    assert {c for c in PlanCode.values} == {"free", "solo", "klan"}
    assert {c for c in SubStatus.values} == {
        "incomplete",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "expired",
    }
    assert {c for c in BillingPeriod.values} == {"month", "year"}
    assert {c for c in PatronCode.values} == {"witness", "ally", "exec"}
    assert {c for c in PatronageStatus.values} == {"pending", "paid", "refunded", "canceled"}
