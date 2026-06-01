from django.apps import apps

from events import urls
from events.apps import EventsConfig


def test_events_app_installed():
    assert apps.is_installed("events")
    assert isinstance(apps.get_app_config("events"), EventsConfig)


def test_urls_is_list():
    assert isinstance(urls.urlpatterns, list)
