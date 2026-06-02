"""B5b Task 5 — klan-gating, płatne bilety (Stripe mock), webhook potwierdzenia."""

from datetime import timedelta

import pytest
from django.utils import timezone
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from events.models import EventMode, Registration, RegStatus
from events.tests.factories import EventFactory, RegistrationFactory
from membership.models import PatronageStatus, PlanCode, SubStatus
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


def _klan_user():
    u = UserFactory()
    SubscriptionFactory(
        user=u,
        plan=PlanFactory(code=PlanCode.KLAN),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    return u


def _solo_user():
    u = UserFactory()
    SubscriptionFactory(
        user=u,
        plan=PlanFactory(code=PlanCode.SOLO),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    return u


class FakeSession:
    def __init__(self, id="cs_evt", url="https://stripe.test/evt"):
        self.id = id
        self.url = url


def _webhook(monkeypatch, obj):
    monkeypatch.setattr(
        "membership.payments.construct_event",
        lambda **kw: {"type": "checkout.session.completed", "data": {"object": obj}},
    )
    return APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=x",
    )


# --- klan-gating ------------------------------------------------------------


@pytest.mark.django_db
def test_klan_event_blocks_solo_user():
    event = EventFactory(mode=EventMode.KLAN, price_pln=0)
    res = _client(_solo_user()).post(f"/api/v1/events/{event.slug}/register")
    assert res.status_code == 403
    assert "klan_required" in str(res.json())


@pytest.mark.django_db
def test_klan_event_blocks_free_user():
    event = EventFactory(mode=EventMode.KLAN, price_pln=0)
    res = _client(UserFactory()).post(f"/api/v1/events/{event.slug}/register")
    assert res.status_code == 403


@pytest.mark.django_db
def test_klan_event_allows_klan_subscriber():
    event = EventFactory(mode=EventMode.KLAN, price_pln=0)
    res = _client(_klan_user()).post(f"/api/v1/events/{event.slug}/register")
    assert res.status_code == 201
    assert res.json()["status"] == RegStatus.CONFIRMED


@pytest.mark.django_db
def test_klan_event_allows_patron():
    u = UserFactory()
    PatronageFactory(user=u, tier=PatronTierFactory(code="exec"), status=PatronageStatus.PAID)
    event = EventFactory(mode=EventMode.KLAN, price_pln=0)
    res = _client(u).post(f"/api/v1/events/{event.slug}/register")
    assert res.status_code == 201


# --- paid tickets -----------------------------------------------------------


@pytest.mark.django_db
def test_paid_register_returns_checkout_and_pending(monkeypatch):
    monkeypatch.setattr("membership.payments.create_payment_checkout", lambda **kw: FakeSession())
    event = EventFactory(price_pln=35, capacity=10, stripe_price_id="price_evt")
    user = UserFactory()
    res = _client(user).post(f"/api/v1/events/{event.slug}/register")
    assert res.status_code == 201
    assert res.json()["checkout_url"] == "https://stripe.test/evt"
    reg = Registration.objects.get(event=event, user=user)
    assert reg.status == RegStatus.PENDING
    event.refresh_from_db()
    assert event.seats_taken == 0  # PENDING nie zajmuje miejsca


@pytest.mark.django_db
def test_paid_register_full_event_is_400(monkeypatch):
    monkeypatch.setattr("membership.payments.create_payment_checkout", lambda **kw: FakeSession())
    event = EventFactory(price_pln=35, capacity=1)
    RegistrationFactory(event=event, status=RegStatus.CONFIRMED)
    res = _client(UserFactory()).post(f"/api/v1/events/{event.slug}/register")
    assert res.status_code == 400
    assert "event_full" in str(res.json())


# --- webhook ----------------------------------------------------------------


@pytest.mark.django_db
def test_webhook_confirms_paid_registration(monkeypatch):
    event = EventFactory(price_pln=35, capacity=10)
    reg = RegistrationFactory(event=event, status=RegStatus.PENDING)
    res = _webhook(
        monkeypatch,
        {
            "mode": "payment",
            "payment_intent": "pi_1",
            "metadata": {"registration_id": str(reg.id)},
        },
    )
    assert res.status_code == 200
    reg.refresh_from_db()
    assert reg.status == RegStatus.CONFIRMED
    assert reg.stripe_payment_intent_id == "pi_1"
    event.refresh_from_db()
    assert event.seats_taken == 1


@pytest.mark.django_db
def test_webhook_oversold_paid_registration_canceled(monkeypatch):
    event = EventFactory(price_pln=35, capacity=1)
    RegistrationFactory(event=event, status=RegStatus.CONFIRMED)  # miejsce zajęte
    reg = RegistrationFactory(event=event, status=RegStatus.PENDING)
    _webhook(
        monkeypatch,
        {"mode": "payment", "metadata": {"registration_id": str(reg.id)}},
    )
    reg.refresh_from_db()
    assert reg.status == RegStatus.CANCELED


@pytest.mark.django_db
def test_patronage_webhook_still_works(monkeypatch):
    """Regresja: dispatch po metadata nie zepsuł ścieżki patronatu."""
    patronage = PatronageFactory(status=PatronageStatus.PENDING)
    _webhook(
        monkeypatch,
        {"mode": "payment", "metadata": {"patronage_id": str(patronage.pk)}},
    )
    patronage.refresh_from_db()
    assert patronage.status == PatronageStatus.PAID
