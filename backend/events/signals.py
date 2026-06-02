from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from events.models import Event, Registration, RegStatus


@receiver([post_save, post_delete], sender=Event)
def invalidate_events_cache(sender, instance, **kwargs):
    try:
        cache.delete_pattern("events:*")
    except AttributeError:
        # Fallback for cache backends that do not support delete_pattern (e.g. LocMemCache)
        _whens = ["all", "upcoming", "past"]
        _modes = ["all", "online", "live", "klan"]
        keys = [f"events:list:{w}:{m}" for w in _whens for m in _modes]
        cache.delete_many(keys)


@receiver([post_save, post_delete], sender=Registration)
def recompute_seats(sender, instance, **kwargs):
    count = Registration.objects.filter(
        event_id=instance.event_id, status=RegStatus.CONFIRMED
    ).count()
    Event.all_objects.filter(pk=instance.event_id).update(seats_taken=count)
