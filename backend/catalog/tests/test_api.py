import pytest
from rest_framework.test import APIClient

from catalog.tests.factories import CreatorFactory, EpisodeFactory, GenreFactory


@pytest.mark.django_db
def test_episodes_list_public_and_paginated():
    EpisodeFactory.create_batch(3)
    res = APIClient().get("/api/v1/catalog/episodes")
    assert res.status_code == 200
    body = res.json()
    assert "results" in body and len(body["results"]) == 3


@pytest.mark.django_db
def test_episode_detail_by_slug_includes_relations():
    ep = EpisodeFactory(slug="mgla-nad", title="Mgła nad")
    ep.creators.set([CreatorFactory()])
    res = APIClient().get("/api/v1/catalog/episodes/mgla-nad")
    assert res.status_code == 200
    body = res.json()
    assert body["slug"] == "mgla-nad"
    assert isinstance(body["genre"], dict)
    assert isinstance(body["creators"], list)


@pytest.mark.django_db
def test_episodes_list_constant_queries(django_assert_max_num_queries):
    g = GenreFactory()
    for _ in range(10):
        EpisodeFactory(genre=g).creators.set([CreatorFactory()])
    # Stała liczba zapytań niezależnie od liczby odcinków (select_related + prefetch).
    # Ciasny próg = realny strażnik N+1 (luźny 6 maskowałby regresję).
    with django_assert_max_num_queries(4):
        APIClient().get("/api/v1/catalog/episodes")


@pytest.mark.django_db
def test_seasons_genres_creators_endpoints():
    EpisodeFactory()
    c = APIClient()
    assert c.get("/api/v1/catalog/seasons").status_code == 200
    assert c.get("/api/v1/catalog/genres").status_code == 200
    assert c.get("/api/v1/catalog/creators").status_code == 200
