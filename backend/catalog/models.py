from django.db import models

from core.models import TimeStampedModel
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
