from django.db import models

from core.models import TimeStampedModel


class TicketStatus(models.TextChoices):
    OPEN = "open", "Otwarte"
    IN_PROGRESS = "in_progress", "W toku"
    RESOLVED = "resolved", "Rozwiazane"
    CLOSED = "closed", "Zamkniete"


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


class Ticket(TimeStampedModel):
    name = models.CharField(max_length=60, verbose_name="imie")
    email = models.EmailField(verbose_name="email")
    category = models.CharField(max_length=40, verbose_name="kategoria")
    message = models.TextField(verbose_name="wiadomosc")
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.OPEN,
        verbose_name="status",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "zgloszenie"
        verbose_name_plural = "zgloszenia"
        indexes = [
            models.Index(fields=["status", "-created_at"], name="ticket_status_created_idx"),
        ]

    def __str__(self):
        return f"#{self.pk} {self.name} [{self.status}]"
