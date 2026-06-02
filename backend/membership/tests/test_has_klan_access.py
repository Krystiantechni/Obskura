from datetime import timedelta

import pytest
from django.utils import timezone

from accounts.tests.factories import UserFactory
from membership.models import PatronageStatus, PlanCode, SubStatus
from membership.selectors import has_klan_access
from membership.tests.factories import (
    PatronageFactory,
    PatronTierFactory,
    PlanFactory,
    SubscriptionFactory,
)


@pytest.mark.django_db
def test_has_klan_access_solo_is_false():
    u = UserFactory()
    SubscriptionFactory(
        user=u,
        plan=PlanFactory(code=PlanCode.SOLO),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    assert has_klan_access(user=u) is False


@pytest.mark.django_db
def test_has_klan_access_klan_is_true():
    u = UserFactory()
    SubscriptionFactory(
        user=u,
        plan=PlanFactory(code=PlanCode.KLAN),
        status=SubStatus.ACTIVE,
        period_end=timezone.now() + timedelta(days=30),
    )
    assert has_klan_access(user=u) is True


@pytest.mark.django_db
def test_has_klan_access_patron_is_true():
    u = UserFactory()
    tier = PatronTierFactory(code="exec")
    PatronageFactory(user=u, tier=tier, status=PatronageStatus.PAID)
    assert has_klan_access(user=u) is True


@pytest.mark.django_db
def test_has_klan_access_anonymous_is_false():
    assert has_klan_access(user=None) is False
