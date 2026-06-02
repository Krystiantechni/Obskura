"""Task 5 - newsletter subscribe/unsubscribe/mailings tests."""

import pytest

from newsletter.models import Subscriber

SUBSCRIBE_URL = "/api/v1/newsletter/subscribe"
UNSUBSCRIBE_URL = "/api/v1/newsletter/unsubscribe"
MAILINGS_URL = "/api/v1/mailings"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _post(client, url, payload):
    return client.post(url, payload, content_type="application/json")


# ---------------------------------------------------------------------------
# subscribe - validation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_subscribe_consent_false_returns_400(client):
    resp = _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "user@example.com",
            "consent": False,
        },
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_subscribe_consent_missing_returns_400(client):
    resp = _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "user@example.com",
        },
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_subscribe_invalid_freq_returns_400(client):
    resp = _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "user@example.com",
            "freq": "hourly",
            "consent": True,
        },
    )
    assert resp.status_code == 400


@pytest.mark.django_db
def test_subscribe_bad_email_returns_400(client):
    resp = _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "not-an-email",
            "consent": True,
        },
    )
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# subscribe - happy path
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_subscribe_happy_returns_201(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    resp = _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "happy@example.com",
            "freq": "week",
            "consent": True,
        },
    )
    assert resp.status_code == 201


@pytest.mark.django_db
def test_subscribe_creates_active_subscriber(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "active@example.com",
            "consent": True,
        },
    )

    sub = Subscriber.objects.get(email="active@example.com")
    assert sub.is_active is True
    assert sub.consent_at is not None


@pytest.mark.django_db
def test_subscribe_sends_welcome_email(client, monkeypatch):
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "welcome@example.com",
            "consent": True,
        },
    )

    assert len(calls) == 1
    assert calls[0]["to"] == "welcome@example.com"
    assert "OBSKUR" in calls[0]["subject"]


@pytest.mark.django_db
def test_subscribe_default_freq_is_week(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    _post(
        client,
        SUBSCRIBE_URL,
        {
            "email": "freq@example.com",
            "consent": True,
        },
    )

    sub = Subscriber.objects.get(email="freq@example.com")
    assert sub.freq == "week"


# ---------------------------------------------------------------------------
# subscribe - duplicate email reactivates
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_subscribe_duplicate_reactivates_and_no_extra_row(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    # First subscribe
    _post(client, SUBSCRIBE_URL, {"email": "dup@example.com", "consent": True})
    assert Subscriber.objects.count() == 1

    # Mark inactive
    Subscriber.objects.filter(email="dup@example.com").update(is_active=False)

    # Subscribe again
    resp = _post(client, SUBSCRIBE_URL, {"email": "dup@example.com", "consent": True})
    assert resp.status_code == 201
    assert Subscriber.objects.count() == 1

    sub = Subscriber.objects.get(email="dup@example.com")
    assert sub.is_active is True


# ---------------------------------------------------------------------------
# unsubscribe
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_unsubscribe_by_token(client):
    from newsletter.tests.factories import SubscriberFactory

    sub = SubscriberFactory(is_active=True)

    resp = _post(client, UNSUBSCRIBE_URL, {"token": sub.unsubscribe_token})
    assert resp.status_code == 200

    sub.refresh_from_db()
    assert sub.is_active is False


@pytest.mark.django_db
def test_unsubscribe_by_email(client):
    from newsletter.tests.factories import SubscriberFactory

    sub = SubscriberFactory(is_active=True)

    resp = _post(client, UNSUBSCRIBE_URL, {"email": sub.email})
    assert resp.status_code == 200

    sub.refresh_from_db()
    assert sub.is_active is False


@pytest.mark.django_db
def test_unsubscribe_unknown_token_returns_404(client):
    resp = _post(client, UNSUBSCRIBE_URL, {"token": "nonexistenttoken1234567890"})
    assert resp.status_code == 404


@pytest.mark.django_db
def test_unsubscribe_unknown_email_returns_404(client):
    resp = _post(client, UNSUBSCRIBE_URL, {"email": "nobody@example.com"})
    assert resp.status_code == 404


@pytest.mark.django_db
def test_unsubscribe_no_token_no_email_returns_400(client):
    resp = _post(client, UNSUBSCRIBE_URL, {})
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# mailings - GET /mailings
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_mailings_lists_active_campaigns(client):
    from newsletter.tests.factories import CampaignFactory

    CampaignFactory(code="active1", is_active=True)
    CampaignFactory(code="active2", is_active=True)
    CampaignFactory(code="inactive", is_active=False)

    resp = client.get(MAILINGS_URL)
    assert resp.status_code == 200
    codes = [c["code"] for c in resp.data]
    assert "active1" in codes
    assert "active2" in codes
    assert "inactive" not in codes


@pytest.mark.django_db
def test_mailings_cached(client):
    from newsletter.tests.factories import CampaignFactory

    CampaignFactory(code="cached", is_active=True)

    # Hit twice - should both return 200
    resp1 = client.get(MAILINGS_URL)
    resp2 = client.get(MAILINGS_URL)
    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp1.data == resp2.data


# ---------------------------------------------------------------------------
# throttle scope wired
# ---------------------------------------------------------------------------


def test_subscribe_view_has_throttle_scope():
    from rest_framework.throttling import ScopedRateThrottle

    from newsletter.views import SubscribeView

    assert ScopedRateThrottle in SubscribeView.throttle_classes
    assert SubscribeView.throttle_scope == "newsletter"


# ---------------------------------------------------------------------------
# seed idempotent
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_seed_newsletter_idempotent():
    from django.core.management import call_command

    call_command("seed_newsletter", verbosity=0)
    from newsletter.models import Campaign

    count_first = Campaign.objects.count()

    call_command("seed_newsletter", verbosity=0)
    count_second = Campaign.objects.count()

    assert count_first == 7
    assert count_second == 7
