from django.apps import apps


def test_pages_app_installed():
    assert apps.is_installed("pages"), "pages app must be in INSTALLED_APPS"


def test_pages_urls_importable():
    from pages import urls

    assert hasattr(urls, "urlpatterns")
