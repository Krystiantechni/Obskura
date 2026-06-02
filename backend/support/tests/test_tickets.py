import pytest

from support.models import Ticket

URL = "/api/v1/support/tickets"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------


def _post(client, payload):
    return client.post(URL, payload, content_type="application/json")


# ---------------------------------------------------------------------------
# happy-path: 201 + DB row + emails
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_create_ticket_returns_201(client, monkeypatch):
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    resp = _post(
        client,
        {
            "name": "Krystian",
            "email": "user@example.com",
            "category": "tech",
            "message": "Hello, I have a problem.",
        },
    )

    assert resp.status_code == 201
    assert resp.data["detail"] == "Zgloszenie przyjete."


@pytest.mark.django_db
def test_create_ticket_saves_db_row(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    _post(
        client,
        {
            "name": "Krystian",
            "email": "user@example.com",
            "category": "billing",
            "message": "I need help with billing.",
        },
    )

    assert Ticket.objects.count() == 1
    t = Ticket.objects.first()
    assert t.name == "Krystian"
    assert t.email == "user@example.com"
    assert t.category == "billing"
    assert t.status == "open"


@pytest.mark.django_db
def test_create_ticket_sends_ack_to_user(client, monkeypatch):
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    _post(
        client,
        {
            "name": "Ola",
            "email": "ola@example.com",
            "category": "tech",
            "message": "Something is broken here.",
        },
    )

    ack = next((c for c in calls if c["to"] == "ola@example.com"), None)
    assert ack is not None, "ack email to user not sent"
    assert "OBSKURA" in ack["subject"]


@pytest.mark.django_db
def test_create_ticket_sends_notify_when_support_email_set(client, monkeypatch, settings):
    settings.SUPPORT_NOTIFY_EMAIL = "support@obskura.audio"
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    _post(
        client,
        {
            "name": "Jan",
            "email": "jan@example.com",
            "category": "general",
            "message": "This is a test message.",
        },
    )

    notify = next((c for c in calls if c["to"] == "support@obskura.audio"), None)
    assert notify is not None, "notify email not sent to SUPPORT_NOTIFY_EMAIL"
    assert notify.get("reply_to") == "jan@example.com"


@pytest.mark.django_db
def test_create_ticket_no_notify_when_support_email_empty(client, monkeypatch, settings):
    settings.SUPPORT_NOTIFY_EMAIL = ""
    calls = []
    monkeypatch.setattr("core.email.send_email", lambda **kw: calls.append(kw) or "eid")

    _post(
        client,
        {
            "name": "Jan",
            "email": "jan@example.com",
            "category": "general",
            "message": "This is a test message.",
        },
    )

    # Only the ack should be sent (1 call), no notify
    assert len(calls) == 1
    assert calls[0]["to"] == "jan@example.com"


# ---------------------------------------------------------------------------
# validation: 400 errors
# ---------------------------------------------------------------------------


@pytest.mark.django_db
def test_name_too_short_returns_400(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    resp = _post(
        client,
        {
            "name": "K",  # < 2 chars
            "email": "user@example.com",
            "category": "tech",
            "message": "Hello, I have a problem.",
        },
    )

    assert resp.status_code == 400


@pytest.mark.django_db
def test_message_too_short_returns_400(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    resp = _post(
        client,
        {
            "name": "Krystian",
            "email": "user@example.com",
            "category": "tech",
            "message": "Short",  # < 10 chars
        },
    )

    assert resp.status_code == 400


@pytest.mark.django_db
def test_bad_email_returns_400(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    resp = _post(
        client,
        {
            "name": "Krystian",
            "email": "not-an-email",
            "category": "tech",
            "message": "Hello, I have a problem.",
        },
    )

    assert resp.status_code == 400


@pytest.mark.django_db
def test_empty_category_returns_400(client, monkeypatch):
    monkeypatch.setattr("core.email.send_email", lambda **kw: "eid")

    resp = _post(
        client,
        {
            "name": "Krystian",
            "email": "user@example.com",
            "category": "",  # blank
            "message": "Hello, I have a problem.",
        },
    )

    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# throttle scope wired
# ---------------------------------------------------------------------------


def test_ticket_create_view_has_throttle_scope():
    from rest_framework.throttling import ScopedRateThrottle

    from support.views import TicketCreateView

    assert ScopedRateThrottle in TicketCreateView.throttle_classes
    assert TicketCreateView.throttle_scope == "contact"
