import pytest
from rest_framework.test import APIClient

from catalog.tests.factories import EpisodeFactory, GenreFactory, SeasonFactory


@pytest.mark.django_db
def test_filter_by_genre_and_season():
    psy = GenreFactory(slug="psy")
    folk = GenreFactory(slug="folk")
    s2 = SeasonFactory(number=2)
    s3 = SeasonFactory(number=3)
    EpisodeFactory(genre=psy, season=s2)
    EpisodeFactory(genre=folk, season=s3)
    c = APIClient()
    assert len(c.get("/api/v1/catalog/episodes?genre=psy").json()["results"]) == 1
    assert len(c.get("/api/v1/catalog/episodes?season=2").json()["results"]) == 1


@pytest.mark.django_db
def test_search_by_title():
    EpisodeFactory(title="Mgła nad Wisłoujściem", slug="mgla")
    EpisodeFactory(title="Cisza na Mokotowie", slug="cisza")
    res = APIClient().get("/api/v1/catalog/episodes?search=Mgła")
    assert len(res.json()["results"]) == 1


@pytest.mark.django_db
def test_filter_by_kind_premium_true_horror():
    EpisodeFactory(slug="doc-ep", kind="doc", premium=True, is_true_horror=True)
    EpisodeFactory(slug="fic-ep", kind="fiction", premium=False, is_true_horror=False)
    c = APIClient()
    assert len(c.get("/api/v1/catalog/episodes?kind=doc").json()["results"]) == 1
    assert len(c.get("/api/v1/catalog/episodes?premium=true").json()["results"]) == 1
    assert len(c.get("/api/v1/catalog/episodes?is_true_horror=true").json()["results"]) == 1
