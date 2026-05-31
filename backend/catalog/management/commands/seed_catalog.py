"""seed_catalog — populate dev/demo data.

16 real episodes mirrored from frontend Archive.jsx + STORIES array.
8 creators from Creators.jsx.
Generated episodes fill up to 50 total.
Fully idempotent (update_or_create / get_or_create keyed on natural keys).
"""

import random
from datetime import UTC, datetime

from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Creator, Episode, Genre, Season
from core.text import pl_slugify

# ---------------------------------------------------------------------------
# Static seed data (mirrored from frontend)
# ---------------------------------------------------------------------------

GENRES = [
    {"slug": "psy", "name": "Psychologiczny", "accent": "red"},
    {"slug": "true", "name": "True horror", "accent": "red"},
    {"slug": "body", "name": "Body horror", "accent": "red"},
    {"slug": "folk", "name": "Folk horror", "accent": "blue"},
    {"slug": "cosmic", "name": "Cosmic dread", "accent": "blue"},
    {"slug": "cyber", "name": "Cyber horror", "accent": "blue"},
    {"slug": "noir", "name": "Noir", "accent": "none"},
    {"slug": "myth", "name": "Mitologia", "accent": "none"},
]

SEASONS = [
    {"number": 2, "title": "Sezon 02"},
    {"number": 3, "title": "Sezon 03"},
]

# tag values from Creators.jsx (Polish) → Creator.Role
_TAG_TO_ROLE = {
    "Narratorka": Creator.Role.NARRATOR,
    "Narrator": Creator.Role.NARRATOR,
    "Reżyseria": Creator.Role.DIRECTOR,
    "Dźwięk": Creator.Role.SOUND,
    "Scenariusz": Creator.Role.WRITER,
}

CREATORS = [
    {
        "full_name": "Katarzyna Wieczorek",
        "tag": "Narratorka",
        "bio": (
            "Aktorka teatralna i radiowa. Specjalizuje się w głosach kobiet"
            " w sytuacjach granicznych."
        ),
    },
    {
        "full_name": "Marta Sobczak",
        "tag": "Reżyseria",
        "bio": "Współzałożycielka Obskury. Reżyseruje 90% odcinków. Wcześniej Trójka, BBC Sounds.",
    },
    {
        "full_name": "Piotr Górski",
        "tag": "Dźwięk",
        "bio": "Architekt binauralnej przestrzeni. Każdy mix wymaga 40h pracy.",
    },
    {
        "full_name": "Adam Karpiński",
        "tag": "Narrator",
        "bio": "Były dziennikarz Gazety Wyborczej. Głos do serii TRUE HORROR.",
    },
    {
        "full_name": "Jakub Borek",
        "tag": "Scenariusz",
        "bio": (
            "Pisał dla CD Projekt i Bloober Team."
            " W Obskurze odpowiada za psychologiczne i cosmic."
        ),
    },
    {
        "full_name": "Zofia Lange",
        "tag": "Narratorka",
        "bio": "Lingwistka, mówi czterema językami. Lead w sezonie 2.",
    },
    {
        "full_name": "Tomasz Reich",
        "tag": "Reżyseria",
        "bio": "Specjalizacja: mitologia słowiańska i nordycka.",
    },
    {
        "full_name": "Nadia O.",
        "tag": "Narratorka",
        "bio": "Pseudonim. Anonimowa. Głos do cyber-horror i body horror.",
    },
]

# Real episodes from Archive.jsx STORIES array.
# num, season_number, title, title_em, genre_slug, dur_min, year, rating, plays_str
# Episodes whose num is in AUDIO_EP_NUMS get audio_url set.
AUDIO_EP_NUMS = {2, 3, 4, 5, 6, 7, 12}

REAL_EPISODES = [
    # season 3
    {
        "num": 12,
        "season_number": 3,
        "title": "Mgła nad",
        "title_em": "Wisłoujściem",
        "genre_slug": "cosmic",
        "dur_min": 47,
        "year": 2026,
        "rating": 4.9,
        "plays_str": "847K",
    },
    {
        "num": 11,
        "season_number": 3,
        "title": "Ostatnie",
        "title_em": "Światło",
        "genre_slug": "psy",
        "dur_min": 52,
        "year": 2026,
        "rating": 4.9,
        "plays_str": "623K",
    },
    {
        "num": 10,
        "season_number": 3,
        "title": "Coś patrzy",
        "title_em": "z lasu",
        "genre_slug": "folk",
        "dur_min": 74,
        "year": 2026,
        "rating": 4.8,
        "plays_str": "512K",
    },
    {
        "num": 9,
        "season_number": 3,
        "title": "Dom przy",
        "title_em": "ul. Cisowej 7",
        "genre_slug": "true",
        "dur_min": 38,
        "year": 2026,
        "rating": 4.9,
        "plays_str": "798K",
    },
    {
        "num": 8,
        "season_number": 3,
        "title": "Sygnał z",
        "title_em": "orbity",
        "genre_slug": "cosmic",
        "dur_min": 62,
        "year": 2025,
        "rating": 5.0,
        "plays_str": "1.2M",
    },
    {
        "num": 7,
        "season_number": 3,
        "title": "Pod",
        "title_em": "betonem",
        "genre_slug": "cyber",
        "dur_min": 58,
        "year": 2025,
        "rating": 4.6,
        "plays_str": "445K",
    },
    {
        "num": 6,
        "season_number": 3,
        "title": "Łańcuch",
        "title_em": "Fenrira",
        "genre_slug": "myth",
        "dur_min": 82,
        "year": 2025,
        "rating": 5.0,
        "plays_str": "932K",
    },
    {
        "num": 5,
        "season_number": 3,
        "title": "Dym i",
        "title_em": "obietnice",
        "genre_slug": "noir",
        "dur_min": 44,
        "year": 2025,
        "rating": 4.7,
        "plays_str": "388K",
    },
    {
        "num": 4,
        "season_number": 3,
        "title": "Pacjentka",
        "title_em": "numer 23",
        "genre_slug": "psy",
        "dur_min": 56,
        "year": 2025,
        "rating": 4.8,
        "plays_str": "512K",
    },
    {
        "num": 3,
        "season_number": 3,
        "title": "Zimowy",
        "title_em": "wąwóz",
        "genre_slug": "folk",
        "dur_min": 47,
        "year": 2024,
        "rating": 4.5,
        "plays_str": "298K",
    },
    {
        "num": 2,
        "season_number": 3,
        "title": "Korelacja",
        "title_em": "lustra",
        "genre_slug": "cosmic",
        "dur_min": 71,
        "year": 2024,
        "rating": 4.7,
        "plays_str": "402K",
    },
    {
        "num": 1,
        "season_number": 3,
        "title": "Maszynownia",
        "title_em": "",
        "genre_slug": "cyber",
        "dur_min": 49,
        "year": 2024,
        "rating": 4.6,
        "plays_str": "361K",
    },
    # season 2
    {
        "num": 12,
        "season_number": 2,
        "title": "Pierwsze",
        "title_em": "mleko",
        "genre_slug": "body",
        "dur_min": 38,
        "year": 2024,
        "rating": 4.9,
        "plays_str": "521K",
    },
    {
        "num": 11,
        "season_number": 2,
        "title": "Wilcza",
        "title_em": "godzina",
        "genre_slug": "myth",
        "dur_min": 64,
        "year": 2024,
        "rating": 4.8,
        "plays_str": "478K",
    },
    {
        "num": 10,
        "season_number": 2,
        "title": "Pusty",
        "title_em": "pokój",
        "genre_slug": "psy",
        "dur_min": 42,
        "year": 2023,
        "rating": 4.6,
        "plays_str": "329K",
    },
    {
        "num": 9,
        "season_number": 2,
        "title": "Lichwiarz",
        "title_em": "",
        "genre_slug": "noir",
        "dur_min": 51,
        "year": 2023,
        "rating": 4.4,
        "plays_str": "212K",
    },
]

TOTAL_TARGET = 50


def _parse_plays(plays_str: str) -> int:
    """Convert '847K' → 847000, '1.2M' → 1200000."""
    s = plays_str.strip()
    if s.endswith("M"):
        return int(float(s[:-1]) * 1_000_000)
    if s.endswith("K"):
        return int(float(s[:-1]) * 1_000)
    return int(s)


def _dt(year: int) -> datetime:
    """Return timezone-aware Jan 1 datetime for given year."""
    return datetime(year, 1, 1, 0, 0, 0, tzinfo=UTC)


class Command(BaseCommand):
    help = "Populate database with seed catalog data (idempotent)."

    def handle(self, *args, **options):
        with transaction.atomic():
            genre_map = self._seed_genres()
            season_map = self._seed_seasons()
            self._seed_creators()
            ep_count = self._seed_real_episodes(genre_map, season_map)
            gen_count = self._seed_generated_episodes(genre_map, season_map)

        self.stdout.write(
            self.style.SUCCESS(
                f"seed_catalog done — "
                f"{Genre.objects.count()} genres, "
                f"{Season.objects.count()} seasons, "
                f"{Creator.objects.count()} creators, "
                f"{Episode.objects.count()} episodes "
                f"({ep_count} real, {gen_count} generated)."
            )
        )

    # ------------------------------------------------------------------
    # Genres
    # ------------------------------------------------------------------

    def _seed_genres(self) -> dict:
        """Return {slug: Genre} mapping."""
        genre_map = {}
        for g in GENRES:
            obj, _ = Genre.objects.update_or_create(
                slug=g["slug"],
                defaults={"name": g["name"], "accent": g["accent"]},
            )
            genre_map[g["slug"]] = obj
        return genre_map

    # ------------------------------------------------------------------
    # Seasons
    # ------------------------------------------------------------------

    def _seed_seasons(self) -> dict:
        """Return {season_number: Season} mapping."""
        season_map = {}
        for s in SEASONS:
            slug = pl_slugify(s["title"])
            obj, _ = Season.objects.update_or_create(
                number=s["number"],
                defaults={"title": s["title"], "slug": slug},
            )
            season_map[s["number"]] = obj
        return season_map

    # ------------------------------------------------------------------
    # Creators
    # ------------------------------------------------------------------

    def _seed_creators(self) -> None:
        for c in CREATORS:
            slug = pl_slugify(c["full_name"])
            role = _TAG_TO_ROLE[c["tag"]]
            Creator.objects.update_or_create(
                slug=slug,
                defaults={"name": c["full_name"], "role": role, "bio": c["bio"]},
            )

    # ------------------------------------------------------------------
    # Real episodes (16 from Archive.jsx)
    # ------------------------------------------------------------------

    def _seed_real_episodes(self, genre_map: dict, season_map: dict) -> int:
        count = 0
        for ep in REAL_EPISODES:
            genre = genre_map[ep["genre_slug"]]
            season = season_map[ep["season_number"]]
            is_true = ep["genre_slug"] == "true"
            kind = Episode.Kind.DOC if is_true else Episode.Kind.FICTION
            audio_url = f"/audio/ep-{ep['num']}.mp3" if ep["num"] in AUDIO_EP_NUMS else ""

            # Stable slug: "s{season_num}-e{ep_num}-{title_slug}"
            full_title = ep["title"] + (" " + ep["title_em"] if ep["title_em"] else "")
            title_slug = pl_slugify(full_title)
            slug = f"s{ep['season_number']:02d}-e{ep['num']:02d}-{title_slug}"

            _, created = Episode.objects.update_or_create(
                season=season,
                number=ep["num"],
                defaults={
                    "genre": genre,
                    "title": ep["title"],
                    "title_em": ep["title_em"],
                    "slug": slug,
                    "duration_s": ep["dur_min"] * 60,
                    "audio_url": audio_url,
                    "rating_avg": ep["rating"],
                    "plays_count": _parse_plays(ep["plays_str"]),
                    "is_true_horror": is_true,
                    "kind": kind,
                    "published_at": _dt(ep["year"]),
                },
            )
            if created:
                count += 1
        return count

    # ------------------------------------------------------------------
    # Generated episodes (fill up to TOTAL_TARGET)
    # ------------------------------------------------------------------

    def _seed_generated_episodes(self, genre_map: dict, season_map: dict) -> int:
        current = Episode.objects.count()
        if current >= TOTAL_TARGET:
            return 0

        # Use a local Random instance — does NOT pollute global random state.
        rng = random.Random(42)
        genre_slugs = list(genre_map.keys())
        season_numbers = list(season_map.keys())

        # Track which (season_id, number) pairs are already used.
        used: set = set(Episode.objects.values_list("season_id", "number"))
        season_id_map = {s.number: s.id for s in season_map.values()}

        created_count = 0
        i = 0
        while Episode.objects.count() < TOTAL_TARGET:
            i += 1
            season_num = rng.choice(season_numbers)
            season = season_map[season_num]
            season_id = season_id_map[season_num]

            # Find a free episode number for this season (up to 50 attempts).
            ep_num = rng.randint(1, 99)
            attempts = 0
            while (season_id, ep_num) in used and attempts < 50:
                ep_num = rng.randint(1, 99)
                attempts += 1
            if (season_id, ep_num) in used:
                continue

            genre_slug = rng.choice(genre_slugs)
            genre = genre_map[genre_slug]
            is_true = genre_slug == "true"
            kind = Episode.Kind.DOC if is_true else Episode.Kind.FICTION
            title = f"Echo {i}"
            slug = f"s{season_num:02d}-e{ep_num:02d}-echo-{i}"
            published_at = _dt(rng.randint(2022, 2026))

            Episode.objects.get_or_create(
                season=season,
                number=ep_num,
                defaults={
                    "genre": genre,
                    "title": title,
                    "title_em": "",
                    "slug": slug,
                    "duration_s": rng.randint(30, 90) * 60,
                    "rating_avg": round(rng.uniform(4.0, 5.0), 2),
                    "plays_count": rng.randint(10_000, 500_000),
                    "is_true_horror": is_true,
                    "kind": kind,
                    "published_at": published_at,
                },
            )
            used.add((season_id, ep_num))
            created_count += 1

        return created_count
