from django.core.cache import cache

from newsletter.models import Campaign

CACHE_TTL = 60 * 15  # 15 minutes


def campaigns():
    """Return active campaigns ordered by order."""
    return Campaign.objects.filter(is_active=True).order_by("order")


def campaigns_cached():
    key = "newsletter:mailings"
    data = cache.get(key)
    if data is None:
        qs = campaigns()
        data = list(qs.values("code", "label", "purpose", "freq_label", "tag", "order"))
        cache.set(key, data, CACHE_TTL)
    return data
