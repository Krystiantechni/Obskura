from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from support.models import FaqCategory, FaqItem


@receiver([post_save, post_delete], sender=FaqCategory)
@receiver([post_save, post_delete], sender=FaqItem)
def invalidate_faq_cache(sender, instance, **kwargs):
    try:
        cache.delete_pattern("support:faq*")
    except AttributeError:
        # Fallback for cache backends that do not support delete_pattern (e.g. LocMemCache)
        cache.delete("support:faq")
