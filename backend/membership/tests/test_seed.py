import pytest
from django.core.management import call_command

from catalog.models import Season
from membership.models import PatronTier, Plan


@pytest.mark.django_db
def test_seed_membership_creates_plans_and_tiers():
    call_command("seed_membership")

    assert Plan.objects.count() == 3
    assert PatronTier.objects.count() == 3

    free = Plan.objects.get(code="free")
    solo = Plan.objects.get(code="solo")
    klan = Plan.objects.get(code="klan")

    assert free.price_month == 0
    assert free.price_year == 0
    assert free.monthly_quota == 20
    assert free.featured is False

    assert solo.price_month == 29
    assert solo.price_year == 24
    assert solo.featured is True
    assert solo.badge == "85% WYBIERA"
    assert solo.monthly_quota is None

    assert klan.price_month == 49
    assert klan.price_year == 39
    assert klan.featured is False

    # Plan features mirror Club.jsx (8 bullets each, non-empty)
    for plan in (free, solo, klan):
        assert isinstance(plan.features, list)
        assert len(plan.features) == 8
        assert all("text" in f and "ok" in f for f in plan.features)


@pytest.mark.django_db
def test_seed_membership_creates_tiers_for_current_season_without_existing_season():
    # No season exists at all — command must create / pick one gracefully.
    assert Season.objects.count() == 0

    call_command("seed_membership")

    assert Season.objects.count() >= 1
    tiers = PatronTier.objects.all()
    assert tiers.count() == 3

    witness = PatronTier.objects.get(code="witness")
    ally = PatronTier.objects.get(code="ally")
    exec_tier = PatronTier.objects.get(code="exec")

    assert witness.amount == 120
    assert witness.featured is False
    assert witness.role_label == "// ŚWIADEK"

    assert ally.amount == 450
    assert ally.featured is True

    assert exec_tier.amount == 2400
    assert exec_tier.capacity == 12
    assert exec_tier.requires_application is True

    # Perks mirror Patrons.jsx (non-empty list of strings)
    for tier in (witness, ally, exec_tier):
        assert isinstance(tier.perks, list)
        assert len(tier.perks) >= 5
        assert all(isinstance(p, str) for p in tier.perks)


@pytest.mark.django_db
def test_seed_membership_is_idempotent():
    call_command("seed_membership")
    call_command("seed_membership")  # second run must not duplicate

    assert Plan.objects.count() == 3
    assert PatronTier.objects.count() == 3
