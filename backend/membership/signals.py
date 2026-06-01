from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from membership.models import PatronTier, Plan


@receiver([post_save, post_delete], sender=Plan)
@receiver([post_save, post_delete], sender=PatronTier)
def invalidate_membership_cache(sender, **kwargs):
    try:
        cache.delete_pattern("membership:*")
    except AttributeError:
        # Fallback dla backendów bez delete_pattern (np. LocMemCache) — kasuj znane klucze,
        # w tym warianty per-sezon membership:patron_tiers:<number>.
        keys = ["membership:plans", "membership:patron_tiers"]
        keys += [f"membership:patron_tiers:{n}" for n in range(1, 21)]
        cache.delete_many(keys)
