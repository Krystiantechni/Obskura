from django.core.management.base import BaseCommand, CommandError

from newsletter.tasks import send_campaign_task


class Command(BaseCommand):
    help = "Enqueue a newsletter campaign to active subscribers."

    def add_arguments(self, parser):
        parser.add_argument("code")
        parser.add_argument("--freq", default=None)

    def handle(self, *args, **options):
        code = options["code"]
        freq = options.get("freq")
        result = send_campaign_task.delay(code, freq=freq)
        # eager → result.get() zwraca count; w realu .delay zwraca async
        try:
            n = result.get()
        except Exception:  # noqa: BLE001 — w realnym brokerze nie czekamy
            n = "queued"
        if n == 0:
            raise CommandError(f"Brak aktywnej kampanii o kodzie '{code}'.")
        self.stdout.write(self.style.SUCCESS(f"send_campaign '{code}' -> {n}"))
