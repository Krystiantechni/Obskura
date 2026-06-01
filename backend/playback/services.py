from django.db import transaction
from django.db.models import F

from catalog.models import Episode
from playback.models import Progress


@transaction.atomic
def upsert_progress(*, user, episode, position_s, completed=False):
    progress, created = Progress.objects.update_or_create(
        user=user,
        episode=episode,
        defaults={"position_s": position_s, "completed": completed},
    )
    if created:
        Episode.all_objects.filter(pk=episode.pk).update(plays_count=F("plays_count") + 1)
    return progress, created
