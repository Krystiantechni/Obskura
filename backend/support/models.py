from django.db import models

from core.models import TimeStampedModel


class FaqCategory(TimeStampedModel):
    name = models.CharField(max_length=200, verbose_name="nazwa")
    slug = models.SlugField(unique=True, verbose_name="slug")
    order = models.PositiveIntegerField(default=0, verbose_name="kolejnosc")
    is_active = models.BooleanField(default=True, verbose_name="aktywna")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "kategoria FAQ"
        verbose_name_plural = "kategorie FAQ"
        ordering = ["order"]

    def __str__(self):
        return self.name


class FaqItem(TimeStampedModel):
    category = models.ForeignKey(
        FaqCategory,
        on_delete=models.PROTECT,
        related_name="items",
        verbose_name="kategoria",
    )
    question = models.CharField(max_length=500, verbose_name="pytanie")
    answer = models.TextField(verbose_name="odpowiedz")
    order = models.PositiveIntegerField(default=0, verbose_name="kolejnosc")
    is_active = models.BooleanField(default=True, verbose_name="aktywny")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "pytanie FAQ"
        verbose_name_plural = "pytania FAQ"
        ordering = ["order"]

    def __str__(self):
        return self.question[:80]
