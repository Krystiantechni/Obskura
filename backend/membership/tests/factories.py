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


class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plan
        django_get_or_create = ("code",)

    code = PlanCode.SOLO
    name = "Solo"
    price_month = 29
    price_year = 24
    monthly_quota = None
    features = factory.LazyFunction(lambda: [{"ok": True, "text": "Bez limitu"}])
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

    season = factory.SubFactory(SeasonFactory)
    code = PatronCode.WITNESS
    role_label = "// ŚWIADEK"
    title = "Świadek"
    amount = 120
    perks = factory.LazyFunction(lambda: ["Imię w napisach"])
    order = factory.Sequence(lambda n: n)


class PatronageFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Patronage

    user = factory.SubFactory(UserFactory)
    tier = factory.SubFactory(PatronTierFactory)
    amount = factory.LazyAttribute(lambda o: o.tier.amount)
    status = PatronageStatus.PENDING


class FreePlayGrantFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FreePlayGrant

    user = factory.SubFactory(UserFactory)
    episode = factory.SubFactory(EpisodeFactory)
    period = "2026-06"
