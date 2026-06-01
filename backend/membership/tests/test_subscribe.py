import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from membership.models import BillingPeriod, PlanCode, Subscription, SubStatus
from membership.tests.factories import PlanFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


class FakeSession:
    """Stand-in for stripe.checkout.Session (only .id and .url are read)."""

    def __init__(self, id="cs_test_123", url="https://stripe.test/checkout/cs_test_123"):
        self.id = id
        self.url = url


@pytest.mark.django_db
def test_subscribe_requires_auth():
    PlanFactory(code=PlanCode.FREE, price_month=0, price_year=0)
    r = APIClient().post(
        "/api/v1/membership/subscribe",
        {"plan_code": PlanCode.FREE, "billing_period": BillingPeriod.MONTH},
        format="json",
    )
    assert r.status_code == 401


@pytest.mark.django_db
def test_subscribe_free_creates_active_no_stripe(monkeypatch):
    called = {"checkout": False}

    def _fake_checkout(**kwargs):
        called["checkout"] = True
        return FakeSession()

    monkeypatch.setattr("membership.payments.create_subscription_checkout", _fake_checkout)
    PlanFactory(code=PlanCode.FREE, price_month=0, price_year=0)
    user = UserFactory()

    r = _client(user).post(
        "/api/v1/membership/subscribe",
        {"plan_code": PlanCode.FREE, "billing_period": BillingPeriod.MONTH},
        format="json",
    )

    assert r.status_code == 200
    assert r.json() == {"status": "active"}
    assert called["checkout"] is False
    sub = Subscription.objects.get(user=user)
    assert sub.status == SubStatus.ACTIVE
    assert sub.plan.code == PlanCode.FREE


@pytest.mark.django_db
def test_subscribe_paid_returns_checkout_url_and_incomplete_row(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_subscription_checkout",
        lambda **kwargs: FakeSession(url="https://stripe.test/checkout/solo"),
    )
    PlanFactory(
        code=PlanCode.SOLO,
        price_month=29,
        price_year=24,
        stripe_price_id_month="price_solo_m",
        stripe_price_id_year="price_solo_y",
    )
    user = UserFactory()

    r = _client(user).post(
        "/api/v1/membership/subscribe",
        {"plan_code": PlanCode.SOLO, "billing_period": BillingPeriod.MONTH},
        format="json",
    )

    assert r.status_code == 200
    assert r.json() == {"checkout_url": "https://stripe.test/checkout/solo"}
    sub = Subscription.objects.get(user=user)
    assert sub.status == SubStatus.INCOMPLETE
    assert sub.plan.code == PlanCode.SOLO
    assert (
        getattr(sub, "stripe_checkout_session_id", None) == "cs_test_123"
        or sub.stripe_subscription_id == ""
    )


@pytest.mark.django_db
def test_subscribe_paid_trial_30_first_time_then_0(monkeypatch):
    captured = []

    def _fake_checkout(*, user, price_id, trial_days):
        captured.append(trial_days)
        return FakeSession()

    monkeypatch.setattr("membership.payments.create_subscription_checkout", _fake_checkout)
    PlanFactory(
        code=PlanCode.SOLO,
        price_month=29,
        price_year=24,
        stripe_price_id_month="price_solo_m",
        stripe_price_id_year="price_solo_y",
    )
    user = UserFactory()
    body = {"plan_code": PlanCode.SOLO, "billing_period": BillingPeriod.MONTH}

    r1 = _client(user).post("/api/v1/membership/subscribe", body, format="json")
    assert r1.status_code == 200
    # Second checkout: the user now has a prior Subscription row -> no trial.
    r2 = _client(user).post("/api/v1/membership/subscribe", body, format="json")
    assert r2.status_code == 200

    assert captured == [30, 0]


@pytest.mark.django_db
def test_subscribe_unknown_plan_code_is_400():
    user = UserFactory()
    r = _client(user).post(
        "/api/v1/membership/subscribe",
        {"plan_code": "ghost", "billing_period": BillingPeriod.MONTH},
        format="json",
    )
    assert r.status_code == 400
