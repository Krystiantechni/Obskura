from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

from catalog.models import Episode, Season
from core.models import TimeStampedModel


class PlanCode(models.TextChoices):
    FREE = "free", "Próg (free)"
    SOLO = "solo", "Solo"
    KLAN = "klan", "Klan"


class SubStatus(models.TextChoices):
    INCOMPLETE = "incomplete", "Niekompletna"
    TRIALING = "trialing", "Okres próbny"
    ACTIVE = "active", "Aktywna"
    PAST_DUE = "past_due", "Zaległa płatność"
    CANCELED = "canceled", "Anulowana"
    EXPIRED = "expired", "Wygasła"


class BillingPeriod(models.TextChoices):
    MONTH = "month", "Miesięcznie"
    YEAR = "year", "Rocznie"


class PatronCode(models.TextChoices):
    WITNESS = "witness", "Świadek"
    ALLY = "ally", "Sojusznik"
    EXEC = "exec", "Producent"


class PatronageStatus(models.TextChoices):
    PENDING = "pending", "Oczekująca"
    PAID = "paid", "Opłacona"
    REFUNDED = "refunded", "Zwrócona"
    CANCELED = "canceled", "Anulowana"


class Plan(TimeStampedModel):
    """Katalog planów Klubu (admin-managed, cache'owany)."""

    code = models.CharField(
        max_length=8, unique=True, choices=PlanCode.choices, verbose_name="kod planu"
    )
    name = models.CharField(max_length=60, verbose_name="nazwa")
    price_month = models.PositiveIntegerField(verbose_name="cena miesięczna (PLN)")
    price_year = models.PositiveIntegerField(
        verbose_name="cena miesięczna przy rocznym (PLN)",
        help_text="Stawka za miesiąc przy rozliczeniu rocznym; total = ×12 w serializerze.",
    )
    currency = models.CharField(max_length=3, default="PLN", verbose_name="waluta")
    featured = models.BooleanField(default=False, verbose_name="wyróżniony")
    tag = models.CharField(max_length=40, blank=True, verbose_name="tag")
    badge = models.CharField(max_length=40, blank=True, verbose_name="badge")
    cta_label = models.CharField(max_length=40, blank=True, verbose_name="etykieta CTA")
    monthly_quota = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="limit miesięczny",
        help_text="Liczba nie-premium odcinków/mc dla planu (free=20); null = bez limitu.",
    )
    features = models.JSONField(
        default=list, blank=True, verbose_name="cechy", help_text="[{ok:bool, text:str}, ...]"
    )
    stripe_price_id_month = models.CharField(
        max_length=120, blank=True, verbose_name="Stripe price id (mc)"
    )
    stripe_price_id_year = models.CharField(
        max_length=120, blank=True, verbose_name="Stripe price id (rok)"
    )
    is_active = models.BooleanField(default=True, verbose_name="aktywny")
    order = models.PositiveIntegerField(default=0, verbose_name="kolejność")

    class Meta(TimeStampedModel.Meta):
        ordering = ["order"]
        verbose_name = "plan"
        verbose_name_plural = "plany"

    def __str__(self):
        return f"{self.name} ({self.code})"


class Subscription(TimeStampedModel):
    """Subskrypcja Klubu (recurring)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
        verbose_name="użytkownik",
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.PROTECT, related_name="subscriptions", verbose_name="plan"
    )
    status = models.CharField(
        max_length=12,
        choices=SubStatus.choices,
        default=SubStatus.INCOMPLETE,
        verbose_name="status",
    )
    billing_period = models.CharField(
        max_length=5, choices=BillingPeriod.choices, verbose_name="okres rozliczeniowy"
    )
    period_start = models.DateTimeField(null=True, blank=True, verbose_name="początek okresu")
    period_end = models.DateTimeField(
        null=True, blank=True, db_index=True, verbose_name="koniec okresu"
    )
    trial_end = models.DateTimeField(null=True, blank=True, verbose_name="koniec okresu próbnego")
    auto_renew = models.BooleanField(default=True, verbose_name="auto-odnawianie")
    cancel_at_period_end = models.BooleanField(
        default=False, verbose_name="anuluj na koniec okresu"
    )
    stripe_customer_id = models.CharField(
        max_length=120, blank=True, verbose_name="Stripe customer id"
    )
    stripe_subscription_id = models.CharField(
        max_length=120, blank=True, verbose_name="Stripe subscription id"
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "subskrypcja"
        verbose_name_plural = "subskrypcje"
        indexes = [models.Index(fields=["user", "status"])]
        constraints = [
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(status__in=["trialing", "active"]),
                name="uniq_active_subscription_per_user",
            )
        ]

    @property
    def is_live(self):
        """Żywa subskrypcja: status w {trialing, active} i okres jeszcze nie wygasł."""
        if self.status not in (SubStatus.TRIALING, SubStatus.ACTIVE):
            return False
        return self.period_end is None or self.period_end > timezone.now()

    def __str__(self):
        return f"sub u{self.user_id}/{self.plan_id} [{self.status}]"


class PatronTier(TimeStampedModel):
    """Tier patronatu, per sezon, płatność jednorazowa."""

    season = models.ForeignKey(
        Season, on_delete=models.PROTECT, related_name="patron_tiers", verbose_name="sezon"
    )
    code = models.CharField(max_length=8, choices=PatronCode.choices, verbose_name="kod tieru")
    role_label = models.CharField(max_length=40, verbose_name="etykieta roli")
    title = models.CharField(max_length=80, verbose_name="tytuł")
    amount = models.PositiveIntegerField(verbose_name="kwota (PLN)")
    currency = models.CharField(max_length=3, default="PLN", verbose_name="waluta")
    featured = models.BooleanField(default=False, verbose_name="wyróżniony")
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="liczba miejsc",
        help_text="Limit patronów (paid) w sezonie; null = bez limitu.",
    )
    requires_application = models.BooleanField(default=False, verbose_name="wymaga aplikacji")
    perks = models.JSONField(default=list, blank=True, verbose_name="benefity")
    stripe_price_id = models.CharField(max_length=120, blank=True, verbose_name="Stripe price id")
    is_active = models.BooleanField(default=True, verbose_name="aktywny")
    order = models.PositiveIntegerField(default=0, verbose_name="kolejność")

    class Meta(TimeStampedModel.Meta):
        ordering = ["order"]
        verbose_name = "tier patronatu"
        verbose_name_plural = "tiery patronatu"
        constraints = [
            models.UniqueConstraint(fields=["season", "code"], name="uniq_patron_tier_season_code")
        ]

    def __str__(self):
        return f"{self.title} (S{self.season_id}/{self.code})"


class Patronage(TimeStampedModel):
    """Patronat usera (jednorazowy zakup tieru)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patronages",
        verbose_name="użytkownik",
    )
    tier = models.ForeignKey(
        PatronTier, on_delete=models.PROTECT, related_name="patronages", verbose_name="tier"
    )
    amount = models.PositiveIntegerField(verbose_name="kwota (PLN)")
    status = models.CharField(
        max_length=10,
        choices=PatronageStatus.choices,
        default=PatronageStatus.PENDING,
        verbose_name="status",
    )
    is_anonymous = models.BooleanField(default=False, verbose_name="anonimowo")
    credit_name = models.CharField(max_length=80, blank=True, verbose_name="podpis w napisach")
    anon_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="numer anonima",
        help_text="Sekwencyjny w obrębie sezonu dla anonimów (np. „Anonim #042“).",
    )
    is_company = models.BooleanField(default=False, verbose_name="firma")
    company_name = models.CharField(max_length=120, blank=True, verbose_name="nazwa firmy")
    stripe_checkout_session_id = models.CharField(
        max_length=120, blank=True, verbose_name="Stripe checkout session id"
    )
    stripe_payment_intent_id = models.CharField(
        max_length=120, blank=True, verbose_name="Stripe payment intent id"
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "patronat"
        verbose_name_plural = "patronaty"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "tier"],
                condition=Q(status__in=["pending", "paid"]),
                name="uniq_active_patronage_user_tier",
            )
        ]

    def __str__(self):
        return f"patronage u{self.user_id}/{self.tier_id} [{self.status}]"


class FreePlayGrant(TimeStampedModel):
    """Licznik wykorzystania quoty free (20 nie-premium odcinków / miesiąc)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="free_play_grants",
        verbose_name="użytkownik",
    )
    episode = models.ForeignKey(
        Episode,
        on_delete=models.CASCADE,
        related_name="free_play_grants",
        verbose_name="odcinek",
    )
    period = models.CharField(
        max_length=7,
        db_index=True,
        verbose_name="okres (YYYY-MM)",
        help_text="Miesiąc kalendarzowy konsumpcji, format YYYY-MM.",
    )

    class Meta(TimeStampedModel.Meta):
        verbose_name = "grant odtworzenia (free)"
        verbose_name_plural = "granty odtworzeń (free)"
        indexes = [models.Index(fields=["user", "period"])]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "episode", "period"],
                name="uniq_free_grant_user_episode_period",
            )
        ]

    def __str__(self):
        return f"grant u{self.user_id}/e{self.episode_id} {self.period}"
