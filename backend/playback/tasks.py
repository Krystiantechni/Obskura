from celery import shared_task
from django.db.models import Avg


@shared_task
def recompute_all_ratings():
    """Self-heal: przelicz Episode.rating_avg z ocen (defensywnie wobec driftu)."""
    from catalog.models import Episode
    from playback.models import Rating

    count = 0
    for pk in Episode.all_objects.values_list("pk", flat=True):
        agg = Rating.objects.filter(episode_id=pk).aggregate(avg=Avg("value"))
        Episode.all_objects.filter(pk=pk).update(rating_avg=round(agg["avg"] or 0, 2))
        count += 1
    return count
