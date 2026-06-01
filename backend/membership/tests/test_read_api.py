import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from catalog.tests.factories import SeasonFactory
from membership.models import PatronageStatus
from membership.tests.factories import (
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
)


@pytest.fixture(autouse=True)
def _clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
def test_plans_list_public_no_auth():
    PlanFactory(code="free", name="Próg")
    PlanFactory(code="solo", name="Solo")
    res = APIClient().get("/api/v1/membership/plans")
    assert res.status_code == 200
    body = res.json()
    assert {p["code"] for p in body} == {"free", "solo"}


@pytest.mark.django_db
def test_plans_price_year_total_computed():
    PlanFactory(code="solo", price_year=24)
    body = APIClient().get("/api/v1/membership/plans").json()
    assert body[0]["price_year_total"] == 24 * 12


@pytest.mark.django_db
def test_plans_never_expose_stripe_fields():
    PlanFactory(code="solo", stripe_price_id_month="price_x", stripe_price_id_year="price_y")
    body = APIClient().get("/api/v1/membership/plans").json()
    assert "stripe_price_id_month" not in body[0]
    assert "stripe_price_id_year" not in body[0]


@pytest.mark.django_db
def test_patron_tiers_list_public_seats_remaining():
    tier = PatronTierFactory(code="exec", capacity=12)
    PatronageFactory(tier=tier, status=PatronageStatus.PAID)
    PatronageFactory(tier=tier, status=PatronageStatus.PENDING)  # nie liczy się
    body = APIClient().get("/api/v1/membership/patron-tiers").json()
    row = next(t for t in body if t["code"] == "exec")
    assert row["seats_remaining"] == 11


@pytest.mark.django_db
def test_patron_tiers_seats_remaining_null_when_no_capacity():
    PatronTierFactory(code="witness", capacity=None)
    body = APIClient().get("/api/v1/membership/patron-tiers").json()
    assert body[0]["seats_remaining"] is None


@pytest.mark.django_db
def test_patron_tiers_filter_by_season_query_param():
    s1 = SeasonFactory(number=1)
    s2 = SeasonFactory(number=2)
    PatronTierFactory(season=s1, code="witness")
    PatronTierFactory(season=s2, code="ally")
    body = APIClient().get("/api/v1/membership/patron-tiers?season=2").json()
    assert len(body) == 1
    assert body[0]["code"] == "ally"


@pytest.mark.django_db
def test_plans_cache_hit_second_request_no_queries(django_assert_num_queries):
    PlanFactory(code="free")
    c = APIClient()
    assert c.get("/api/v1/membership/plans").status_code == 200  # warmuje cache
    with django_assert_num_queries(0):
        res = c.get("/api/v1/membership/plans")
    assert res.status_code == 200


@pytest.mark.django_db
def test_patron_tiers_endpoint_no_nplus1(django_assert_max_num_queries):
    season = SeasonFactory(number=1)
    PatronTierFactory(season=season, code="witness")
    PatronTierFactory(season=season, code="ally")
    PatronTierFactory(season=season, code="exec")
    # 1 query (tiers + season select_related + seats_taken annotation), filtrowanie po
    # ?season trzyma stałą liczbę zapytań niezależnie od liczby tierów.
    with django_assert_max_num_queries(1):
        APIClient().get("/api/v1/membership/patron-tiers")
