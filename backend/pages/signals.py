from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from pages.models import LegalDoc, PressItem


@receiver([post_save, post_delete], sender=LegalDoc)
def invalidate_legal_cache(sender, instance, **kwargs):
    try:
        cache.delete_pattern("pages:legal*")
    except AttributeError:
        # Fallback for cache backends that do not support delete_pattern (e.g. LocMemCache)
        from pages.models import LegalKind

        keys = ["pages:legal"] + [f"pages:legal:{k}" for k, _ in LegalKind.choices]
        cache.delete_many(keys)


@receiver([post_save, post_delete], sender=PressItem)
def invalidate_press_cache(sender, instance, **kwargs):
    try:
        cache.delete_pattern("pages:press*")
    except AttributeError:
        cache.delete("pages:press")
