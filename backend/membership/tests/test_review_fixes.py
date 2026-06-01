"""Regresje dla poprawek z adversarialnego przeglądu B4."""

from datetime import timedelta

import pytest
from django.utils import timezone
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from membership import selectors, services
from membership.models import (
    BillingPeriod,
    PatronageStatus,
    PlanCode,
    Subscription,
    SubStatus,
)
from membership.tests.factories import (
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
    SubscriptionFactory,
)


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _completed_event(monkeypatch, obj):
    monkeypatch.setattr(
        "membership.payments.construct_event",
        lambda **kwargs: {"type": "checkout.session.completed", "data": {"object": obj}},
    )


# --- FIX 1: wygasła subskrypcja nie daje pełnego dostępu --------------------


@pytest.mark.django_db
def test_expired_active_subscription_grants_no_access():
    user = UserFactory()
    SubscriptionFactory(
        user=user,
        plan=PlanFactory(code=PlanCode.SOLO),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() - timedelta(days=1),  # okres minął
    )
    ent = selectors.entitlement(user=user)
    assert ent["full_access"] is False
    assert ent["plan_code"] == PlanCode.FREE

    premium = EpisodeFactory(premium=True)
    assert selectors.can_access_audio(user=user, episode=premium) is False


# --- FIX 2: free subscribe nie wywala się przy wielu wierszach usera --------


@pytest.mark.django_db
def test_free_subscribe_with_multiple_existing_rows_no_crash():
    user = UserFactory()
    solo = PlanFactory(code=PlanCode.SOLO)
    SubscriptionFactory(user=user, plan=solo, status=SubStatus.CANCELED)
    SubscriptionFactory(user=user, plan=solo, status=SubStatus.EXPIRED)
    free = PlanFactory(code=PlanCode.FREE, price_month=0, price_year=0)

    result = services.subscribe(user=user, plan=free, billing_period=BillingPeriod.MONTH)

    assert result == {"status": "active"}
    live = Subscription.objects.filter(user=user, status__in=[SubStatus.TRIALING, SubStatus.ACTIVE])
    assert live.count() == 1
    assert live.first().plan.code == PlanCode.FREE


# --- FIX 3: upgrade free -> paid dostaje trial 30 --------------------------


@pytest.mark.django_db
def test_free_then_paid_still_gets_trial(monkeypatch):
    captured = []

    def _fake_checkout(*, user, price_id, trial_days):
        captured.append(trial_days)

        class _S:
            url = "https://stripe.test/c"

        return _S()

    monkeypatch.setattr("membership.payments.create_subscription_checkout", _fake_checkout)
    user = UserFactory()
    free = PlanFactory(code=PlanCode.FREE, price_month=0, price_year=0)
    solo = PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24)

    services.subscribe(user=user, plan=free, billing_period=BillingPeriod.MONTH)
    services.subscribe(user=user, plan=solo, billing_period=BillingPeriod.MONTH)

    assert captured == [30]  # plan free NIE zżarł trialu


# --- FIX 4: aktywny płatny plan blokuje kolejny checkout --------------------


@pytest.mark.django_db
def test_paid_resubscribe_blocked_when_already_active():
    user = UserFactory()
    SubscriptionFactory(
        user=user,
        plan=PlanFactory(code=PlanCode.SOLO),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    klan = PlanFactory(code=PlanCode.KLAN, price_month=49, price_year=39)
    r = _client(user).post(
        "/api/v1/membership/subscribe",
        {"plan_code": PlanCode.KLAN, "billing_period": BillingPeriod.MONTH},
        format="json",
    )
    assert r.status_code == 400
    assert klan  # plan istnieje, ale checkout odrzucony


# --- FIX 5: webhook idempotentny + upgrade free->paid degraduje free --------


@pytest.mark.django_db
def test_webhook_redelivery_does_not_resurrect_canceled_sub(monkeypatch):
    sub = SubscriptionFactory(
        plan=PlanFactory(code=PlanCode.SOLO),
        status=SubStatus.CANCELED,
        stripe_subscription_id="sub_x",
    )
    _completed_event(monkeypatch, {"mode": "subscription", "id": "evt", "subscription": "sub_x"})
    APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=x",
    )
    sub.refresh_from_db()
    assert sub.status == SubStatus.CANCELED


@pytest.mark.django_db
def test_webhook_activation_demotes_other_live_sub(monkeypatch):
    user = UserFactory()
    free_sub = SubscriptionFactory(
        user=user,
        plan=PlanFactory(code=PlanCode.FREE, price_month=0, price_year=0),
        status=SubStatus.ACTIVE,
    )
    paid = SubscriptionFactory(
        user=user, plan=PlanFactory(code=PlanCode.SOLO), status=SubStatus.INCOMPLETE
    )
    _completed_event(
        monkeypatch,
        {
            "mode": "subscription",
            "customer": "cus_1",
            "subscription": "sub_1",
            "client_reference_id": str(user.pk),
            "metadata": {"user_id": str(user.pk)},
        },
    )
    APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=x",
    )
    paid.refresh_from_db()
    free_sub.refresh_from_db()
    assert paid.status == SubStatus.ACTIVE
    assert free_sub.status == SubStatus.CANCELED
    assert (
        Subscription.objects.filter(
            user=user, status__in=[SubStatus.TRIALING, SubStatus.ACTIVE]
        ).count()
        == 1
    )


# --- FIX 6: re-delivery nie wskrzesza refunded ------------------------------


@pytest.mark.django_db
def test_patronage_webhook_does_not_resurrect_refunded(monkeypatch):
    patronage = PatronageFactory(status=PatronageStatus.REFUNDED)
    _completed_event(
        monkeypatch, {"mode": "payment", "metadata": {"patronage_id": str(patronage.pk)}}
    )
    APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=x",
    )
    patronage.refresh_from_db()
    assert patronage.status == PatronageStatus.REFUNDED


# --- FIX 9: nadkomplet przy płatności -> refunded ---------------------------


@pytest.mark.django_db
def test_patronage_over_capacity_at_payment_is_refunded(monkeypatch):
    tier = PatronTierFactory(code="exec", capacity=1, amount=2400)
    PatronageFactory(tier=tier, status=PatronageStatus.PAID)  # miejsce zajęte
    second = PatronageFactory(tier=tier, status=PatronageStatus.PENDING)
    _completed_event(monkeypatch, {"mode": "payment", "metadata": {"patronage_id": str(second.pk)}})
    APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=x",
    )
    second.refresh_from_db()
    assert second.status == PatronageStatus.REFUNDED


# --- FIX 7: zmiana patronatu inwaliduje cache miejsc ------------------------


@pytest.mark.django_db
def test_paying_patronage_invalidates_patron_tiers_cache():
    tier = PatronTierFactory(code="exec", capacity=12, amount=2400)
    before = APIClient().get("/api/v1/membership/patron-tiers").json()
    seats_before = next(t["seats_remaining"] for t in before if t["id"] == tier.id)
    assert seats_before == 12

    PatronageFactory(tier=tier, status=PatronageStatus.PAID)  # signal -> invalidacja

    after = APIClient().get("/api/v1/membership/patron-tiers").json()
    seats_after = next(t["seats_remaining"] for t in after if t["id"] == tier.id)
    assert seats_after == 11


# --- FIX 11: nieparsowalny season -> 400 ------------------------------------


@pytest.mark.django_db
def test_patron_tiers_invalid_season_is_400():
    r = APIClient().get("/api/v1/membership/patron-tiers?season=abc")
    assert r.status_code == 400
