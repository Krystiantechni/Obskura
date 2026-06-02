def test_send_email_task_calls_core_email(monkeypatch):
    captured = {}
    monkeypatch.setattr(
        "core.email.send_email",
        lambda **kw: captured.update(kw) or "email_x",
    )
    from core.tasks import send_email_task

    rid = send_email_task.delay(
        to="x@example.com", subject="Temat", html="<p>h</p>", reply_to="r@example.com"
    ).get()
    assert rid == "email_x"
    assert captured["to"] == "x@example.com"
    assert captured["reply_to"] == "r@example.com"
