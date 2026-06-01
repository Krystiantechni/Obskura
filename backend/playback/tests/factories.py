import factory

from accounts.tests.factories import UserFactory
from catalog.tests.factories import EpisodeFactory
from playback.models import Favorite, Progress, QueueItem, Rating


class ProgressFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Progress

    user = factory.SubFactory(UserFactory)
    episode = factory.SubFactory(EpisodeFactory)
    position_s = 0


class FavoriteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Favorite

    user = factory.SubFactory(UserFactory)
    episode = factory.SubFactory(EpisodeFactory)


class QueueItemFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = QueueItem

    user = factory.SubFactory(UserFactory)
    episode = factory.SubFactory(EpisodeFactory)
    position = 0


class RatingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Rating

    user = factory.SubFactory(UserFactory)
    episode = factory.SubFactory(EpisodeFactory)
    value = 5
