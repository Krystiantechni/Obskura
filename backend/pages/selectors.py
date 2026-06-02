from django.core.cache import cache

from pages.models import LegalDoc, PressItem

CACHE_TTL = 60 * 15  # 15 minutes


def current_legal():
    """Return all LegalDoc rows where is_current=True."""
    return LegalDoc.objects.filter(is_current=True)


def current_legal_cached():
    key = "pages:legal"
    data = cache.get(key)
    if data is None:
        data = list(current_legal())
        cache.set(key, data, CACHE_TTL)
    return data


def legal_by_kind(*, kind):
    """Return the current LegalDoc for a given kind, or None."""
    return LegalDoc.objects.filter(is_current=True, kind=kind).first()


def legal_by_kind_cached(*, kind):
    key = f"pages:legal:{kind}"
    data = cache.get(key)
    if data is None:
        data = legal_by_kind(kind=kind)
        cache.set(key, data, CACHE_TTL)
    return data


def press_items():
    """Return active PressItems ordered by order."""
    return PressItem.objects.filter(is_active=True).order_by("order")


def press_items_cached():
    key = "pages:press"
    data = cache.get(key)
    if data is None:
        data = list(press_items())
        cache.set(key, data, CACHE_TTL)
    return data
