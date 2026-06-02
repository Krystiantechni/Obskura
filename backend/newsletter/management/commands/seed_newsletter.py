"""Idempotent seed for newsletter app: 7 Campaign templates from Mailings.jsx."""

from django.core.management.base import BaseCommand

# Source: src/pages/Mailings.jsx TEMPLATES array (Polish defaults from t() calls)
_CAMPAIGNS = [
    {
        "code": "welcome",
        "label": "Powitalny",
        "purpose": "Po pierwszym logowaniu",
        "freq_label": "Jednorazowo",
        "tag": "transactional",
        "order": 0,
    },
    {
        "code": "newsletter",
        "label": "Newsletter",
        "purpose": "Co czwartek o 23:00",
        "freq_label": "Tygodniowo",
        "tag": "marketing",
        "order": 1,
    },
    {
        "code": "premiere",
        "label": "Nowa premiera",
        "purpose": "Gdy nowy odcinek",
        "freq_label": "Co premiere",
        "tag": "notification",
        "order": 2,
    },
    {
        "code": "reset",
        "label": "Reset hasla",
        "purpose": "Na zadanie",
        "freq_label": "Na zadanie",
        "tag": "transactional",
        "order": 3,
    },
    {
        "code": "invoice",
        "label": "Faktura",
        "purpose": "Po kazdej platnosci",
        "freq_label": "Co odnowe",
        "tag": "transactional",
        "order": 4,
    },
    {
        "code": "security",
        "label": "Alert bezpieczenstwa",
        "purpose": "Nietypowe logowanie",
        "freq_label": "W razie potrzeby",
        "tag": "critical",
        "order": 5,
    },
    {
        "code": "cancel",
        "label": "Potw. anulowania",
        "purpose": "Po anulowaniu subskrypcji",
        "freq_label": "Jednorazowo",
        "tag": "transactional",
        "order": 6,
    },
]


class Command(BaseCommand):
    help = "Seed Campaign records from Mailings.jsx templates (idempotent)"

    def handle(self, *args, **options):
        from newsletter.models import Campaign

        for data in _CAMPAIGNS:
            code = data["code"]
            defaults = {k: v for k, v in data.items() if k != "code"}
            defaults["is_active"] = True
            campaign, created = Campaign.objects.update_or_create(
                code=code,
                defaults=defaults,
            )
            if options["verbosity"] >= 2:
                action = "Created" if created else "Updated"
                self.stdout.write(f"  {action}: {code}")

        if options["verbosity"] >= 1:
            self.stdout.write(self.style.SUCCESS("seed_newsletter done (7 campaigns)"))
