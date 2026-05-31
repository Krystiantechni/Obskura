from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from catalog.models import Creator, Episode, Genre, Season


@receiver([post_save, post_delete], sender=Genre)
@receiver([post_save, post_delete], sender=Season)
@receiver([post_save, post_delete], sender=Creator)
@receiver([post_save, post_delete], sender=Episode)
def invalidate_catalog_cache(sender, **kwargs):
    try:
        cache.delete_pattern("catalog:*")
    except AttributeError:
        # Fallback dla backendów bez delete_pattern (np. LocMemCache) — kasuj istniejące klucze.
        cache.delete_many(["catalog:genres", "catalog:seasons"])
