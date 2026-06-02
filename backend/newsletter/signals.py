from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from newsletter.models import Campaign


@receiver([post_save, post_delete], sender=Campaign)
def invalidate_mailings_cache(sender, instance, **kwargs):
    try:
        cache.delete_pattern("newsletter:mailings*")
    except AttributeError:
        # Fallback for cache backends that do not support delete_pattern (e.g. LocMemCache)
        cache.delete("newsletter:mailings")
