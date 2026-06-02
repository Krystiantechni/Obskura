from django.core.cache import cache
from django.db.models import Prefetch

from support.models import FaqCategory, FaqItem

CACHE_TTL = 60 * 15  # 15 minutes


def faq(*, category=None):
    """Return active FaqCategory queryset with prefetched active items.

    N+1-free: uses Prefetch to load active items in a single extra query.
    Optionally filter by category slug.
    """
    active_items = FaqItem.objects.filter(is_active=True).order_by("order")
    qs = FaqCategory.objects.filter(is_active=True).prefetch_related(
        Prefetch("items", queryset=active_items)
    )
    if category:
        qs = qs.filter(slug=category)
    return qs


def faq_cached(*, category=None):
    key = "support:faq" if not category else f"support:faq:{category}"
    data = cache.get(key)
    if data is None:
        qs = faq(category=category)
        # Materialise to plain dicts so the result is pickle-safe and can be
        # served directly from cache without touching the ORM again.
        data = [
            {
                "name": cat.name,
                "slug": cat.slug,
                "order": cat.order,
                "items": [
                    {
                        "question": item.question,
                        "answer": item.answer,
                        "order": item.order,
                    }
                    for item in cat.items.all()
                ],
            }
            for cat in qs
        ]
        cache.set(key, data, CACHE_TTL)
    return data
