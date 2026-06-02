from django.core.cache import cache
from django.utils import timezone

from events.models import Event, EventStatus, RecordingAccess, Registration, RegStatus

CACHE_TTL = 60 * 15


def events_list(*, when=None, mode=None):
    qs = Event.objects.filter(status=EventStatus.PUBLISHED).select_related("host")
    now = timezone.now()
    if when == "past":
        qs = qs.filter(starts_at__lt=now)
    elif when == "upcoming":
        qs = qs.filter(starts_at__gte=now)
    if mode:
        qs = qs.filter(mode=mode)
    return qs


def events_list_cached(*, when=None, mode=None):
    key = f"events:list:{when or 'all'}:{mode or 'all'}"
    data = cache.get(key)
    if data is None:
        data = list(events_list(when=when, mode=mode))
        cache.set(key, data, CACHE_TTL)
    return data


def event_detail(*, slug):
    return (
        Event.objects.filter(status=EventStatus.PUBLISHED)
        .select_related("host")
        .filter(slug=slug)
        .first()
    )


def can_see_recording(*, user, event):
    if not event.recording_url:
        return False
    if event.recording_access == RecordingAccess.NONE:
        return True
    from membership.selectors import entitlement, has_klan_access

    if event.recording_access == RecordingAccess.KLAN:
        return has_klan_access(user=user)
    return entitlement(user=user)["full_access"]  # KLUB


def user_registrations(*, user):
    return (
        Registration.objects.filter(user=user)
        .exclude(status=RegStatus.CANCELED)
        .select_related("event", "event__host")
        .order_by("-created_at")
    )
