from django.db import models
from django.db.models import Q

from core.models import TimeStampedModel


class LegalKind(models.TextChoices):
    PRYWATNOSC = "prywatnosc", "Polityka prywatności"
    REGULAMIN = "regulamin", "Regulamin"
    COOKIES = "cookies", "Cookies"


class LegalDoc(TimeStampedModel):
    kind = models.CharField(
        max_length=20,
        choices=LegalKind.choices,
        verbose_name="rodzaj",
    )
    version = models.CharField(max_length=30, verbose_name="wersja")
    body = models.TextField(verbose_name="treść")
    published_at = models.DateTimeField(verbose_name="data publikacji")
    is_current = models.BooleanField(default=False, verbose_name="bieżąca")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "dokument prawny"
        verbose_name_plural = "dokumenty prawne"
        constraints = [
            models.UniqueConstraint(
                fields=["kind"],
                condition=Q(is_current=True),
                name="uniq_current_legaldoc_per_kind",
            )
        ]

    def __str__(self):
        return f"{self.kind} v{self.version}"


class PressItem(TimeStampedModel):
    source = models.CharField(max_length=200, verbose_name="źródło")
    quote = models.TextField(verbose_name="cytat")
    author = models.CharField(max_length=200, blank=True, verbose_name="autor")
    url = models.CharField(max_length=500, blank=True, verbose_name="URL")
    order = models.PositiveIntegerField(default=0, verbose_name="kolejność")
    is_active = models.BooleanField(default=True, verbose_name="aktywny")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "wzmianka prasowa"
        verbose_name_plural = "wzmianki prasowe"
        ordering = ["order"]

    def __str__(self):
        return f"{self.source}: {self.quote[:60]}"
