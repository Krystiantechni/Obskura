from django.apps import apps


def test_newsletter_app_installed():
    assert apps.is_installed("newsletter"), "newsletter app must be in INSTALLED_APPS"


def test_newsletter_urls_importable():
    from newsletter import urls

    assert hasattr(urls, "urlpatterns")
