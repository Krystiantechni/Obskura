from django.db import transaction
from django.db.models import F

from catalog.models import Episode
from playback.models import Progress, Rating


@transaction.atomic
def upsert_progress(*, user, episode, position_s, completed=False):
    from membership.services import register_play

    register_play(user=user, episode=episode)
    progress, created = Progress.objects.update_or_create(
        user=user,
        episode=episode,
        defaults={"position_s": position_s, "completed": completed},
    )
    if created:
        Episode.all_objects.filter(pk=episode.pk).update(plays_count=F("plays_count") + 1)
    return progress, created


@transaction.atomic
def set_rating(*, user, episode, value):
    rating, _ = Rating.objects.update_or_create(
        user=user, episode=episode, defaults={"value": value}
    )
    return rating
