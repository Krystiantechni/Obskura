from catalog.models import Creator, Episode, Genre, Season


def episodes_list(*, genre=None, season=None):
    qs = Episode.objects.select_related("season", "genre").prefetch_related("creators")
    if genre:
        qs = qs.filter(genre__slug=genre)
    if season is not None:
        qs = qs.filter(season__number=season)
    return qs


def episode_by_slug(slug):
    return (
        Episode.objects.select_related("season", "genre")
        .prefetch_related("creators")
        .get(slug=slug)
    )


def genres_list():
    return Genre.objects.all()


def seasons_list():
    return Season.objects.all()


def creators_list(*, role=None):
    qs = Creator.objects.all()
    return qs.filter(role=role) if role else qs
