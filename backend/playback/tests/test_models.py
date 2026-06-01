import pytest
from django.db import IntegrityError

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from playback.models import Favorite, Progress, QueueItem, Rating


@pytest.mark.django_db
def test_progress_unique_user_episode():
    u, e = UserFactory(), EpisodeFactory()
    Progress.objects.create(user=u, episode=e, position_s=10)
    with pytest.raises(IntegrityError):
        Progress.objects.create(user=u, episode=e, position_s=20)


@pytest.mark.django_db
def test_favorite_unique_user_episode():
    u, e = UserFactory(), EpisodeFactory()
    Favorite.objects.create(user=u, episode=e)
    with pytest.raises(IntegrityError):
        Favorite.objects.create(user=u, episode=e)


@pytest.mark.django_db
def test_queue_unique_user_episode():
    u, e = UserFactory(), EpisodeFactory()
    QueueItem.objects.create(user=u, episode=e, position=0)
    with pytest.raises(IntegrityError):
        QueueItem.objects.create(user=u, episode=e, position=1)


@pytest.mark.django_db
def test_rating_unique_user_episode():
    u, e = UserFactory(), EpisodeFactory()
    Rating.objects.create(user=u, episode=e, value=3)
    with pytest.raises(IntegrityError):
        Rating.objects.create(user=u, episode=e, value=4)


@pytest.mark.django_db
def test_favorite_and_queue_and_rating_create():
    u, e = UserFactory(), EpisodeFactory()
    assert Favorite.objects.create(user=u, episode=e).pk
    assert QueueItem.objects.create(user=u, episode=e, position=0).pk
    r = Rating.objects.create(user=u, episode=e, value=5)
    assert r.value == 5


@pytest.mark.django_db
def test_rating_value_bounds():
    u, e = UserFactory(), EpisodeFactory()
    r = Rating(user=u, episode=e, value=9)
    with pytest.raises(Exception):  # noqa: B017  # validators: either ValidationError or DB error
        r.full_clean()
