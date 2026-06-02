from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from events.models import Event, EventMode, EventStatus, Registration, RegStatus

_ACTIVE = [RegStatus.PENDING, RegStatus.CONFIRMED, RegStatus.WAITLISTED]


def _has_space(event):
    if event.capacity is None:
        return True
    confirmed = Registration.objects.filter(event=event, status=RegStatus.CONFIRMED).count()
    return confirmed < event.capacity


@transaction.atomic
def register_for_event(*, user, event):
    event = Event.objects.select_for_update().get(pk=event.pk)
    if event.status != EventStatus.PUBLISHED or event.starts_at <= timezone.now():
        raise ValidationError({"event": "Zapisy zamknięte.", "code": "event_not_open"})
    if event.mode == EventMode.KLAN:
        from membership.selectors import has_klan_access

        if not has_klan_access(user=user):
            raise PermissionDenied({"detail": "Event tylko dla Klanu.", "code": "klan_required"})
    if Registration.objects.filter(event=event, user=user, status__in=_ACTIVE).exists():
        raise ValidationError({"event": "Masz już zapis.", "code": "already_registered"})

    if event.price_pln > 0:
        return _register_paid(user=user, event=event)

    status = RegStatus.CONFIRMED if _has_space(event) else RegStatus.WAITLISTED
    reg = Registration.objects.create(event=event, user=user, status=status)
    return {"status": status, "registration_id": reg.id}


@transaction.atomic
def cancel_registration(*, user, event):
    event = Event.objects.select_for_update().get(pk=event.pk)
    reg = Registration.objects.filter(event=event, user=user, status__in=_ACTIVE).first()
    if reg is None:
        return None
    was_confirmed = reg.status == RegStatus.CONFIRMED
    reg.status = RegStatus.CANCELED
    reg.save(update_fields=["status", "updated_at"])
    if was_confirmed:
        promote = (
            Registration.objects.filter(event=event, status=RegStatus.WAITLISTED)
            .order_by("created_at", "id")
            .first()
        )
        if promote is not None:
            promote.status = RegStatus.CONFIRMED
            promote.save(update_fields=["status", "updated_at"])
    return reg


# ---------------------------------------------------------------------------
# Temporary stub — replaced in Task 5 with real Stripe checkout
# ---------------------------------------------------------------------------


def _register_paid(*, user, event):
    raise ValidationError({"event": "Płatne eventy w Tasku 5."})
