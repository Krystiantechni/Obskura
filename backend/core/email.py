import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(*, to, subject, html, reply_to=None):
    """Cienki wrapper Resend. No-op (None) gdy brak RESEND_API_KEY (dev/test/CI bez klucza).
    Wszystkie maile aplikacji przechodzą tędy; w testach monkeypatchowane."""
    if not settings.RESEND_API_KEY:
        logger.info("Resend pominięty (brak klucza): to=%s subject=%s", to, subject)
        return None
    import resend  # noqa: PLC0415 — leniwy import (pakiet/klucz mogą być nieobecne)

    resend.api_key = settings.RESEND_API_KEY
    params = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": [to] if isinstance(to, str) else list(to),
        "subject": subject,
        "html": html,
    }
    if reply_to:
        params["reply_to"] = reply_to
    result = resend.Emails.send(params)
    if isinstance(result, dict):
        return result.get("id")
    return getattr(result, "id", None)
