"""Idempotent seed for pages app: 3 LegalDoc kinds + PressItems from Press.jsx."""

from django.core.management.base import BaseCommand
from django.utils import timezone

_PRIVACY_BODY = (
    "Administratorem danych osobowych jest OBSKURA Audio sp. z o.o. "
    "z siedziba w Gdansku, ul. Stara Stocznia 27, 80-863, "
    "NIP 583-321-09-44, KRS 0000847291. "
    "Zbieramy minimalnie — e-mail, haslo zaszyfrowane, dane o tym, "
    "jakich odcinkow sluchasz. Nie sprzedajemy nic nikomu. "
    "Nie ma Facebook Pixela, nie ma Google Analytics, "
    "uzywamy wlasnego anonimowego trackingu. "
    "Wszystkie dane mozesz pobrac, edytowac lub usunac z jednego ekranu. "
    "RODO i wszystko, co z tego wynika — szanujemy."
)

_REGULAMIN_BODY = (
    "Placisz — sluchasz. Mozesz anulowac w kazdej chwili jednym "
    "kliknieciem. 30 dni od zakupu — pelen zwrot bez pytan. "
    "Nie udostepniaj konta osobom poza domem. "
    "Nie sciagaj naszych odcinkow na zewnatrz. "
    "Badz uprzejmy w komentarzach. "
    "OBSKURA Audio sp. z o.o. oferuje trzy plany: "
    "Prog (bezplatny, ograniczony), Solo (platny indywidualny), "
    "Klan (platny rodzinny). "
    "Subskrypcja odnawia sie automatycznie do momentu jej anulowania. "
    "Platnosci realizowane sa przez Stripe Payments Europe."
)

_COOKIES_BODY = (
    "Uzywamy minimum cookies niezbednych do dzialania serwisu "
    "(login, koszyk, jezyk). "
    "Do statystyk — Plausible (bez identyfikacji, "
    "bez third-party cookies). "
    "Bez Google Analytics, bez Facebook Pixela, bez retargetingu. "
    "Cookies (ciasteczka) to male pliki tekstowe, ktore przegladarka "
    "zapisuje na twoim urzadzeniu. "
    "Uzywamy 6 cookies: 3 obowiazkowe (ob_session, ob_csrf, ob_lang) "
    "i 3 opcjonalne (ob_player_qual, ob_player_pos, plausible_id)."
)

_PRESS_DATA = [
    {
        "source": "GAZETA WYBORCZA · 24.05.2026",
        "quote": (
            "Najlepsze polskie audio od lat. "
            "Slychac kazdy oddech, kazdy szept. "
            "Sluchawki obowiazkowe."
        ),
        "author": "— ALEKSANDRA KWIATKOWSKA · KULTURA",
        "url": "",
        "order": 0,
    },
    {
        "source": "DWUTYGODNIK · 04/2026",
        "quote": (
            "Obskura robi dla audio horroru to, co Netflix zrobil dla "
            "seriali — dowodzi, ze gatunek moze byc sztuka."
        ),
        "author": "— MICHAL NOWACKI · TEORIA KULTURY",
        "url": "",
        "order": 1,
    },
    {
        "source": "VICE POLSKA · 12.03.2026",
        "quote": (
            'Nie spalem trzy dni po "Pacjentce 23". '
            "Cos w tym dzwieku jest po prostu nieludzkie."
        ),
        "author": "— PIOTR KARDAS · KULTURA",
        "url": "",
        "order": 2,
    },
    {
        "source": "PRESS · NR 03/2026",
        "quote": (
            "Niewielki zespol, ogromna jakosc. To dzis najbardziej "
            "obiecujacy niezalezny gracz w audio na rynku."
        ),
        "author": "— REDAKCJA · BIZNES MEDIOW",
        "url": "",
        "order": 3,
    },
    {
        "source": "THE GUARDIAN · 18.04.2026 (EN)",
        "quote": (
            "Polish horror audio that rivals anything coming out of "
            "the UK or US. Get your headphones ready."
        ),
        "author": "— SARAH BRYAN · PODCAST CRITIC",
        "url": "",
        "order": 4,
    },
    {
        "source": "PODCAST MAGAZINE · 05/2026",
        "quote": (
            "A standard-setting work in binaural narrative. "
            "The kind of show you'll want to listen to in the dark."
        ),
        "author": "— DAN MISENER · CRITIC AT LARGE",
        "url": "",
        "order": 5,
    },
]


class Command(BaseCommand):
    help = "Seed LegalDoc (3 kinds) and PressItem records (idempotent)"

    def handle(self, *args, **options):
        self._seed_legal()
        self._seed_press()
        if options["verbosity"] >= 1:
            self.stdout.write(self.style.SUCCESS("seed_pages done"))

    def _seed_legal(self):
        from pages.models import LegalDoc, LegalKind

        now = timezone.now()
        version = "4.2.1"

        legal_data = [
            {"kind": LegalKind.PRYWATNOSC, "body": _PRIVACY_BODY},
            {"kind": LegalKind.REGULAMIN, "body": _REGULAMIN_BODY},
            {"kind": LegalKind.COOKIES, "body": _COOKIES_BODY},
        ]

        for item in legal_data:
            doc, created = LegalDoc.objects.get_or_create(
                kind=item["kind"],
                version=version,
                defaults={
                    "body": item["body"],
                    "published_at": now,
                    "is_current": True,
                },
            )
            if not created:
                doc.body = item["body"]
                doc.published_at = now
                doc.is_current = True
                doc.save(
                    update_fields=[
                        "body",
                        "published_at",
                        "is_current",
                        "updated_at",
                    ]
                )

    def _seed_press(self):
        from pages.models import PressItem

        for item in _PRESS_DATA:
            obj, created = PressItem.objects.get_or_create(
                source=item["source"],
                defaults={
                    "quote": item["quote"],
                    "author": item["author"],
                    "url": item["url"],
                    "order": item["order"],
                    "is_active": True,
                },
            )
            if not created:
                obj.quote = item["quote"]
                obj.author = item["author"]
                obj.url = item["url"]
                obj.order = item["order"]
                obj.is_active = True
                obj.save(
                    update_fields=[
                        "quote",
                        "author",
                        "url",
                        "order",
                        "is_active",
                        "updated_at",
                    ]
                )
