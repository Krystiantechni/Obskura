from django.apps import apps


def test_support_app_installed():
    assert apps.is_installed("support"), "support app must be in INSTALLED_APPS"


def test_support_urls_importable():
    from support import urls

    assert hasattr(urls, "urlpatterns")
