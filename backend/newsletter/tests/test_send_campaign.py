"""Task 3 — send_campaign_task tests."""

import pytest

from newsletter.tests.factories import CampaignFactory, SubscriberFactory

# ---------------------------------------------------------------------------
# send_campaign_task
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_send_campaign_task_sends_to_active_subscribers(monkeypatch):
    """3 active + 1 inactive → 3 emails sent."""
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    campaign = CampaignFactory(code="newsletter", is_active=True)
    SubscriberFactory(is_active=True)
    SubscriberFactory(is_active=True)
    SubscriberFactory(is_active=True)
    SubscriberFactory(is_active=False)  # should be skipped

    from newsletter.tasks import send_campaign_task

    count = send_campaign_task.delay("newsletter").get()

    assert count == 3
    assert len(calls) == 3
    for call in calls:
        assert call["subject"] == campaign.label


@pytest.mark.django_db
def test_send_campaign_task_freq_filter(monkeypatch):
    """freq filter narrows recipients."""
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    CampaignFactory(code="weekly", is_active=True)
    SubscriberFactory(is_active=True, freq="week")
    SubscriberFactory(is_active=True, freq="week")
    SubscriberFactory(is_active=True, freq="month")  # different freq — skipped

    from newsletter.tasks import send_campaign_task

    count = send_campaign_task.delay("weekly", freq="week").get()

    assert count == 2
    assert len(calls) == 2


@pytest.mark.django_db
def test_send_campaign_task_unknown_campaign_returns_zero(monkeypatch):
    """Unknown campaign code → 0 emails."""
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    SubscriberFactory(is_active=True)

    from newsletter.tasks import send_campaign_task

    count = send_campaign_task.delay("does-not-exist").get()

    assert count == 0
    assert len(calls) == 0


@pytest.mark.django_db
def test_send_campaign_task_inactive_campaign_returns_zero(monkeypatch):
    """Inactive campaign → 0 emails."""
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    CampaignFactory(code="inactive-campaign", is_active=False)
    SubscriberFactory(is_active=True)

    from newsletter.tasks import send_campaign_task

    count = send_campaign_task.delay("inactive-campaign").get()

    assert count == 0
    assert len(calls) == 0


# ---------------------------------------------------------------------------
# management command
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_send_campaign_command_happy(monkeypatch):
    """Command outputs success message and returns count."""
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    CampaignFactory(code="cmd-campaign", is_active=True)
    SubscriberFactory(is_active=True)

    from io import StringIO

    from django.core.management import call_command

    out = StringIO()
    call_command("send_campaign", "cmd-campaign", stdout=out)
    output = out.getvalue()
    assert "cmd-campaign" in output
    assert "1" in output


@pytest.mark.django_db
def test_send_campaign_command_unknown_raises(monkeypatch):
    """Command raises CommandError when campaign not found (returns 0)."""
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    from django.core.management import call_command
    from django.core.management.base import CommandError

    with pytest.raises(CommandError, match="Brak aktywnej kampanii"):
        call_command("send_campaign", "nonexistent")


# ---------------------------------------------------------------------------
# admin action
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_admin_action_send_to_subscribers(monkeypatch, admin_client):
    """Admin action queues emails for selected campaigns."""
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    CampaignFactory(code="admin-camp", is_active=True)
    SubscriberFactory(is_active=True)
    SubscriberFactory(is_active=True)

    from newsletter.models import Campaign

    campaign = Campaign.objects.get(code="admin-camp")

    resp = admin_client.post(
        "/admin/newsletter/campaign/",
        {
            "action": "send_to_subscribers",
            "_selected_action": [str(campaign.pk)],
        },
    )
    # Admin redirects after action
    assert resp.status_code in (200, 302)
    assert len(calls) == 2
