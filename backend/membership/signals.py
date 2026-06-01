from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from membership.models import Patronage, PatronTier, Plan


def _invalidate_membership_cache():
    try:
        cache.delete_pattern("membership:*")
    except AttributeError:
        # Fallback dla backendów bez delete_pattern (np. LocMemCache) — kasuj znane klucze,
        # w tym warianty per-sezon membership:patron_tiers:<number> wyprowadzone z bazy.
        keys = ["membership:plans", "membership:patron_tiers"]
        keys += [
            f"membership:patron_tiers:{n}"
            for n in PatronTier.objects.values_list("season__number", flat=True).distinct()
        ]
        cache.delete_many(keys)


# Patronage zmienia seats_taken/seats_remaining cache'owane na instancjach PatronTier,
# więc jego zapis/usunięcie też musi inwalidować membership:patron_tiers*.
@receiver([post_save, post_delete], sender=Plan)
@receiver([post_save, post_delete], sender=PatronTier)
@receiver([post_save, post_delete], sender=Patronage)
def invalidate_membership_cache(sender, **kwargs):
    _invalidate_membership_cache()
