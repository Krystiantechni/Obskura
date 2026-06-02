from celery import shared_task


@shared_task
def send_email_task(to, subject, html, reply_to=None):
    """Async wrapper na core.email.send_email (fire-and-forget; treść w argumentach)."""
    from core.email import send_email

    return send_email(to=to, subject=subject, html=html, reply_to=reply_to)
