"""sync_stripe_prices: no-op bez klucza + poprawne unit_amount (całe PLN) i recurring (dict)."""

import pytest
from django.core.management import call_command

from membership.models import PatronCode, PlanCode
from membership.tests.factories import PatronTierFactory, PlanFactory


@pytest.mark.django_db
def test_sync_stripe_prices_noop_without_key(settings, monkeypatch):
    settings.STRIPE_SECRET_KEY = ""
    calls = []
    monkeypatch.setattr(
        "membership.payments.ensure_product_and_price",
        lambda **kwargs: calls.append(kwargs) or "price_x",
    )
    PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24)

    call_command("sync_stripe_prices")

    assert calls == []  # brak klucza => zero wywołań Stripe


@pytest.mark.django_db
def test_sync_stripe_prices_passes_whole_pln_and_interval_dict(settings, monkeypatch):
    settings.STRIPE_SECRET_KEY = "sk_test_dummy"
    calls = []

    def _fake(**kwargs):
        calls.append(kwargs)
        return f"price_{len(calls)}"

    monkeypatch.setattr("membership.payments.ensure_product_and_price", _fake)

    solo = PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24, currency="PLN")
    tier = PatronTierFactory(code=PatronCode.EXEC, amount=2400, currency="PLN")

    call_command("sync_stripe_prices")

    by_name = {c["name"]: c for c in calls}
    month = next(c for c in calls if c["recurring"] == {"interval": "month"})
    year = next(c for c in calls if c["recurring"] == {"interval": "year"})
    one_time = next(c for c in calls if c["recurring"] is None)

    # Całe PLN — NIE grosze (payments.ensure_product_and_price sam mnoży ×100).
    assert month["unit_amount"] == 29
    assert year["unit_amount"] == 24 * 12  # 288 — total roczny w PLN
    assert one_time["unit_amount"] == 2400
    assert month["currency"] == "pln"
    assert len(by_name) == 3  # solo month + solo year + exec one-time

    # Ids zapisane na modelach.
    solo.refresh_from_db()
    tier.refresh_from_db()
    assert solo.stripe_price_id_month and solo.stripe_price_id_year
    assert tier.stripe_price_id


@pytest.mark.django_db
def test_sync_stripe_prices_idempotent_second_run_no_calls(settings, monkeypatch):
    settings.STRIPE_SECRET_KEY = "sk_test_dummy"
    calls = []
    monkeypatch.setattr(
        "membership.payments.ensure_product_and_price",
        lambda **kwargs: calls.append(kwargs) or f"price_{len(calls)}",
    )
    PlanFactory(code=PlanCode.SOLO, price_month=29, price_year=24, currency="PLN")
    PatronTierFactory(code=PatronCode.EXEC, amount=2400, currency="PLN")

    call_command("sync_stripe_prices")
    first = len(calls)
    assert first == 3  # solo month + year + exec one-time

    call_command("sync_stripe_prices")  # już zsynchronizowane -> 0 nowych wywołań
    assert len(calls) == first
