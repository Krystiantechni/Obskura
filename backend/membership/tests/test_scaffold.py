from django.apps import apps


def test_app_installed():
    """membership is registered with the expected AppConfig and label."""
    config = apps.get_app_config("membership")
    assert config.name == "membership"
    assert type(config).__name__ == "MembershipConfig"


def test_urls_module_importable():
    """membership.urls exposes a urlpatterns list (wired into obskura.urls)."""
    from membership import urls

    assert isinstance(urls.urlpatterns, list)


def test_stripe_settings_present():
    """STRIPE_* settings exist (env-based, default empty in CI)."""
    from django.conf import settings

    assert hasattr(settings, "STRIPE_SECRET_KEY")
    assert hasattr(settings, "STRIPE_WEBHOOK_SECRET")
    assert hasattr(settings, "STRIPE_PUBLISHABLE_KEY")


def test_payments_importable():
    """payments.py wrapper exposes every CONTRACT function; no Stripe call made."""
    from membership import payments

    for fn in (
        "create_subscription_checkout",
        "create_payment_checkout",
        "construct_event",
        "cancel_at_period_end",
        "ensure_product_and_price",
    ):
        assert callable(getattr(payments, fn)), f"missing payments.{fn}"
