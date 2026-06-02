"""Management command -- seed_events.

Idempotent: uses update_or_create keyed on slug.
Data sourced from src/pages/Events.jsx.
"""

from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime

from events.models import Event, EventMode, EventStatus, RecordingAccess


def _dt(iso):
    """Parse ISO datetime string with timezone awareness (CET = UTC+2 in summer)."""
    dt = parse_datetime(iso)
    if dt is None:
        raise ValueError(f"Cannot parse datetime: {iso!r}")
    return dt


# ---------------------------------------------------------------------------
# Seed data derived from src/pages/Events.jsx
# ---------------------------------------------------------------------------

UPCOMING_EVENTS = [
    # Event 1 -- AMA z Katarzyna Wieczorek (Online)
    # seats "134 / 500" => capacity=500; seatsLabel "POZOSTALO" => price=0
    {
        "slug": "ama-z-katarzyna-wieczorek",
        "title": "AMA z Katarzyną Wieczorek",
        "mode": EventMode.ONLINE,
        "starts_at": _dt("2026-06-02T23:00:00+02:00"),
        "duration_minutes": 90,
        "capacity": 500,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": True,
        "description": (
            "Otwarte spotkanie z Katarzyną Wieczorek po finale trzeciego sezonu. "
            "90 minut rozmowy -- o tym, jak przygotowuje się do sceny, dlaczego "
            "pierwszego dnia w studio milczy, co robi gdy nagranie nie wychodzi."
        ),
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
    # Event 2 -- Premiera odsłuchowa Pacjentka 23, Kino Iluzjon (Live)
    # seats "12 / 180" => capacity=180; seatsLabel "POZOSTALO, 35 zl" => price=35
    {
        "slug": "premiera-odsłuchowa-pacjentka-23-kino-iluzjon",
        "title": 'Premiera odsłuchowa "Pacjentka 23" - Kino Iluzjon',
        "mode": EventMode.LIVE,
        "starts_at": _dt("2026-06-14T22:00:00+02:00"),
        "duration_minutes": 110,
        "capacity": 180,
        "price_pln": 35,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": "Warszawa, sala kinowa, słuchawki, 110 min + Q&A",
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
    # Event 3 -- Warsztat dźwiękowy, P. Górski (Klan)
    # metaVal "30 osób" => capacity=30; seatsFull=True => price=0
    {
        "slug": "warsztat-dzwiekowy-gorski",
        "title": "Warsztat dźwiekowy - P. Górski",
        "mode": EventMode.KLAN,
        "starts_at": _dt("2026-06-22T20:00:00+02:00"),
        "duration_minutes": 180,
        "capacity": 30,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": "Online, obecność live max 30 osób, tylko Klan",
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
    # Event 4 -- Letnia czytanka w lesie Kabacki (Live)
    # seats "23 / 80" => capacity=80; seatsLabel "POZOSTALO, 75 zl" => price=75
    {
        "slug": "letnia-czytanka-las-kabacki",
        "title": "Letnia czytanka w lesie Kabacki",
        "mode": EventMode.LIVE,
        "starts_at": _dt("2026-07-07T22:00:00+02:00"),
        "duration_minutes": 240,
        "capacity": 80,
        "price_pln": 75,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": "Warszawa, plener nocny, max 80 osób, 4h",
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
    # Event 5 -- Z Jakubem Borkiem, scenariusz (Online)
    # seats "412 / 500" => capacity=500; seatsLabel "POZOSTALO" => price=0
    {
        "slug": "ama-z-jakubem-borkiem-scenariusz",
        "title": "Z Jakubem Borkiem - scenariusz",
        "mode": EventMode.ONLINE,
        "starts_at": _dt("2026-07-18T22:00:00+02:00"),
        "duration_minutes": 90,
        "capacity": 500,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": "Online, Discord stage, 90 min",
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
    # Event 6 -- Festiwal Mokry Pasek (Live)
    # seatsLabel "OD 15.06" (PREORDER) => capacity=None; price=0
    {
        "slug": "festiwal-mokry-pasek-obskura",
        "title": 'Festiwal "Mokry Pąsek" - OBSKURA scena audio',
        "mode": EventMode.LIVE,
        "starts_at": _dt("2026-08-09T21:00:00+02:00"),
        "duration_minutes": 0,
        "capacity": None,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": "Kraków, Nowa Huta, hala dźwiekowa, cały wieczór",
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
]

PAST_EVENTS = [
    # Past 1 -- AMA z Piotrem Gorskim, dzwiek (Online, 04.05.2026, 217 osob)
    # stat3 "NAGRANIE DLA KLUBU" => recording_access=klub
    {
        "slug": "ama-z-piotrem-gorskim-dzwiek",
        "title": "AMA z Piotrem Górskim - dźwięk",
        "mode": EventMode.ONLINE,
        "starts_at": _dt("2026-05-04T21:00:00+02:00"),
        "duration_minutes": 134,
        "capacity": 217,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": (
            "Inżynier dźwięku Obskury o tym, dlaczego miksujemy w 7.1, kiedy "
            "używamy hydrofonów, i jak nagrać oddech bez oddychania."
        ),
        "recording_url": "https://obskura.pl/archiwum/ama-piotr-gorski-dzwiek",
        "recording_access": RecordingAccess.KLUB,
    },
    # Past 2 -- Premiera Lancuch Fenrira (Live, 12.04.2026, 180 osob)
    # stat3 "WYPRZEDANE" => no recording
    {
        "slug": "premiera-lancuch-fenrira-kino-iluzjon",
        "title": 'Premiera "Łańcuch Fenrira"',
        "mode": EventMode.LIVE,
        "starts_at": _dt("2026-04-12T20:00:00+02:00"),
        "duration_minutes": 180,
        "capacity": 180,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": (
            "Pierwsze publiczne osłuchanie 8. odcinka sezonu 3. Pokaz w totalnej "
            "ciemności + Q&A z reżyserem T. Reichem i ekspertem od mitologii UJ."
        ),
        "recording_url": "",
        "recording_access": RecordingAccess.NONE,
    },
    # Past 3 -- Q&A z Nadia O., anonimowo (Online, 15.03.2026, 412 osob)
    # stat3 "NAGRANIE DLA KLANU" => recording_access=klan
    {
        "slug": "qa-z-nadia-o-anonimowo",
        "title": "Q&A z Nadią O. - anonimowo",
        "mode": EventMode.ONLINE,
        "starts_at": _dt("2026-03-15T21:00:00+01:00"),
        "duration_minutes": 107,
        "capacity": 412,
        "price_pln": 0,
        "status": EventStatus.PUBLISHED,
        "is_featured": False,
        "description": (
            "Jedyna jak dotąd publiczna rozmowa z naszą najbardziej tajemniczą "
            "narratorką. Tylko głos, bez kamery, bez prawdziwego imienia."
        ),
        "recording_url": "https://obskura.pl/archiwum/qa-nadia-o-anonimowo",
        "recording_access": RecordingAccess.KLAN,
    },
]


class Command(BaseCommand):
    help = "Seed events from Events.jsx data (idempotent)."

    def handle(self, *args, **options):
        verbosity = options.get("verbosity", 1)
        created_count = 0
        updated_count = 0

        all_events = UPCOMING_EVENTS + PAST_EVENTS

        for data in all_events:
            slug = data["slug"]
            defaults = {k: v for k, v in data.items() if k != "slug"}
            _, created = Event.objects.update_or_create(
                slug=slug,
                defaults=defaults,
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        if verbosity >= 1:
            total = len(all_events)
            self.stdout.write(
                self.style.SUCCESS(
                    f"seed_events: {total} events -- "
                    f"{created_count} created, {updated_count} updated."
                )
            )
