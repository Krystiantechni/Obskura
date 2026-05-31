from django.core.cache import cache

from catalog.models import Creator, Episode, Genre, Season

CACHE_TTL = 60 * 15  # 15 min


def episodes_list(*, genre=None, season=None):
    # Tylko opublikowane (published_at != NULL): drafty nie wychodzą publicznie, a cursor
    # pagination po -published_at jest stabilna tylko bez NULL-i.
    qs = (
        Episode.objects.filter(published_at__isnull=False)
        .select_related("season", "genre")
        .prefetch_related("creators")
    )
    if genre:
        qs = qs.filter(genre__slug=genre)
    if season is not None:
        qs = qs.filter(season__number=season)
    return qs


def episode_by_slug(slug):
    return (
        Episode.objects.select_related("season", "genre")
        .prefetch_related("creators", "chapters", "transcript")
        .get(slug=slug)
    )


def genres_list():
    return Genre.objects.all()


def genres_list_cached():
    data = cache.get("catalog:genres")
    if data is None:
        data = list(genres_list())
        cache.set("catalog:genres", data, CACHE_TTL)
    return data


def seasons_list():
    return Season.objects.all()


def seasons_list_cached():
    data = cache.get("catalog:seasons")
    if data is None:
        data = list(seasons_list())
        cache.set("catalog:seasons", data, CACHE_TTL)
    return data


def creators_list(*, role=None):
    qs = Creator.objects.all()
    return qs.filter(role=role) if role else qs
