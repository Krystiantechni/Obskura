"""seed_community — populate dev/demo forum data.

4 forum categories mirrored from frontend src/pages/Forum.jsx CATEGORIES array.
A couple of demo threads + posts (published) for the open episode-discussion
category, created through the services layer so statuses and signal-driven
denormalization (posts_count / threads_count / last_post_at) run exactly as in
production.

Fully idempotent: categories via update_or_create keyed on slug; demo threads
are seeded only when no thread exists yet (second run is a no-op for threads).
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from community.models import Category, Thread
from community.services import create_post, create_thread
from core.text import pl_slugify

User = get_user_model()

# ---------------------------------------------------------------------------
# Static seed data (mirrored from src/pages/Forum.jsx CATEGORIES)
# ---------------------------------------------------------------------------

# name → icon is the lucide component used on the front; order = display index.
# "Twoje historie · creepypasta" is the only moderated section (Forum.jsx: MODEROWANE
# + RULES "Creepypasta — moderator musi oznaczyć przed publikacją").
CATEGORIES = [
    {
        "name": "Dyskusje o odcinkach",
        "description": "Rozmowy o premierach, teorie i analizy zakończeń.",
        "icon": "MessageSquare",
        "is_moderated": False,
        "order": 0,
    },
    {
        "name": "Kulisy i produkcja",
        "description": "Oficjalne notatki ekipy, AMA, wycieczki po studio.",
        "icon": "Users",
        "is_moderated": False,
        "order": 1,
    },
    {
        "name": "Twoje historie · creepypasta",
        "description": "Creepypasty i mikropowieści słuchaczy — moderowane przed publikacją.",
        "icon": "TrendingUp",
        "is_moderated": True,
        "order": 2,
    },
    {
        "name": "Techniczne · audio & sprzęt",
        "description": "Pomoc słuchacz ↔ słuchacz: słuchawki, binauralne 3D, aplikacja.",
        "icon": "MessageSquare",
        "is_moderated": False,
        "order": 3,
    },
]

# Demo threads (mirrored loosely from Forum.jsx threads). Each is opened in the
# non-moderated "Dyskusje o odcinkach" category, so the first post is PUBLISHED.
DEMO_AUTHOR = {
    "email": "demo.forum@obskura.test",
    "display_name": "Eliza Z.",
}

DEMO_THREADS = [
    {
        "title": "[S03E12] Mgła nad Wisłoujściem — dyskusja po premierze",
        "body": (
            "Dopiero co skończyłam słuchać finału sezonu. Scena na molo o północy "
            "zostaje w głowie na długo. Co o tym myślicie?"
        ),
        "replies": [
            "Ten oddech w 31:14 to nie była moja wyobraźnia. Odsłuchałem trzy razy.",
            "Zakończenie zostawia dokładnie tyle, ile trzeba. Brawa dla ekipy.",
        ],
    },
    {
        "title": "Czy ktoś inny słyszał oddech w 31:14?",
        "body": (
            "Słuchałem na słuchawkach binauralnych i przysiągłbym, że tuż przed "
            "rozdziałem 6 jest dodatkowy oddech, którego nie ma w opisie SFX."
        ),
        "replies": [
            "Tak! To prawdopodobnie infradźwięk 17.8 Hz — słychać tylko na słuchawkach.",
        ],
    },
]


class Command(BaseCommand):
    help = "Populate database with seed community/forum data (idempotent)."

    def handle(self, *args, **options):
        with transaction.atomic():
            self._seed_categories()
            thread_count, post_count = self._seed_demo_threads()

        self.stdout.write(
            self.style.SUCCESS(
                f"seed_community done — "
                f"{Category.objects.count()} categories, "
                f"{Thread.objects.count()} threads "
                f"({thread_count} demo threads, {post_count} demo posts)."
            )
        )

    # ------------------------------------------------------------------
    # Categories
    # ------------------------------------------------------------------

    def _seed_categories(self) -> None:
        for c in CATEGORIES:
            slug = pl_slugify(c["name"])
            Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": c["name"],
                    "description": c["description"],
                    "icon": c["icon"],
                    "is_moderated": c["is_moderated"],
                    "order": c["order"],
                    "is_active": True,
                },
            )

    # ------------------------------------------------------------------
    # Demo threads + posts (only when forum is empty)
    # ------------------------------------------------------------------

    def _seed_demo_threads(self) -> tuple[int, int]:
        """Seed a couple of published demo threads. No-op if any thread exists."""
        if Thread.all_objects.exists():
            return 0, 0

        author, _ = User.objects.update_or_create(
            email=DEMO_AUTHOR["email"],
            defaults={"display_name": DEMO_AUTHOR["display_name"]},
        )

        category = Category.objects.get(slug="dyskusje-o-odcinkach")

        thread_count = 0
        post_count = 0
        for spec in DEMO_THREADS:
            thread = create_thread(
                user=author,
                category=category,
                title=spec["title"],
                body=spec["body"],
            )
            thread_count += 1
            post_count += 1  # the first post created by create_thread
            for reply in spec["replies"]:
                create_post(user=author, thread=thread, body=reply)
                post_count += 1

        return thread_count, post_count
