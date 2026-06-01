import pytest
from knox.models import AuthToken
from rest_framework.test import APIClient

from accounts.tests.factories import UserFactory
from catalog.tests.factories import SeasonFactory
from membership.models import Patronage, PatronTier
from membership.tests.factories import PatronageFactory, PatronTierFactory


def _client(user):
    c = APIClient()
    _, t = AuthToken.objects.create(user)
    c.credentials(HTTP_AUTHORIZATION=f"Token {t}")
    return c


def _fake_checkout(url="https://stripe.test/checkout/cs_test_patron"):
    class _Session:
        id = "cs_test_patron"

        def __init__(self):
            self.url = url

    return _Session()


@pytest.mark.django_db
def test_patronages_requires_auth():
    assert APIClient().get("/api/v1/membership/patronages").status_code == 401


@pytest.mark.django_db
def test_create_patronage_returns_checkout_url_and_pending_row(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    user = UserFactory()
    tier = PatronTierFactory(amount=120)
    resp = _client(user).post(
        "/api/v1/membership/patronages",
        {"tier_id": tier.id},
        format="json",
    )
    assert resp.status_code == 201
    assert resp.json()["checkout_url"] == "https://stripe.test/checkout/cs_test_patron"
    row = Patronage.objects.get(user=user, tier=tier)
    assert row.status == Patronage.PatronageStatus.PENDING
    assert row.amount == 120
    assert row.stripe_checkout_session_id == "cs_test_patron"


@pytest.mark.django_db
def test_create_patronage_sold_out_returns_400(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    tier = PatronTierFactory(capacity=1)
    # capacity reached by an existing paid patronage
    PatronageFactory(tier=tier, status=Patronage.PatronageStatus.PAID)
    resp = _client(UserFactory()).post(
        "/api/v1/membership/patronages",
        {"tier_id": tier.id},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_patronage_pending_does_not_fill_seat(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    tier = PatronTierFactory(capacity=1)
    # a pending patronage by another user must NOT block the seat
    PatronageFactory(tier=tier, status=Patronage.PatronageStatus.PENDING)
    resp = _client(UserFactory()).post(
        "/api/v1/membership/patronages",
        {"tier_id": tier.id},
        format="json",
    )
    assert resp.status_code == 201


@pytest.mark.django_db
def test_create_patronage_duplicate_active_returns_400(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    user = UserFactory()
    tier = PatronTierFactory()
    PatronageFactory(user=user, tier=tier, status=Patronage.PatronageStatus.PENDING)
    resp = _client(user).post(
        "/api/v1/membership/patronages",
        {"tier_id": tier.id},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_patronage_inactive_tier_returns_400(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    tier = PatronTierFactory(is_active=False)
    resp = _client(UserFactory()).post(
        "/api/v1/membership/patronages",
        {"tier_id": tier.id},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_patronage_unknown_tier_returns_400(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    resp = _client(UserFactory()).post(
        "/api/v1/membership/patronages",
        {"tier_id": 999999},
        format="json",
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_create_patronage_anonymous_flag_persisted(monkeypatch):
    monkeypatch.setattr(
        "membership.payments.create_payment_checkout",
        lambda **kwargs: _fake_checkout(),
    )
    user = UserFactory()
    tier = PatronTierFactory()
    _client(user).post(
        "/api/v1/membership/patronages",
        {"tier_id": tier.id, "is_anonymous": True, "credit_name": "Cień"},
        format="json",
    )
    row = Patronage.objects.get(user=user, tier=tier)
    assert row.is_anonymous is True
    assert row.credit_name == "Cień"
    assert row.anon_number is None  # assigned only on webhook -> paid


@pytest.mark.django_db
def test_list_patronages_returns_only_own():
    season = SeasonFactory()
    t1 = PatronTierFactory(season=season, code=PatronTier.PatronCode.WITNESS)
    t2 = PatronTierFactory(season=season, code=PatronTier.PatronCode.ALLY)
    mine, other = UserFactory(), UserFactory()
    PatronageFactory(user=mine, tier=t1, status=Patronage.PatronageStatus.PAID)
    PatronageFactory(user=other, tier=t2, status=Patronage.PatronageStatus.PAID)
    body = _client(mine).get("/api/v1/membership/patronages").json()
    results = body["results"] if isinstance(body, dict) and "results" in body else body
    assert len(results) == 1
    assert results[0]["tier"]["id"] == t1.id


@pytest.mark.django_db
def test_list_patronages_no_nplus1(django_assert_num_queries):
    season = SeasonFactory()
    user = UserFactory()
    for code in (
        PatronTier.PatronCode.WITNESS,
        PatronTier.PatronCode.ALLY,
        PatronTier.PatronCode.EXEC,
    ):
        tier = PatronTierFactory(season=season, code=code)
        PatronageFactory(user=user, tier=tier, status=Patronage.PatronageStatus.PAID)
    c = _client(user)
    # warm: ContentType / auth lookups are not part of the query budget under test;
    # the list itself must stay flat regardless of row count (select_related tier+season).
    with django_assert_num_queries(3):
        c.get("/api/v1/membership/patronages")
