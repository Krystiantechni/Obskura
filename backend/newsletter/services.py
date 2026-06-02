from django.db import transaction
from django.utils import timezone

from newsletter.models import Subscriber


@transaction.atomic
def subscribe(*, email, freq, consent):  # noqa: ARG001 — consent verified in serializer
    sub, _created = Subscriber.objects.update_or_create(
        email=email,
        defaults={"freq": freq, "consent_at": timezone.now(), "is_active": True},
    )
    from core.email import send_email

    send_email(
        to=email,
        subject="Witaj w newsletterze OBSKURY",
        html="<p>Zapis potwierdzony. Do usłyszenia w ciemności.</p>",
    )
    return sub


@transaction.atomic
def unsubscribe(*, token=None, email=None):
    sub = None
    if token:
        sub = Subscriber.objects.filter(unsubscribe_token=token).first()
    elif email:
        sub = Subscriber.objects.filter(email=email).first()
    if sub is None:
        return False
    if sub.is_active:
        sub.is_active = False
        sub.save(update_fields=["is_active", "updated_at"])
    return True
