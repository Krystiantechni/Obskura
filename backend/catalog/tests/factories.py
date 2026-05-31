from datetime import UTC

import factory

from catalog.models import Creator, Episode, Genre, Season


class GenreFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Genre
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Genre {n}")
    slug = factory.Sequence(lambda n: f"genre-{n}")
    accent = Genre.Accent.RED


class SeasonFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Season
        django_get_or_create = ("number",)

    number = factory.Sequence(lambda n: n + 1)
    title = factory.LazyAttribute(lambda o: f"Sezon {o.number:02d}")
    slug = factory.LazyAttribute(lambda o: f"sezon-{o.number:02d}")


class CreatorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Creator
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Creator {n}")
    slug = factory.Sequence(lambda n: f"creator-{n}")
    role = Creator.Role.NARRATOR


class EpisodeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Episode
        skip_postgeneration_save = True

    season = factory.SubFactory(SeasonFactory)
    genre = factory.SubFactory(GenreFactory)
    number = factory.Sequence(lambda n: n + 1)
    title = factory.Sequence(lambda n: f"Odcinek {n}")
    slug = factory.Sequence(lambda n: f"odcinek-{n}")
    duration_s = 2820
    published_at = factory.Faker("date_time_this_decade", tzinfo=UTC)

    @factory.post_generation
    def creators(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            self.creators.set(extracted)
        else:
            self.creators.add(CreatorFactory())
