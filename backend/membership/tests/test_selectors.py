import pytest

from catalog.tests.factories import SeasonFactory
from membership.models import PatronageStatus
from membership.selectors import patron_tiers, plans
from membership.tests.factories import (
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
)


@pytest.mark.django_db
def test_plans_only_active_ordered():
    PlanFactory(code="free", is_active=True, order=1)
    PlanFactory(code="solo", is_active=False, order=0)
    PlanFactory(code="klan", is_active=True, order=2)
    codes = [p.code for p in plans()]
    assert codes == ["free", "klan"]


@pytest.mark.django_db
def test_patron_tiers_seats_taken_counts_only_paid():
    tier = PatronTierFactory(capacity=12)
    PatronageFactory(tier=tier, status=PatronageStatus.PAID)
    PatronageFactory(tier=tier, status=PatronageStatus.PAID)
    PatronageFactory(tier=tier, status=PatronageStatus.PENDING)
    PatronageFactory(tier=tier, status=PatronageStatus.REFUNDED)
    got = patron_tiers().get(pk=tier.pk)
    assert got.seats_taken == 2


@pytest.mark.django_db
def test_patron_tiers_filter_by_season():
    s1 = SeasonFactory(number=1)
    s2 = SeasonFactory(number=2)
    PatronTierFactory(season=s1, code="witness")
    PatronTierFactory(season=s2, code="witness")
    assert patron_tiers(season=1).count() == 1


@pytest.mark.django_db
def test_patron_tiers_no_nplus1(django_assert_num_queries):
    season = SeasonFactory(number=1)
    PatronTierFactory(season=season, code="witness")
    PatronTierFactory(season=season, code="ally")
    PatronTierFactory(season=season, code="exec")
    qs = patron_tiers()
    # 1 query: tiers + season (select_related) + seats_taken (annotated aggregate),
    # constant regardless of tier count → no N+1.
    with django_assert_num_queries(1):
        data = [(t.season.number, t.seats_taken) for t in qs]
    assert len(data) == 3
