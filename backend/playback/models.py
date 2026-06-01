from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from catalog.models import Episode
from core.models import TimeStampedModel


class Progress(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="progress"
    )
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="progress")
    position_s = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "episode"], name="uniq_progress_user_episode")
        ]
        indexes = [models.Index(fields=["user", "-updated_at"])]

    def __str__(self):
        return f"progress u{self.user_id}/e{self.episode_id} @{self.position_s}s"


class Favorite(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites"
    )
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="favorited_by")

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "episode"], name="uniq_favorite_user_episode")
        ]

    def __str__(self):
        return f"fav u{self.user_id}/e{self.episode_id}"


class QueueItem(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="queue_items"
    )
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="queued_by")
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["user", "episode"], name="uniq_queue_user_episode")
        ]

    def __str__(self):
        return f"queue u{self.user_id}/e{self.episode_id} #{self.position}"


class Rating(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ratings"
    )
    episode = models.ForeignKey(Episode, on_delete=models.CASCADE, related_name="ratings")
    value = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "episode"], name="uniq_rating_user_episode"),
            models.CheckConstraint(
                condition=models.Q(value__gte=1) & models.Q(value__lte=5),
                name="rating_value_1_5",
            ),
        ]

    def __str__(self):
        return f"rating u{self.user_id}/e{self.episode_id}: {self.value}"
