import pytest

from catalog.selectors import episode_by_slug, episodes_list
from catalog.tests.factories import CreatorFactory, EpisodeFactory, GenreFactory


@pytest.mark.django_db
def test_episodes_list_no_nplus1(django_assert_num_queries):
    g = GenreFactory()
    for _ in range(5):
        ep = EpisodeFactory(genre=g)
        ep.creators.set([CreatorFactory(), CreatorFactory()])
    qs = episodes_list()
    # 1 query for episodes+season+genre (select_related) + 1 for prefetch creators = 2
    # total is always 2 regardless of row count
    with django_assert_num_queries(2):
        data = [(e.season.number, e.genre.name, list(e.creators.all())) for e in qs]
    assert len(data) == 5


@pytest.mark.django_db
def test_episode_by_slug_no_nplus1(django_assert_num_queries):
    ep = EpisodeFactory()
    ep.creators.set([CreatorFactory(), CreatorFactory()])
    # 1 query (episode + select_related season/genre) + 1 (prefetch creators) = 2
    with django_assert_num_queries(2):
        result = episode_by_slug(ep.slug)
        _ = (result.season.number, result.genre.name, list(result.creators.all()))


@pytest.mark.django_db
def test_episodes_list_filter_by_genre():
    g1 = GenreFactory(slug="psy")
    g2 = GenreFactory(slug="folk")
    EpisodeFactory(genre=g1)
    EpisodeFactory(genre=g2)
    assert episodes_list(genre="psy").count() == 1
