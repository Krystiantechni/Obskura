"""Cienki wrapper na Stripe SDK (tryb testowy).

Wszystkie wywołania Stripe przechodzą tu i tylko tu — reszta domeny
(membership.services) woła te funkcje. W testach są monkeypatchowane, więc
realny klucz nie jest potrzebny w CI. Klucz API wiązany jest leniwie z
settings.STRIPE_SECRET_KEY przy każdym wywołaniu, żeby brak klucza nie psuł
importu modułu ani zbioru testów.

Stripe operuje na groszach (minor unit) — konwersja PLN→grosze (×100) żyje tu,
na styku z SDK; reszta repo trzyma ceny w całych złotych (PositiveIntegerField).

Import Stripe jest leniwy (wewnątrz funkcji), żeby brak zainstalowanego pakietu
nie psuł importu tego modułu ani zestawu testów — testy monkeypatchują poszczególne
funkcje, a nie sam moduł stripe.
"""

from django.conf import settings

# Mnożnik PLN -> minor unit (grosze). Konwersja tylko na styku ze Stripe.
_MINOR_UNIT = 100


def _client():
    """Zwraca moduł stripe z ustawionym kluczem API z settings (leniwie)."""
    import stripe  # noqa: PLC0415 — leniwy import (pakiet może być nieobecny w CI)

    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def create_subscription_checkout(*, user, price_id, trial_days):
    """Checkout Session w trybie subscription (recurring + opcjonalny trial).

    Zwraca obiekt sesji z polami .id i .url. trial_days=0 oznacza brak trialu.
    """
    client = _client()
    subscription_data = {}
    if trial_days:
        subscription_data["trial_period_days"] = trial_days
    return client.checkout.Session.create(
        mode="subscription",
        client_reference_id=str(user.pk),
        customer_email=user.email or None,
        line_items=[{"price": price_id, "quantity": 1}],
        subscription_data=subscription_data,
        metadata={"user_id": str(user.pk)},
    )


def create_payment_checkout(*, user, price_id, amount, metadata):
    """Checkout Session w trybie payment (one-time, patronat).

    Gdy price_id podane — używa go (price utworzone przez sync_stripe_prices);
    w przeciwnym razie buduje inline price_data z amount (PLN -> grosze).
    Zwraca obiekt sesji z polami .id i .url.
    """
    client = _client()
    if price_id:
        line_items = [{"price": price_id, "quantity": 1}]
    else:
        line_items = [
            {
                "price_data": {
                    "currency": "pln",
                    "unit_amount": amount * _MINOR_UNIT,
                    "product_data": {"name": "Patronat OBSKURA"},
                },
                "quantity": 1,
            }
        ]
    return client.checkout.Session.create(
        mode="payment",
        client_reference_id=str(user.pk),
        customer_email=user.email or None,
        line_items=line_items,
        metadata=metadata,
    )


def construct_event(*, payload, sig_header):
    """Weryfikuje podpis webhooka (whsec_) i zwraca zdarzenie Stripe.

    Rzuca stripe.error.SignatureVerificationError przy złym podpisie.
    """
    import stripe  # noqa: PLC0415 — leniwy import

    return stripe.Webhook.construct_event(
        payload=payload,
        sig_header=sig_header,
        secret=settings.STRIPE_WEBHOOK_SECRET,
    )


def cancel_at_period_end(*, stripe_subscription_id):
    """Ustawia cancel_at_period_end=True na subskrypcji Stripe (cancel na końcu okresu)."""
    client = _client()
    client.Subscription.modify(stripe_subscription_id, cancel_at_period_end=True)


def ensure_product_and_price(*, name, unit_amount, currency, recurring):
    """Idempotentnie tworzy Product + Price i zwraca price_id.

    Używane przez management command sync_stripe_prices. unit_amount w całych
    jednostkach (PLN) -> konwersja na grosze tutaj. recurring=None => price
    one-time; recurring={"interval": "month"|"year"} => price recurring.
    """
    client = _client()
    product = client.Product.create(name=name)
    params = {
        "product": product.id,
        "currency": currency.lower(),
        "unit_amount": unit_amount * _MINOR_UNIT,
    }
    if recurring:
        params["recurring"] = recurring
    price = client.Price.create(**params)
    return price.id
