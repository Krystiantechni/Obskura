from django.conf import settings
from django.db import models
from django.db.models import Q

from core.models import SoftDeleteModel, TimeStampedModel
from core.text import pl_slugify


class EventMode(models.TextChoices):
    ONLINE = "online", "Online"
    LIVE = "live", "Live"
    KLAN = "klan", "Klan"


class EventStatus(models.TextChoices):
    DRAFT = "draft", "Szkic"
    PUBLISHED = "published", "Opublikowany"
    CANCELED = "canceled", "Odwołany"


class RegStatus(models.TextChoices):
    PENDING = "pending", "Oczekuje na płatność"
    CONFIRMED = "confirmed", "Potwierdzony"
    WAITLISTED = "waitlisted", "Lista rezerwowa"
    CANCELED = "canceled", "Anulowany"


class RecordingAccess(models.TextChoices):
    NONE = "none", "Publiczne"
    KLUB = "klub", "Klub"
    KLAN = "klan", "Klan"


class Event(TimeStampedModel, SoftDeleteModel):
    title = models.CharField(max_length=200, verbose_name="tytuł")
    slug = models.SlugField(max_length=220, unique=True, verbose_name="slug")
    mode = models.CharField(
        max_length=10,
        choices=EventMode.choices,
        default=EventMode.ONLINE,
        verbose_name="tryb",
    )
    description = models.TextField(blank=True, verbose_name="opis")
    starts_at = models.DateTimeField(db_index=True, verbose_name="start")
    duration_minutes = models.PositiveIntegerField(default=0, verbose_name="czas trwania (min)")
    host = models.ForeignKey(
        "catalog.Creator",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hosted_events",
        verbose_name="prowadzący",
    )
    cover_image = models.CharField(max_length=400, blank=True, verbose_name="okładka")
    capacity = models.PositiveIntegerField(null=True, blank=True, verbose_name="pojemność")
    seats_taken = models.PositiveIntegerField(default=0, verbose_name="zajęte miejsca")
    price_pln = models.PositiveIntegerField(default=0, verbose_name="cena (PLN)")
    is_free = models.BooleanField(default=True, verbose_name="darmowy")
    status = models.CharField(
        max_length=10,
        choices=EventStatus.choices,
        default=EventStatus.PUBLISHED,
        verbose_name="status",
    )
    is_featured = models.BooleanField(default=False, verbose_name="wyróżniony")
    recording_url = models.CharField(max_length=500, blank=True, verbose_name="URL nagrania")
    recording_access = models.CharField(
        max_length=5,
        choices=RecordingAccess.choices,
        default=RecordingAccess.NONE,
        verbose_name="dostęp do nagrania",
    )
    stripe_price_id = models.CharField(max_length=120, blank=True, verbose_name="Stripe price ID")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "wydarzenie"
        verbose_name_plural = "wydarzenia"
        base_manager_name = "all_objects"
        indexes = [
            models.Index(fields=["starts_at"]),
            models.Index(fields=["mode", "starts_at"]),
            models.Index(fields=["status", "starts_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = pl_slugify(self.title)
            slug = base_slug
            n = 1
            qs = Event.all_objects.exclude(pk=self.pk)
            while qs.filter(slug=slug).exists():
                slug = f"{base_slug}-{n}"
                n += 1
            self.slug = slug
        self.is_free = self.price_pln == 0
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Registration(TimeStampedModel):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="registrations",
        verbose_name="wydarzenie",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_registrations",
        verbose_name="użytkownik",
    )
    status = models.CharField(
        max_length=10,
        choices=RegStatus.choices,
        default=RegStatus.CONFIRMED,
        verbose_name="status",
    )
    stripe_checkout_session_id = models.CharField(
        max_length=200, blank=True, verbose_name="Stripe checkout session ID"
    )
    stripe_payment_intent_id = models.CharField(
        max_length=200, blank=True, verbose_name="Stripe payment intent ID"
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "rejestracja"
        verbose_name_plural = "rejestracje"
        constraints = [
            models.UniqueConstraint(
                fields=["event", "user"],
                condition=Q(status__in=["pending", "confirmed", "waitlisted"]),
                name="uniq_active_registration_event_user",
            )
        ]
        indexes = [
            models.Index(fields=["event", "status"]),
        ]

    def __str__(self):
        return f"{self.user} → {self.event} ({self.status})"
