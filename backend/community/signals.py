from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from community.models import Category


def _invalidate_community_cache():
    try:
        cache.delete_pattern("community:*")
    except AttributeError:
        # Fallback dla backendów bez delete_pattern (np. LocMemCache) — kasuj znane klucze.
        cache.delete_many(["community:categories"])


@receiver([post_save, post_delete], sender=Category)
def invalidate_community_cache(sender, **kwargs):
    _invalidate_community_cache()
