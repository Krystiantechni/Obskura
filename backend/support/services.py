from django.conf import settings
from django.db import transaction

from core.tasks import send_email_task
from support.models import Ticket


@transaction.atomic
def create_ticket(*, name, email, category, message):
    ticket = Ticket.objects.create(name=name, email=email, category=category, message=message)
    send_email_task.delay(
        to=email,
        subject="Otrzymaliśmy Twoje zgłoszenie — OBSKURA",
        html=(
            f"<p>Cześć {name},</p>"
            "<p>Dziękujemy za kontakt. Odpiszemy najszybciej, jak się da.</p>"
        ),
    )
    if settings.SUPPORT_NOTIFY_EMAIL:
        send_email_task.delay(
            to=settings.SUPPORT_NOTIFY_EMAIL,
            reply_to=email,
            subject=f"[Support] {category} — {name}",
            html=f"<p>Od: {name} &lt;{email}&gt;</p><p>Kategoria: {category}</p><p>{message}</p>",
        )
    return ticket
