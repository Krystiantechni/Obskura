import pytest
from django.core.cache import cache

from catalog.selectors import genres_list_cached, seasons_list_cached
from catalog.tests.factories import EpisodeFactory, GenreFactory, SeasonFactory


@pytest.mark.django_db
def test_genres_cached_then_invalidated_on_save():
    GenreFactory(slug="psy", name="Psy")
    first = genres_list_cached()
    assert len(first) == 1
    GenreFactory(slug="folk", name="Folk")
    second = genres_list_cached()
    assert len(second) == 2


@pytest.mark.django_db
def test_genres_cache_hit_uses_cache():
    GenreFactory(slug="psy")
    genres_list_cached()
    assert cache.get("catalog:genres") is not None


@pytest.mark.django_db
def test_seasons_cached_then_invalidated_on_save():
    SeasonFactory(number=2)
    assert len(seasons_list_cached()) == 1
    SeasonFactory(number=3)
    assert len(seasons_list_cached()) == 2


@pytest.mark.django_db
def test_episode_save_invalidates_catalog_cache():
    GenreFactory(slug="psy")
    genres_list_cached()  # populate cache
    assert cache.get("catalog:genres") is not None
    EpisodeFactory()  # post_save signal → invalidate catalog:*
    assert cache.get("catalog:genres") is None


@pytest.mark.django_db
def test_genres_endpoint_cached_and_invalidated():
    from rest_framework.test import APIClient

    GenreFactory(slug="psy")
    c = APIClient()
    assert len(c.get("/api/v1/catalog/genres").json()) == 1
    GenreFactory(slug="folk")
    assert len(c.get("/api/v1/catalog/genres").json()) == 2
