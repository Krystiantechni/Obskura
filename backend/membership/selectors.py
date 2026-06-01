from django.core.cache import cache
from django.db.models import Count, Q
from django.utils import timezone

from catalog.models import Season
from membership.models import (
    FreePlayGrant,
    Patronage,
    PatronageStatus,
    PatronTier,
    Plan,
    PlanCode,
    Subscription,
    SubStatus,
)

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
        .filter(Q(period_end__isnull=True) | Q(period_end__gt=timezone.now()))
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


def free_grants_used(*, user, period):
    """Liczba różnych odcinków odtworzonych przez usera w danym miesiącu (YYYY-MM)."""
    return FreePlayGrant.objects.filter(user=user, period=period).count()


def entitlement(*, user):
    """Lekki opis uprawnień usera (spec §5).

    full_access: żywa subskrypcja solo/klan LUB opłacony patronat bieżącego sezonu.
    plan_code:   kod planu, "free" dla zalogowanego bez subskrypcji, None dla anonima.
    monthly_quota: 20 dla free, None (∞) dla pełnego dostępu i anonima.
    """
    if user is None or not getattr(user, "is_authenticated", False):
        return {"full_access": False, "plan_code": None, "monthly_quota": None}

    sub = active_subscription(user=user)
    if sub is not None and sub.plan.code in (PlanCode.SOLO, PlanCode.KLAN):
        return {"full_access": True, "plan_code": sub.plan.code, "monthly_quota": None}

    season = current_season()
    if season is not None:
        has_patronage = Patronage.objects.filter(
            user=user,
            tier__season=season,
            status=PatronageStatus.PAID,
        ).exists()
        if has_patronage:
            return {"full_access": True, "plan_code": PlanCode.FREE, "monthly_quota": None}

    return {"full_access": False, "plan_code": PlanCode.FREE, "monthly_quota": 20}


def can_access_audio(*, user, episode):
    """Czysty read (bez mutacji) — czy user widzi audio_url odcinka (spec §5/§6)."""
    ent = entitlement(user=user)
    if episode.premium:
        return ent["full_access"]
    if ent["full_access"]:
        return True
    if ent["plan_code"] is None:
        # anonim — publiczny preview nie-premium
        return True
    # zalogowany free — limit metrowany, ale podgląd nie zżera quoty
    from membership.services import current_period

    period = current_period()
    already = FreePlayGrant.objects.filter(user=user, episode=episode, period=period).exists()
    return already or free_grants_used(user=user, period=period) < ent["monthly_quota"]
