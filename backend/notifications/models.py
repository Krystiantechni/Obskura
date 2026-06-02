from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class NotificationKind(models.TextChoices):
    SYSTEM = "system", "Systemowe"
    REPLY = "reply", "Odpowiedź"
    EVENT = "event", "Wydarzenie"
    MEMBERSHIP = "membership", "Subskrypcja"
    PATRONAGE = "patronage", "Patronat"


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="użytkownik",
    )
    kind = models.CharField(max_length=16, choices=NotificationKind.choices, verbose_name="rodzaj")
    title = models.CharField(max_length=160, verbose_name="tytuł")
    body = models.TextField(blank=True, verbose_name="treść")
    url = models.CharField(max_length=300, blank=True, verbose_name="link")
    payload = models.JSONField(default=dict, blank=True, verbose_name="dane")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="przeczytano")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "powiadomienie"
        verbose_name_plural = "powiadomienia"
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self):
        return f"notif u{self.user_id} [{self.kind}] {self.title}"


class StreamStatus(TimeStampedModel):
    """Singleton (pk=1) — status streamu na żywo dla nav 'stream-live'."""

    is_live = models.BooleanField(default=False, verbose_name="na żywo")
    title = models.CharField(max_length=200, blank=True, verbose_name="tytuł streamu")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="start")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "status streamu"
        verbose_name_plural = "status streamu"

    def save(self, *args, **kwargs):
        self.pk = 1
        # Force INSERT on first save; subsequent saves are UPDATE — exclude
        # auto_now_add field (created_at) to avoid NOT NULL violation on the
        # Python object that never fetched it from DB.
        if not kwargs.get("update_fields") and self.__class__.objects.filter(pk=1).exists():
            kwargs["update_fields"] = ["updated_at", "is_live", "title", "started_at"]
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "LIVE" if self.is_live else "offline"
