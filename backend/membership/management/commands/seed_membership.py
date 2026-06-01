"""seed_membership — populate Club plans + patron tiers (idempotent).

3 plans (free/solo/klan) mirrored 1:1 from frontend Club.jsx.
3 patron tiers (witness/ally/exec) for the current season, from Patrons.jsx.
Stripe price ids left empty — filled later by sync_stripe_prices.
Fully idempotent (update_or_create keyed on natural keys).
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Season
from core.text import pl_slugify
from membership.models import PatronCode, PatronTier, Plan, PlanCode
from membership.selectors import current_season

# ---------------------------------------------------------------------------
# Plans (mirrored from src/pages/Club.jsx — feats arrays verbatim)
# ---------------------------------------------------------------------------

PLANS = [
    {
        "code": PlanCode.FREE,
        "name": "Próg",
        "price_month": 0,
        "price_year": 0,
        "featured": False,
        "tag": "Wejście do tunelu",
        "badge": "",
        "cta_label": "Zacznij za darmo",
        "monthly_quota": 20,
        "order": 0,
        "features": [
            {"ok": True, "text": "20 odcinków miesięcznie z katalogu (rotacja)"},
            {"ok": True, "text": "Jakość audio 192 kbps + binauralny 3D"},
            {"ok": True, "text": "1 urządzenie jednocześnie"},
            {"ok": True, "text": "Discord read-only dla członków"},
            {"ok": False, "text": "Bez reklam"},
            {"ok": False, "text": "Słuchanie offline"},
            {"ok": False, "text": "Premiery przed czasem"},
            {"ok": False, "text": "Treści ekskluzywne"},
        ],
    },
    {
        "code": PlanCode.SOLO,
        "name": "Solo",
        "price_month": 29,
        "price_year": 24,
        "featured": True,
        "tag": "Pełny dostęp dla jednego",
        "badge": "85% WYBIERA",
        "cta_label": "Wybierz Solo",
        "monthly_quota": None,
        "order": 1,
        "features": [
            {"ok": True, "text": "Wszystkie 147 odcinków, bez limitu"},
            {"ok": True, "text": "Nowe odcinki 72h przed premierą"},
            {"ok": True, "text": "Lossless 320 kbps + binauralny 3D"},
            {"ok": True, "text": "Bez reklam, bez przerw"},
            {"ok": True, "text": "Słuchanie offline bez limitu"},
            {"ok": True, "text": "2 urządzenia jednocześnie"},
            {"ok": True, "text": "Discord — pełny dostęp + Q&A kwartalnie"},
            {"ok": True, "text": "Kulisy, alternatywne zakończenia"},
        ],
    },
    {
        "code": PlanCode.KLAN,
        "name": "Klan",
        "price_month": 49,
        "price_year": 39,
        "featured": False,
        "tag": "Dla rodziny i audiofilów",
        "badge": "",
        "cta_label": "Wybierz Klan",
        "monthly_quota": None,
        "order": 2,
        "features": [
            {"ok": True, "text": "Wszystko z planu Solo"},
            {"ok": True, "text": "Premiery 7 dni przed publicznym wydaniem"},
            {"ok": True, "text": "Bezstratny FLAC dla audiofilów"},
            {"ok": True, "text": "6 urządzeń · 5 profili (w tym profil 12+)"},
            {"ok": True, "text": "Wpływ na produkcję — głosowanie kwartalne"},
            {"ok": True, "text": "Spotkania miesięczne z twórcami + archiwum"},
            {"ok": True, "text": "Fizyczna książka roczna w komplecie"},
            {"ok": True, "text": "Wsparcie premium — 1h odpowiedzi"},
        ],
    },
]

# ---------------------------------------------------------------------------
# Patron tiers (mirrored from src/pages/Patrons.jsx — feats arrays verbatim)
# ---------------------------------------------------------------------------

PATRON_TIERS = [
    {
        "code": PatronCode.WITNESS,
        "role_label": "// ŚWIADEK",
        "title": "Anonim w cieniu",
        "amount": 120,
        "featured": False,
        "capacity": None,
        "requires_application": False,
        "order": 0,
        "perks": [
            "Dostęp do całego sezonu 04 30 dni przed premierą",
            "Dwa spotkania na żywo w trakcie produkcji",
            "Twoje (lub anonimowe) imię w napisach",
            "Dyskord — kanał #patroni-s04",
            "Cyfrowy „zin” — 24-stronicowy PDF z notatkami z planu",
        ],
    },
    {
        "code": PatronCode.ALLY,
        "role_label": "// SOJUSZNIK · NAJPOPULARNIEJSZY",
        "title": "Twoje imię w pętli",
        "amount": 450,
        "featured": True,
        "capacity": None,
        "requires_application": False,
        "order": 1,
        "perks": [
            "Wszystko z poziomu Świadek",
            "Imię w napisach każdego odcinka (audio + pisemne)",
            "Dostęp do scenariuszy 30 dni przed nagraniem",
            "Głos doradczy — komentujesz scenariusze przed mixem",
            "Fizyczna paczka: plakat, naklejki, kaseta-pamiątka",
            "1× spotkanie 1-na-1 z dowolnym narratorem (45 min)",
        ],
    },
    {
        "code": PatronCode.EXEC,
        "role_label": "// PRODUCENT WYKONAWCZY",
        "title": "Współproducent",
        "amount": 2400,
        "featured": False,
        "capacity": 12,
        "requires_application": True,
        "order": 2,
        "perks": [
            "Wszystko z poziomu Sojusznik",
            '„Producent wykonawczy" w napisach + na stronie',
            "Wybór jednego odcinka z 3 propozycji do nagrania",
            "Wizyta w studio + udział w jednej sesji nagraniowej",
            'Numerowana kopia 12" winylowego soundtracka sezonu',
            "Limit: 12 osób na sezon.",
        ],
    },
]


class Command(BaseCommand):
    help = "Populate database with Club plans and patron tiers (idempotent)."

    def handle(self, *args, **options):
        with transaction.atomic():
            plan_count = self._seed_plans()
            season = self._resolve_season()
            tier_count = self._seed_patron_tiers(season)

        self.stdout.write(
            self.style.SUCCESS(
                f"seed_membership done — "
                f"{Plan.objects.count()} plans ({plan_count} created), "
                f"{PatronTier.objects.count()} patron tiers "
                f"({tier_count} created) for season {season.number}."
            )
        )

    # ------------------------------------------------------------------
    # Plans
    # ------------------------------------------------------------------

    def _seed_plans(self) -> int:
        created = 0
        for p in PLANS:
            _, was_created = Plan.objects.update_or_create(
                code=p["code"],
                defaults={
                    "name": p["name"],
                    "price_month": p["price_month"],
                    "price_year": p["price_year"],
                    "currency": "PLN",
                    "featured": p["featured"],
                    "tag": p["tag"],
                    "badge": p["badge"],
                    "cta_label": p["cta_label"],
                    "monthly_quota": p["monthly_quota"],
                    "features": p["features"],
                    "is_active": True,
                    "order": p["order"],
                },
            )
            if was_created:
                created += 1
        return created

    # ------------------------------------------------------------------
    # Season resolution — graceful when no season exists
    # ------------------------------------------------------------------

    def _resolve_season(self) -> Season:
        """Return the current season, creating a default one if none exists."""
        season = current_season()
        if season is None:
            title = "Sezon 04"
            season = Season.objects.create(
                number=4,
                title=title,
                slug=pl_slugify(title),
            )
        return season

    # ------------------------------------------------------------------
    # Patron tiers (per season)
    # ------------------------------------------------------------------

    def _seed_patron_tiers(self, season: Season) -> int:
        created = 0
        for tier in PATRON_TIERS:
            _, was_created = PatronTier.objects.update_or_create(
                season=season,
                code=tier["code"],
                defaults={
                    "role_label": tier["role_label"],
                    "title": tier["title"],
                    "amount": tier["amount"],
                    "currency": "PLN",
                    "featured": tier["featured"],
                    "capacity": tier["capacity"],
                    "requires_application": tier["requires_application"],
                    "perks": tier["perks"],
                    "is_active": True,
                    "order": tier["order"],
                },
            )
            if was_created:
                created += 1
        return created
