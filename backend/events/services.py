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
            from notifications.models import NotificationKind
            from notifications.services import notify

            notify(
                user=promote.user,
                kind=NotificationKind.EVENT,
                title="Zwolniło się miejsce — masz potwierdzony zapis",
                url=f"/events/{event.slug}",
                payload={"event_slug": event.slug},
            )
    return reg


@transaction.atomic
def _register_paid(*, user, event):
    """Płatny bilet: rezerwacja PENDING + Checkout Session (seat dopiero po webhooku)."""
    if not _has_space(event):
        raise ValidationError({"event": "Brak wolnych miejsc.", "code": "event_full"})
    reg = Registration.objects.create(event=event, user=user, status=RegStatus.PENDING)
    from membership import payments

    session = payments.create_payment_checkout(
        user=user,
        price_id=event.stripe_price_id,
        amount=event.price_pln,
        metadata={"registration_id": str(reg.id)},
    )
    reg.stripe_checkout_session_id = session.id
    reg.save(update_fields=["stripe_checkout_session_id", "updated_at"])
    return {"checkout_url": session.url}


@transaction.atomic
def confirm_paid_registration(*, registration_id, payment_intent=""):
    """Webhook: potwierdzenie opłaconego biletu. Tylko PENDING→CONFIRMED.

    Recheck capacity pod lockiem — nadkomplet (rzadki wyścig) → CANCELED, zwrot
    out-of-band w test mode (jak patronat).
    """
    reg = Registration.objects.select_related("event").filter(pk=registration_id).first()
    if reg is None or reg.status != RegStatus.PENDING:
        return None
    event = Event.objects.select_for_update().get(pk=reg.event_id)
    over_cap = event.capacity is not None and (
        Registration.objects.filter(event=event, status=RegStatus.CONFIRMED).count()
        >= event.capacity
    )
    if over_cap:
        reg.status = RegStatus.CANCELED
        reg.save(update_fields=["status", "updated_at"])
        return reg
    reg.status = RegStatus.CONFIRMED
    fields = ["status", "updated_at"]
    if payment_intent:
        reg.stripe_payment_intent_id = payment_intent
        fields.append("stripe_payment_intent_id")
    reg.save(update_fields=fields)
    return reg
