from django.db.models import Avg
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from playback.models import Rating


@receiver([post_save, post_delete], sender=Rating)
def recalc_episode_rating_avg(sender, instance, **kwargs):
    from catalog.models import Episode

    agg = Rating.objects.filter(episode=instance.episode).aggregate(avg=Avg("value"))
    Episode.all_objects.filter(pk=instance.episode_id).update(rating_avg=round(agg["avg"] or 0, 2))
