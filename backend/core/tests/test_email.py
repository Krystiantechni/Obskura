from core import email


def test_send_email_noop_without_key(settings, monkeypatch):
    settings.RESEND_API_KEY = ""
    # brak klucza -> None, bez importu/wywołania resend
    assert email.send_email(to="x@example.com", subject="s", html="<p>h</p>") is None


def test_send_email_uses_resend_with_key(settings, monkeypatch):
    settings.RESEND_API_KEY = "re_test"
    settings.DEFAULT_FROM_EMAIL = "OBSKURA <noreply@obskura.audio>"
    sent = {}

    class _FakeEmails:
        @staticmethod
        def send(params):
            sent.update(params)
            return {"id": "email_1"}

    import sys
    import types

    fake = types.ModuleType("resend")
    fake.Emails = _FakeEmails
    fake.api_key = None
    monkeypatch.setitem(sys.modules, "resend", fake)

    rid = email.send_email(
        to="x@example.com", subject="Temat", html="<p>h</p>", reply_to="r@example.com"
    )
    assert rid == "email_1"
    assert sent["to"] == ["x@example.com"]
    assert sent["reply_to"] == "r@example.com"
    assert sent["from"] == "OBSKURA <noreply@obskura.audio>"
