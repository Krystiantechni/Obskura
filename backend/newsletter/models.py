import secrets

from django.db import models

from core.models import TimeStampedModel


class Freq(models.TextChoices):
    WEEK = "week", "Tygodniowo"
    BIG = "big", "Co dwa tygodnie"
    MONTH = "month", "Miesiecznie"


class CampaignTag(models.TextChoices):
    TRANSACTIONAL = "transactional", "Transakcyjny"
    MARKETING = "marketing", "Marketingowy"
    NOTIFICATION = "notification", "Powiadomienie"
    CRITICAL = "critical", "Krytyczny"


class Subscriber(TimeStampedModel):
    email = models.EmailField(unique=True, verbose_name="email")
    freq = models.CharField(
        max_length=10,
        choices=Freq.choices,
        default=Freq.WEEK,
        verbose_name="czestotliwosc",
    )
    consent_at = models.DateTimeField(null=True, blank=True, verbose_name="zgoda")
    is_active = models.BooleanField(default=True, verbose_name="aktywny")
    unsubscribe_token = models.CharField(
        max_length=64,
        unique=True,
        blank=True,
        verbose_name="token wypisania",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "subskrybent"
        verbose_name_plural = "subskrybenci"

    def save(self, *args, **kwargs):
        if not self.unsubscribe_token:
            self.unsubscribe_token = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Campaign(TimeStampedModel):
    code = models.CharField(max_length=60, unique=True, verbose_name="kod")
    label = models.CharField(max_length=200, verbose_name="etykieta")
    purpose = models.CharField(max_length=200, blank=True, verbose_name="cel")
    freq_label = models.CharField(max_length=100, blank=True, verbose_name="czestotliwosc")
    tag = models.CharField(
        max_length=20,
        choices=CampaignTag.choices,
        verbose_name="tag",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="kolejnosc")
    is_active = models.BooleanField(default=True, verbose_name="aktywna")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "kampania"
        verbose_name_plural = "kampanie"
        ordering = ["order"]

    def __str__(self):
        return f"{self.code} — {self.label}"
