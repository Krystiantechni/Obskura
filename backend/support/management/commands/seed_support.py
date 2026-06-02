"""Idempotent seed for support app: FAQ categories and items from Support.jsx."""

from django.core.management.base import BaseCommand

_CATEGORIES = [
    {"name": "Techniczne", "slug": "tech", "order": 0},
    {"name": "Platnosci", "slug": "pay", "order": 1},
    {"name": "Konto", "slug": "konto", "order": 2},
    {"name": "Tresc", "slug": "tresc", "order": 3},
]

_FAQ_ITEMS = [
    # --- Techniczne ---
    {
        "category_slug": "tech",
        "order": 0,
        "question": ("Dzwiek zacina sie / spada jakosc w srodku odcinka. Co robic?"),
        "answer": (
            "Najczesciej to slaba siec. Sprobuj pobrac odcinek w aplikacji"
            " do offline (ikona v obok tytulu). Jesli sluchasz na komputerze,"
            ' sprawdz w ustawieniach jakosc 320 kbps i wylacz "Adaptive".'
            " Jezeli problem trwa po przelaczeniu na siec komorkowa"
            " -- daj nam znac, sprawdzimy CDN twojego regionu."
        ),
    },
    {
        "category_slug": "tech",
        "order": 1,
        "question": "Dzwiek 3D / binauralny nie dziala -- slyszę zwykle stereo.",
        "answer": (
            "Dzwiek binauralny dziala wylacznie na sluchawkach."
            " Na glośnikach efekt zanika."
            " Jesli uzywasz sluchawek i wciaz slyszysz zwykle stereo:"
            " w ustawieniach iOS wylącz Spatial Audio (Apple),"
            ' a w Androidzie Dolby Atmos -- one "nadpisuja" nasz mix.'
        ),
    },
    {
        "category_slug": "tech",
        "order": 2,
        "question": "Aplikacja zawiesza sie przy uruchomieniu.",
        "answer": (
            "Wersja 4.2.1 (iOS) i 4.1.8 (Android) zawieraly blad"
            " przy starcie po nocnej synchronizacji."
            " Update do 4.2.3+ naprawia."
            " Jesli nie mozesz zaktualizowac"
            " -- wymuszone zamkniecie + ponowne uruchomienie zwykle wystarczy."
        ),
    },
    # --- Platnosci ---
    {
        "category_slug": "pay",
        "order": 0,
        "question": "Jak anulowac subskrypcje?",
        "answer": (
            "Wejdz w Konto -> Subskrypcja -> Anuluj."
            " Jedno klikniecie."
            ' Nie pytamy "jestes pewien?".'
            " Nie pokazujemy ekranow z prosba o zostanie."
            " Dostep masz do konca oplaconego okresu."
        ),
    },
    {
        "category_slug": "pay",
        "order": 1,
        "question": "Czy moge dostac zwrot za niewykorzystany okres?",
        "answer": (
            "Tak. W ciagu pierwszych 30 dni od pierwszej platnosci"
            " -- pelen zwrot, bez pytan."
            " Po tym czasie -- proporcjonalnie do wykorzystanego czasu"
            " (zwracamy reszte). Napisz na pomoc@obskura.audio."
        ),
    },
    {
        "category_slug": "pay",
        "order": 2,
        "question": "Jakie metody platnosci akceptujecie?",
        "answer": (
            "Karty (Visa, MC, Amex), BLIK, Przelewy24, Google Pay, Apple Pay."
            " Nie przyjmujemy kryptowalut."
            " Faktury VAT wystawiamy automatycznie po kazdej platnosci"
            " (PDF w mailu i w Koncie)."
        ),
    },
    # --- Konto ---
    {
        "category_slug": "konto",
        "order": 0,
        "question": "Zapomnialem hasla. Jak je zresetowac?",
        "answer": (
            'Na ekranie logowania kliknij "Zapomnialem hasla".'
            " Link resetujacy wygasa po 30 minutach (bezpieczenstwo)."
            " Jesli e-mail nie przychodzi w 5 minut"
            " -- sprawdz SPAM, a potem napisz do nas."
        ),
    },
    {
        "category_slug": "konto",
        "order": 1,
        "question": "Czy moge uzywac jednego konta na kilku urzadzeniach?",
        "answer": (
            "Tak. Plan Solo obsluguje 2 urzadzenia jednoczesnie,"
            " plan Klan -- 6 urzadzen i 5 profili"
            " (z osobnymi historiami sluchania)."
            " Mozesz sluchac na telefonie, laptopie,"
            " glosniku Sonos i w samochodzie naraz."
        ),
    },
    {
        "category_slug": "konto",
        "order": 2,
        "question": "Jak usunac konto?",
        "answer": (
            "Konto -> Prywatnosc -> Usun konto."
            " Eksport wszystkich danych w ZIP-ie dostajesz mailem przed usunieciem."
            " Po 30 dniach (okres karencji) konto jest nieodwracalnie usuniete"
            " z naszych baz, wlacznie z backupami."
        ),
    },
    # --- Tresc ---
    {
        "category_slug": "tresc",
        "order": 0,
        "question": "Czy historie sa oparte na faktach?",
        "answer": (
            "Niektorе -- oznaczamy je tagiem TRUE HORROR."
            " Wiekszosc to fikcja, ale czesto inspirowana doniesieniami"
            " prasowymi lub dokumentami."
            " Kazdy odcinek ma przypisany rodzaj"
            ' ("oryginalna fikcja", "inspirowane faktami", "dokument").'
        ),
    },
    {
        "category_slug": "tresc",
        "order": 1,
        "question": "Jak zostac narratorem / tworca na Obskurze?",
        "answer": (
            "Przyjmujemy zgloszenia raz na kwartal."
            " Zobacz strone Tworcy -- tam jest formularz."
            " Wymagamy probki audio (5-10 min) i krotkiego opisu,"
            " co chcesz opowiedziec. Odpowiadamy kazdemu."
        ),
    },
    {
        "category_slug": "tresc",
        "order": 2,
        "question": "Mam pomysl na historie. Czy moge go wam wyslac?",
        "answer": (
            "Tak -- uzywamy zewnetrznej skrzynki pomysly@obskura.audio"
            " z osobnym regulaminem (chroni cie i nas prawnie)."
            " Czytamy kazdy, ale odpowiadamy tylko, kiedy zaczynamy prace"
            " nad konkretnym pomyslem (max 1-2 razy w roku)."
        ),
    },
]


class Command(BaseCommand):
    help = "Seed FaqCategory and FaqItem records (idempotent)"

    def handle(self, *args, **options):
        self._seed_categories()
        self._seed_items()
        if options["verbosity"] >= 1:
            self.stdout.write(self.style.SUCCESS("seed_support done"))

    def _seed_categories(self):
        from support.models import FaqCategory

        for data in _CATEGORIES:
            cat, created = FaqCategory.objects.get_or_create(
                slug=data["slug"],
                defaults={
                    "name": data["name"],
                    "order": data["order"],
                    "is_active": True,
                },
            )
            if not created:
                cat.name = data["name"]
                cat.order = data["order"]
                cat.is_active = True
                cat.save(update_fields=["name", "order", "is_active", "updated_at"])

    def _seed_items(self):
        from support.models import FaqCategory, FaqItem

        for data in _FAQ_ITEMS:
            try:
                cat = FaqCategory.objects.get(slug=data["category_slug"])
            except FaqCategory.DoesNotExist:
                self.stderr.write(f"Category slug '{data['category_slug']}' not found, skipping.")
                continue

            item, created = FaqItem.objects.get_or_create(
                category=cat,
                order=data["order"],
                defaults={
                    "question": data["question"],
                    "answer": data["answer"],
                    "is_active": True,
                },
            )
            if not created:
                item.question = data["question"]
                item.answer = data["answer"]
                item.is_active = True
                item.save(update_fields=["question", "answer", "is_active", "updated_at"])
