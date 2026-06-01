import factory

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

_PLAN_CODES = [PlanCode.FREE, PlanCode.SOLO, PlanCode.KLAN]
_PATRON_CODES = [PatronCode.WITNESS, PatronCode.ALLY, PatronCode.EXEC]


class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plan
        django_get_or_create = ("code",)

    code = factory.Iterator(_PLAN_CODES)
    name = factory.Sequence(lambda n: f"Plan {n}")
    price_month = 29
    price_year = 24
    currency = "PLN"
    featured = False
    tag = ""
    badge = ""
    cta_label = "Dołącz"
    monthly_quota = None
    features = factory.List([])
    is_active = True
    order = factory.Sequence(lambda n: n)


class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscription

    user = factory.SubFactory(UserFactory)
    plan = factory.SubFactory(PlanFactory)
    status = SubStatus.ACTIVE
    billing_period = BillingPeriod.MONTH


class PatronTierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PatronTier
        django_get_or_create = ("season", "code")

    season = factory.SubFactory(SeasonFactory)
    code = factory.Iterator(_PATRON_CODES)
    role_label = factory.Sequence(lambda n: f"// TIER {n}")
    title = factory.Sequence(lambda n: f"Tier {n}")
    amount = 120
    currency = "PLN"
    featured = False
    capacity = None
    requires_application = False
    perks = factory.List([])
    is_active = True
    order = factory.Sequence(lambda n: n)


class PatronageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Patronage

    user = factory.SubFactory(UserFactory)
    tier = factory.SubFactory(PatronTierFactory)
    amount = factory.LazyAttribute(lambda o: o.tier.amount)
    status = PatronageStatus.PENDING
    is_anonymous = False
    credit_name = ""


class FreePlayGrantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FreePlayGrant

    user = factory.SubFactory(UserFactory)
    episode = factory.SubFactory(EpisodeFactory)
    period = "2026-06"
