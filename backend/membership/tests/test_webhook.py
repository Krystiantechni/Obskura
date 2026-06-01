import pytest
from knox.models import AuthToken
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from membership.models import PlanCode, Subscription, SubStatus
from membership.tests.factories import PlanFactory, SubscriptionFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


@pytest.mark.django_db
def test_webhook_checkout_completed_sets_active(monkeypatch):
    plan = PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24)
    user = UserFactory()
    sub = SubscriptionFactory(
        user=user, plan=plan, status=SubStatus.INCOMPLETE, stripe_customer_id=""
    )
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "mode": "subscription",
                "customer": "cus_abc",
                "subscription": "sub_abc",
                "metadata": {"subscription_id": str(sub.id)},
            }
        },
    }
    monkeypatch.setattr("membership.payments.construct_event", lambda **kwargs: event)

    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=deadbeef",
    )

    assert r.status_code == 200
    sub.refresh_from_db()
    assert sub.status == SubStatus.ACTIVE
    assert sub.stripe_customer_id == "cus_abc"
    assert sub.stripe_subscription_id == "sub_abc"


@pytest.mark.django_db
def test_webhook_checkout_completed_links_by_user_when_no_subscription_id(monkeypatch):
    """Realny kształt sesji (payments.create_subscription_checkout): brak
    metadata.subscription_id, jest client_reference_id + metadata.user_id."""
    plan = PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24)
    user = UserFactory()
    sub = SubscriptionFactory(
        user=user, plan=plan, status=SubStatus.INCOMPLETE, stripe_subscription_id=""
    )
    event = {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "mode": "subscription",
                "customer": "cus_real",
                "subscription": "sub_real",
                "client_reference_id": str(user.pk),
                "metadata": {"user_id": str(user.pk)},
            }
        },
    }
    monkeypatch.setattr("membership.payments.construct_event", lambda **kwargs: event)

    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=deadbeef",
    )

    assert r.status_code == 200
    sub.refresh_from_db()
    assert sub.status == SubStatus.ACTIVE
    assert sub.stripe_customer_id == "cus_real"
    assert sub.stripe_subscription_id == "sub_real"


@pytest.mark.django_db
def test_webhook_subscription_deleted_sets_canceled(monkeypatch):
    plan = PlanFactory(code=PlanCode.SOLO)
    sub = SubscriptionFactory(plan=plan, status=SubStatus.ACTIVE, stripe_subscription_id="sub_zzz")
    event = {
        "type": "customer.subscription.deleted",
        "data": {"object": {"id": "sub_zzz"}},
    }
    monkeypatch.setattr("membership.payments.construct_event", lambda **kwargs: event)

    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=deadbeef",
    )

    assert r.status_code == 200
    sub.refresh_from_db()
    assert sub.status == SubStatus.CANCELED


@pytest.mark.django_db
def test_webhook_payment_failed_sets_past_due(monkeypatch):
    plan = PlanFactory(code=PlanCode.SOLO)
    sub = SubscriptionFactory(plan=plan, status=SubStatus.ACTIVE, stripe_subscription_id="sub_pf")
    event = {
        "type": "invoice.payment_failed",
        "data": {"object": {"subscription": "sub_pf"}},
    }
    monkeypatch.setattr("membership.payments.construct_event", lambda **kwargs: event)

    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=deadbeef",
    )

    assert r.status_code == 200
    sub.refresh_from_db()
    assert sub.status == SubStatus.PAST_DUE


@pytest.mark.django_db
def test_webhook_bad_signature_returns_400(monkeypatch):
    def _boom(**kwargs):
        raise ValueError("bad signature")

    monkeypatch.setattr("membership.payments.construct_event", _boom)

    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=bogus",
    )

    assert r.status_code == 400


@pytest.mark.django_db
def test_webhook_open_no_auth_required(monkeypatch):
    # An empty/unknown event type must still return 200 (open endpoint, no token).
    monkeypatch.setattr(
        "membership.payments.construct_event",
        lambda **kwargs: {"type": "ping", "data": {"object": {}}},
    )
    r = APIClient().post(
        "/api/v1/membership/stripe/webhook",
        data=b"{}",
        content_type="application/json",
        HTTP_STRIPE_SIGNATURE="t=1,v1=deadbeef",
    )
    assert r.status_code == 200


@pytest.mark.django_db
def test_subscription_read_and_cancel(monkeypatch):
    cancelled = {"id": None}

    def _fake_cancel(*, stripe_subscription_id):
        cancelled["id"] = stripe_subscription_id

    monkeypatch.setattr("membership.payments.cancel_at_period_end", _fake_cancel)
    plan = PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24)
    user = UserFactory()
    sub = SubscriptionFactory(
        user=user, plan=plan, status=SubStatus.ACTIVE, stripe_subscription_id="sub_live"
    )
    c = _client(user)

    r_get = c.get("/api/v1/membership/subscription")
    assert r_get.status_code == 200
    assert r_get.json()["status"] == SubStatus.ACTIVE

    r_cancel = c.post("/api/v1/membership/subscription/cancel")
    assert r_cancel.status_code == 200
    assert r_cancel.json()["cancel_at_period_end"] is True
    sub.refresh_from_db()
    assert sub.cancel_at_period_end is True
    assert cancelled["id"] == "sub_live"


@pytest.mark.django_db
def test_subscription_read_none_when_no_live_sub():
    user = UserFactory()
    r = _client(user).get("/api/v1/membership/subscription")
    assert r.status_code == 200
    assert r.json() == {"subscription": None}


@pytest.mark.django_db
def test_subscription_requires_auth():
    assert APIClient().get("/api/v1/membership/subscription").status_code == 401
    assert APIClient().post("/api/v1/membership/subscription/cancel").status_code == 401


# Imported only so the linter does not flag the rescue path import used in services.
_ = (AuthenticationFailed, Subscription)
