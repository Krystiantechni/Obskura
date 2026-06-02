import pytest

from catalog.models import Episode
from catalog.tests.factories import EpisodeFactory
from playback.tests.factories import RatingFactory


@pytest.mark.django_db
class TestRecomputeAllRatings:
    def test_episode_with_ratings_gets_correct_avg(self):
        ep = EpisodeFactory(rating_avg=0)
        RatingFactory(episode=ep, value=4)
        RatingFactory(episode=ep, value=2)

        from playback.tasks import recompute_all_ratings

        recompute_all_ratings.delay().get()
        ep.refresh_from_db()
        assert float(ep.rating_avg) == 3.0

    def test_corrupted_rating_avg_is_healed(self):
        ep = EpisodeFactory(rating_avg=0)
        RatingFactory(episode=ep, value=5)
        # Manually corrupt the avg
        Episode.all_objects.filter(pk=ep.pk).update(rating_avg=0)
        ep.refresh_from_db()
        assert float(ep.rating_avg) == 0.0

        from playback.tasks import recompute_all_ratings

        recompute_all_ratings.delay().get()
        ep.refresh_from_db()
        assert float(ep.rating_avg) == 5.0

    def test_episode_with_no_ratings_gets_zero(self):
        ep = EpisodeFactory(rating_avg=3)
        # Manually set a non-zero avg with no ratings
        Episode.all_objects.filter(pk=ep.pk).update(rating_avg=3)

        from playback.tasks import recompute_all_ratings

        recompute_all_ratings.delay().get()
        ep.refresh_from_db()
        assert float(ep.rating_avg) == 0.0
