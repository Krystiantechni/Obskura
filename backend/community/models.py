from django.conf import settings
from django.db import models
from django.utils import timezone

from catalog.models import (
    Episode,  # noqa: F401  (FK referenced by string; import documents the dep)
)
from core.models import SoftDeleteModel, TimeStampedModel
from core.text import pl_slugify


class PostStatus(models.TextChoices):
    PUBLISHED = "published", "Opublikowany"
    PENDING = "pending", "Oczekuje na moderację"
    FLAGGED = "flagged", "Zgłoszony"
    REMOVED = "removed", "Usunięty"


class ReactionKind(models.TextChoices):
    LIKE = "like", "Lubię to"
    SPOOKY = "spooky", "Ciarki"
    SCARED = "scared", "Przerażenie"
    LOVE = "love", "Uwielbiam"


class ReportReason(models.TextChoices):
    SPAM = "spam", "Spam"
    OFFENSIVE = "offensive", "Treść obraźliwa"
    SPOILER = "spoiler", "Spoiler"
    OFFTOPIC = "offtopic", "Nie na temat"
    OTHER = "other", "Inne"


class ReportStatus(models.TextChoices):
    OPEN = "open", "Otwarte"
    RESOLVED = "resolved", "Rozwiązane"
    DISMISSED = "dismissed", "Odrzucone"


class ModAction(models.TextChoices):
    APPROVE = "approve", "Zatwierdź"
    REJECT = "reject", "Odrzuć"
    REMOVE = "remove", "Usuń"
    RESTORE = "restore", "Przywróć"
    PIN = "pin", "Przypnij"
    UNPIN = "unpin", "Odepnij"
    LOCK = "lock", "Zablokuj"
    UNLOCK = "unlock", "Odblokuj"
    FLAG = "flag", "Oznacz"


class Category(TimeStampedModel):
    """Sekcja forum (admin-managed, cache'owana)."""

    name = models.CharField(max_length=80, verbose_name="nazwa")
    slug = models.SlugField(max_length=90, unique=True, verbose_name="slug")
    description = models.TextField(blank=True, verbose_name="opis")
    icon = models.CharField(
        max_length=40,
        blank=True,
        verbose_name="ikona",
        help_text='Klucz ikony lucide (np. "MessageSquare").',
    )
    is_moderated = models.BooleanField(
        default=False,
        verbose_name="moderowana",
        help_text="True → nowe wątki/posty trafiają do kolejki (pending) przed publikacją.",
    )
    order = models.PositiveIntegerField(default=0, verbose_name="kolejność")
    is_active = models.BooleanField(default=True, verbose_name="aktywna")
    threads_count = models.PositiveIntegerField(default=0, verbose_name="liczba wątków")

    class Meta(TimeStampedModel.Meta):
        ordering = ["order"]
        verbose_name = "kategoria"
        verbose_name_plural = "kategorie"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = pl_slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Thread(TimeStampedModel, SoftDeleteModel):
    """Wątek dyskusji w kategorii, opcjonalnie powiązany z odcinkiem."""

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="threads",
        db_index=True,
        verbose_name="kategoria",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="threads",
        verbose_name="autor",
    )
    title = models.CharField(max_length=200, verbose_name="tytuł")
    slug = models.SlugField(max_length=220, unique=True, verbose_name="slug")
    episode = models.ForeignKey(
        "catalog.Episode",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="threads",
        verbose_name="odcinek",
    )
    is_pinned = models.BooleanField(default=False, db_index=True, verbose_name="przypięty")
    is_locked = models.BooleanField(default=False, verbose_name="zablokowany")
    last_post_at = models.DateTimeField(
        default=timezone.now, db_index=True, verbose_name="ostatni post"
    )
    posts_count = models.PositiveIntegerField(default=0, verbose_name="liczba odpowiedzi")
    views_count = models.PositiveIntegerField(default=0, verbose_name="liczba wyświetleń")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "wątek"
        verbose_name_plural = "wątki"
        # WYMAGANE dla każdego konkretnego SoftDeleteModel z własną Meta: Django NIE
        # propaguje base_manager_name przez Meta abstrakcyjnego rodzica. Bez tego
        # _base_manager = SoftDeleteManager (filtruje) → cascade/FK gubi usunięte wiersze.
        base_manager_name = "all_objects"
        indexes = [
            models.Index(fields=["category", "-last_post_at"]),
            models.Index(fields=["-is_pinned", "-last_post_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = pl_slugify(self.title)
            slug = base
            n = 1
            # Kolizja sprawdzana na all_objects — soft-deleted wątek wciąż rezerwuje slug.
            while Thread.all_objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Post(TimeStampedModel, SoftDeleteModel):
    """Pojedynczy post w wątku (pierwszy = is_first)."""

    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="posts",
        db_index=True,
        verbose_name="wątek",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="posts",
        verbose_name="autor",
    )
    body = models.TextField(verbose_name="treść")
    is_first = models.BooleanField(default=False, verbose_name="post otwierający")
    status = models.CharField(
        max_length=10,
        choices=PostStatus.choices,
        default=PostStatus.PUBLISHED,
        verbose_name="status",
    )
    reaction_count = models.PositiveIntegerField(default=0, verbose_name="liczba reakcji")
    reactions_breakdown = models.JSONField(
        default=dict,
        verbose_name="rozkład reakcji",
        help_text="Denormalizacja przez signal: {kind: liczba}.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "post"
        verbose_name_plural = "posty"
        base_manager_name = "all_objects"
        indexes = [
            models.Index(fields=["thread", "created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"post u{self.author_id}/t{self.thread_id} [{self.status}]"


class Reaction(TimeStampedModel):
    """Reakcja usera na post (unikalna per post+user+kind)."""

    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="reactions", verbose_name="post"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reactions",
        verbose_name="użytkownik",
    )
    kind = models.CharField(max_length=10, choices=ReactionKind.choices, verbose_name="rodzaj")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "reakcja"
        verbose_name_plural = "reakcje"
        constraints = [
            models.UniqueConstraint(
                fields=["post", "user", "kind"], name="uniq_reaction_post_user_kind"
            )
        ]
        indexes = [models.Index(fields=["post"])]

    def __str__(self):
        return f"reaction u{self.user_id}/p{self.post_id} {self.kind}"


class Report(TimeStampedModel):
    """Zgłoszenie posta przez usera (unikalne per reporter+post)."""

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports_made",
        verbose_name="zgłaszający",
    )
    post = models.ForeignKey(
        Post, on_delete=models.CASCADE, related_name="reports", verbose_name="post"
    )
    reason = models.CharField(max_length=10, choices=ReportReason.choices, verbose_name="powód")
    detail = models.TextField(blank=True, verbose_name="szczegóły")
    status = models.CharField(
        max_length=10,
        choices=ReportStatus.choices,
        default=ReportStatus.OPEN,
        verbose_name="status",
    )
    handled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reports_handled",
        verbose_name="obsłużone przez",
    )
    resolution = models.TextField(blank=True, verbose_name="rozstrzygnięcie")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "zgłoszenie"
        verbose_name_plural = "zgłoszenia"
        constraints = [
            models.UniqueConstraint(fields=["reporter", "post"], name="uniq_report_reporter_post")
        ]

    def __str__(self):
        return f"report u{self.reporter_id}/p{self.post_id} [{self.status}]"


class ModerationAction(TimeStampedModel):
    """Append-only audit log akcji moderacyjnych."""

    moderator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="moderation_actions",
        verbose_name="moderator",
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="post",
    )
    thread = models.ForeignKey(
        Thread,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="wątek",
    )
    action = models.CharField(max_length=10, choices=ModAction.choices, verbose_name="akcja")
    reason = models.TextField(blank=True, verbose_name="powód")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "akcja moderacyjna"
        verbose_name_plural = "akcje moderacyjne"

    def __str__(self):
        return f"modaction u{self.moderator_id} {self.action}"
