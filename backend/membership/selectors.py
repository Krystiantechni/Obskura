from django.core.cache import cache
from django.db.models import Count, Q

from catalog.models import Season
from membership.models import Patronage, PatronageStatus, PatronTier, Plan, Subscription, SubStatus

CACHE_TTL = 60 * 15  # 15 min


def current_season():
    """Bieżący sezon = sezon o najwyższym numerze (lub None)."""
    return Season.objects.order_by("-number").first()


def plans():
    return Plan.objects.filter(is_active=True)


def plans_cached():
    data = cache.get("membership:plans")
    if data is None:
        data = list(plans())
        cache.set("membership:plans", data, CACHE_TTL)
    return data


def patron_tiers(*, season=None):
    qs = (
        PatronTier.objects.filter(is_active=True)
        .select_related("season")
        .annotate(
            seats_taken=Count(
                "patronages",
                filter=Q(patronages__status=PatronageStatus.PAID),
            )
        )
    )
    if season is not None:
        qs = qs.filter(season__number=season)
    return qs


def active_subscription(*, user):
    """Bieżąca żywa subskrypcja użytkownika (trialing/active) lub None."""
    if not user or not user.is_authenticated:
        return None
    return (
        Subscription.objects.select_related("plan")
        .filter(user=user, status__in=[SubStatus.TRIALING, SubStatus.ACTIVE])
        .first()
    )


def user_patronages(*, user):
    return (
        Patronage.objects.filter(user=user)
        .select_related("tier", "tier__season")
        .order_by("-created_at")
    )


def patron_tiers_cached(*, season=None):
    key = "membership:patron_tiers" if season is None else f"membership:patron_tiers:{season}"
    data = cache.get(key)
    if data is None:
        data = list(patron_tiers(season=season))
        cache.set(key, data, CACHE_TTL)
    return data
