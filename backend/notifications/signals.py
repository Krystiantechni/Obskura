from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import StreamStatus


@receiver(post_save, sender=StreamStatus)
def _broadcast_status(sender, instance, **kwargs):
    from notifications.services import broadcast_stream_status

    broadcast_stream_status(instance)
