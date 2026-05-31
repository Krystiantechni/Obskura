from decimal import Decimal

from django.db import models

from core.models import SoftDeleteModel, TimeStampedModel
from core.text import pl_slugify


class Genre(TimeStampedModel):
    class Accent(models.TextChoices):
        RED = "red", "Czerwony"
        BLUE = "blue", "Niebieski"
        NONE = "none", "Brak"

    name = models.CharField(max_length=80)
    slug = models.SlugField(max_length=90, unique=True)
    accent = models.CharField(max_length=4, choices=Accent.choices, default=Accent.NONE)

    class Meta(TimeStampedModel.Meta):
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = pl_slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Season(TimeStampedModel):
    number = models.PositiveSmallIntegerField(unique=True)
    title = models.CharField(max_length=120)
    slug = models.SlugField(max_length=130, unique=True)
    cover = models.CharField(max_length=300, blank=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta(TimeStampedModel.Meta):
        ordering = ["-number"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = pl_slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Creator(TimeStampedModel):
    class Role(models.TextChoices):
        NARRATOR = "narrator", "Narrator"
        DIRECTOR = "director", "Reżyseria"
        SOUND = "sound", "Dźwięk"
        WRITER = "writer", "Scenariusz"

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=130, unique=True)
    role = models.CharField(
        max_length=10, choices=Role.choices, default=Role.NARRATOR, db_index=True
    )
    bio = models.TextField(blank=True)
    avatar = models.CharField(max_length=300, blank=True)

    class Meta(TimeStampedModel.Meta):
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = pl_slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Episode(TimeStampedModel, SoftDeleteModel):
    class Kind(models.TextChoices):
        FICTION = "fiction", "Fikcja"
        INSPIRED = "inspired", "Oparte na faktach"
        DOC = "doc", "Dokument"

    season = models.ForeignKey(Season, on_delete=models.PROTECT, related_name="episodes")
    genre = models.ForeignKey(Genre, on_delete=models.PROTECT, related_name="episodes")
    creators = models.ManyToManyField(Creator, related_name="episodes", blank=True)

    number = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    title_em = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(max_length=220, unique=True)

    duration_s = models.PositiveIntegerField(default=0)
    audio_url = models.CharField(max_length=400, blank=True)
    poster = models.CharField(max_length=400, blank=True)
    video_preview = models.CharField(max_length=400, blank=True)

    rating_avg = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal("0.00"))
    plays_count = models.PositiveIntegerField(default=0)

    is_true_horror = models.BooleanField(default=False)
    kind = models.CharField(max_length=10, choices=Kind.choices, default=Kind.FICTION)
    premium = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ["-published_at", "-number"]
        # WYMAGANE dla każdego konkretnego SoftDeleteModel z własną Meta: Django NIE
        # propaguje base_manager_name przez Meta abstrakcyjnego rodzica. Bez tego
        # _base_manager = SoftDeleteManager (filtruje) → cascade/FK gubi usunięte wiersze.
        base_manager_name = "all_objects"
        indexes = [
            models.Index(fields=["genre", "published_at"]),
            models.Index(fields=["premium", "published_at"]),
            models.Index(fields=["season", "number"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["season", "number"], name="uniq_episode_season_number"),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = pl_slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        # Dotyka self.season — wołający listę powinien select_related("season") (N+1).
        return f"S{self.season.number:02d}E{self.number:02d} {self.title}"
