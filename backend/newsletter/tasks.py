from celery import shared_task


@shared_task
def send_campaign_task(campaign_code, freq=None):
    """Bulk: enqueue welcome/campaign email do każdego aktywnego subskrybenta."""
    from core.tasks import send_email_task
    from newsletter.models import Campaign, Subscriber

    campaign = Campaign.objects.filter(code=campaign_code, is_active=True).first()
    if campaign is None:
        return 0
    subs = Subscriber.objects.filter(is_active=True)
    if freq:
        subs = subs.filter(freq=freq)
    count = 0
    for sub in subs.iterator():
        send_email_task.delay(
            to=sub.email,
            subject=campaign.label,
            html=f"<p>{campaign.purpose or campaign.label}</p>",
        )
        count += 1
    return count
