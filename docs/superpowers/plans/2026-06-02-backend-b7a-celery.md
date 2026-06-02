# Faza B7a — Celery + async — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Add Celery (+ static beat) so emails go async, newsletter campaigns can be bulk-sent, and periodic jobs run (subscription expiry, stale-pending cleanup, rating self-heal). No Channels (that is B7b).

**Architecture:** A Celery app (`obskura/celery.py`) configured from Django settings (Redis broker on db 1, fire-and-forget, eager in tests), tasks autodiscovered from `<app>/tasks.py`. Email moves behind `core.tasks.send_email_task`. docker-compose gains `worker` + `beat` services (same image as `web`). Tests run Celery eager (green without running workers).

**Tech Stack:** Django 5.2, Celery 5 (`celery[redis]`), Redis broker, pytest.

> **Konwencje:** commity ENGLISH, bez Co-Authored-By; branch `feat/backend-b7a-celery`; testy w kontenerze (`docker compose run --rm web pytest`); `ruff`+`format` czyste; brak nowych migracji (B7a nie dodaje modeli). Kontekst: [`docs/superpowers/specs/2026-06-02-backend-b7a-celery-design.md`](../specs/2026-06-02-backend-b7a-celery-design.md).

---

## Decyzje projektowe (rozstrzygnięte)
1. Split B7: B7a Celery (ten plan), B7b Channels później.
2. Zakres: async maile + bulk newsletter + periodic expiry/cleanup/stats.
3. Statyczny `CELERY_BEAT_SCHEDULE`; broker Redis db 1; `task_ignore_result`.
4. Runtime: compose worker/beat + rebuild; testy eager.

## File Structure
```
backend/obskura/celery.py          # Celery app (NEW)
backend/obskura/__init__.py        # import celery_app (MODIFY)
backend/obskura/settings.py        # CELERY_* + CELERY_BEAT_SCHEDULE (MODIFY)
backend/core/tasks.py              # send_email_task (NEW)
backend/newsletter/tasks.py        # send_campaign_task (NEW)
backend/newsletter/management/commands/send_campaign.py  (NEW)
backend/newsletter/admin.py        # campaign send action (MODIFY)
backend/support/services.py        # create_ticket -> send_email_task.delay (MODIFY)
backend/newsletter/services.py     # subscribe -> send_email_task.delay (MODIFY)
backend/membership/tasks.py        # expire_subscriptions, cleanup_stale_pending (NEW)
backend/events/tasks.py            # cleanup_stale_registrations (NEW)
backend/playback/tasks.py          # recompute_all_ratings (NEW)
backend/conftest.py                # celery eager autouse fixture (MODIFY)
backend/requirements/base.txt      # celery[redis] (MODIFY)
backend/docker-compose.yml         # worker + beat services (MODIFY)
backend/<app>/tests/test_tasks*.py (NEW)
```

---

### Task 1: Celery scaffold + send_email_task + compose

**Files:** Create `backend/obskura/celery.py`, `backend/core/tasks.py`, `backend/core/tests/test_tasks.py`; Modify `backend/obskura/__init__.py`, `backend/obskura/settings.py`, `backend/conftest.py`, `backend/requirements/base.txt`, `backend/docker-compose.yml`.

- [ ] **Step 1: failing test** `backend/core/tests/test_tasks.py`:
```python
def test_send_email_task_calls_core_email(monkeypatch):
    captured = {}
    monkeypatch.setattr(
        "core.email.send_email",
        lambda **kw: captured.update(kw) or "email_x",
    )
    from core.tasks import send_email_task

    rid = send_email_task.delay(
        to="x@example.com", subject="Temat", html="<p>h</p>", reply_to="r@example.com"
    ).get()
    assert rid == "email_x"
    assert captured["to"] == "x@example.com"
    assert captured["reply_to"] == "r@example.com"
```
Run: `docker compose run --rm web pytest core/tests/test_tasks.py -q` → FAIL (no celery / no task).

- [ ] **Step 2: `backend/obskura/celery.py`:**
```python
import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")

app = Celery("obskura")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
```

- [ ] **Step 3: `backend/obskura/__init__.py`** — replace contents with:
```python
from .celery import app as celery_app

__all__ = ("celery_app",)
```

- [ ] **Step 4: settings.** Add at top with other imports: `from celery.schedules import crontab`. Append a Celery block:
```python
# --- Celery (async) ---
CELERY_BROKER_URL = env(
    "CELERY_BROKER_URL",
    default=f"redis://{env('REDIS_HOST', default='redis')}:{env('REDIS_PORT', default='6379')}/1",
)
CELERY_TASK_IGNORE_RESULT = True
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=False)
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_TIMEZONE = TIME_ZONE
# CELERY_BEAT_SCHEDULE jest dopełniany w Tasku 5 (komplet jobów).
CELERY_BEAT_SCHEDULE: dict = {}
```
> `crontab` import is used by the schedule added in Task 5; importing it now is harmless. If ruff flags it unused until Task 5, add the schedule entry in Task 5 (same file) — keep the import.
(Practical: add `from celery.schedules import crontab` in Task 5 together with the schedule to avoid an interim unused-import; OR add a `# noqa: F401` now. Plan uses: add the import in Task 5.)

- [ ] **Step 5: `backend/core/tasks.py`:**
```python
from celery import shared_task


@shared_task
def send_email_task(to, subject, html, reply_to=None):
    """Async wrapper na core.email.send_email (fire-and-forget; treść w argumentach)."""
    from core.email import send_email

    return send_email(to=to, subject=subject, html=html, reply_to=reply_to)
```

- [ ] **Step 6: conftest eager fixture.** In `backend/conftest.py` add (alongside the existing clear_cache fixture):
```python
@pytest.fixture(autouse=True)
def _celery_eager(settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = True
    from obskura.celery import app

    app.conf.task_always_eager = True
    app.conf.task_eager_propagates = True
```
(Ensure `import pytest` present at top of conftest.)

- [ ] **Step 7: requirements + compose.** Append `celery[redis]~=5.4` to `backend/requirements/base.txt`. Install into running container: `docker compose run --rm web pip install "celery[redis]~=5.4"`. Add to `backend/docker-compose.yml` (mirror the `web` service's `build`/`volumes`/`env_file`/`depends_on`, no ports):
```yaml
  worker:
    build: .
    command: celery -A obskura worker -l info
    volumes:
      - .:/app
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  beat:
    build: .
    command: celery -A obskura beat -l info
    volumes:
      - .:/app
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
```

- [ ] **Step 8: run + lint + commit.**
```bash
docker compose run --rm web pytest core/tests/test_tasks.py -q
docker compose run --rm web pytest -q   # full suite green under eager
docker compose run --rm web ruff format core obskura && docker compose run --rm web ruff check .
docker compose run --rm web python manage.py check
git add backend && git commit -m "feat(backend): Celery app, send_email_task, eager test config and worker/beat compose (B7a)"
```

---

### Task 2: Async email refactor

**Files:** Modify `backend/support/services.py`, `backend/newsletter/services.py`; tests `backend/support/tests/test_tickets.py` + `backend/newsletter/tests/test_newsletter.py` stay green (eager).

- [ ] **Step 1:** In `support/services.py` `create_ticket`, replace the two `send_email(...)` calls with task enqueues (keep content identical):
```python
from core.tasks import send_email_task  # top-level import

# ... inside create_ticket, after Ticket.objects.create(...):
send_email_task.delay(
    to=email,
    subject="Otrzymaliśmy Twoje zgłoszenie — OBSKURA",
    html=(f"<p>Cześć {name},</p><p>Dziękujemy za kontakt. Odpiszemy najszybciej, jak się da.</p>"),
)
if settings.SUPPORT_NOTIFY_EMAIL:
    send_email_task.delay(
        to=settings.SUPPORT_NOTIFY_EMAIL,
        reply_to=email,
        subject=f"[Support] {category} — {name}",
        html=f"<p>Od: {name} &lt;{email}&gt;</p><p>Kategoria: {category}</p><p>{message}</p>",
    )
```
Remove the old `from core.email import send_email` import from services.py if now unused.

- [ ] **Step 2:** In `newsletter/services.py` `subscribe`, replace the `send_email(...)` welcome call with:
```python
from core.tasks import send_email_task  # top-level import

# ... after update_or_create:
send_email_task.delay(
    to=email,
    subject="Witaj w newsletterze OBSKURY",
    html="<p>Zapis potwierdzony. Do usłyszenia w ciemności.</p>",
)
```

- [ ] **Step 3:** The existing ticket/newsletter tests mock `core.email.send_email` and assert it was called. Under eager, `send_email_task.delay` runs inline → the task body calls `core.email.send_email` → mock still hit. Run them:
```bash
docker compose run --rm web pytest support/tests/test_tickets.py newsletter/tests/test_newsletter.py -q
```
Expected: GREEN unchanged. If a test patched `support.services.send_email` (module-local) instead of `core.email.send_email`, update the patch target to `core.email.send_email`.

- [ ] **Step 4: full suite + commit.**
```bash
docker compose run --rm web pytest -q && docker compose run --rm web ruff check support newsletter
git add backend/support backend/newsletter && git commit -m "feat(backend): send ticket and welcome emails asynchronously via Celery (B7a)"
```

---

### Task 3: Bulk newsletter — send_campaign_task + command + admin action

**Files:** Create `backend/newsletter/tasks.py`, `backend/newsletter/management/commands/send_campaign.py`, `backend/newsletter/tests/test_send_campaign.py`; Modify `backend/newsletter/admin.py`.

- [ ] **Step 1: failing test** `test_send_campaign.py` (mock `core.email.send_email`): create active Campaign (code "newsletter") + 3 active Subscriber + 1 inactive; `send_campaign_task("newsletter")` → 3 emails (inactive skipped); `freq` filter limits; unknown/inactive campaign → 0.

- [ ] **Step 2: `newsletter/tasks.py`:**
```python
from celery import shared_task


@shared_task
def send_campaign_task(campaign_code, freq=None):
    """Bulk: enqueue welcome/campaign email do każdego aktywnego subskrybenta."""
    from core.tasks import send_email_task
    from newsletter.models import Campaign, Subscriber

    campaign = Campaign.objects.filter(code=campaign_code, is_active=True).first()
    if campaign is None:
        return 0
    subs = Subscriber.objects.filter(is_active=True)
    if freq:
        subs = subs.filter(freq=freq)
    count = 0
    for sub in subs.iterator():
        send_email_task.delay(
            to=sub.email,
            subject=campaign.label,
            html=f"<p>{campaign.purpose or campaign.label}</p>",
        )
        count += 1
    return count
```

- [ ] **Step 3: management command** `newsletter/management/commands/send_campaign.py`:
```python
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
```

- [ ] **Step 4: admin action.** In `newsletter/admin.py` add to `CampaignAdmin` an action:
```python
from django.contrib import messages

from newsletter.tasks import send_campaign_task


@admin.action(description="Wyślij kampanię do aktywnych subskrybentów")
def send_to_subscribers(modeladmin, request, queryset):
    total = 0
    for campaign in queryset:
        total += send_campaign_task.delay(campaign.code).get() or 0
    messages.success(request, f"Zakolejkowano {total} wiadomości.")
```
Register `actions = [send_to_subscribers]` on `CampaignAdmin`.
> `.get()` works under eager; in production the admin action would not block — acceptable for B7a (note: future hardening = fire-and-forget without `.get()`).

- [ ] **Step 5: run + commit.**
```bash
docker compose run --rm web pytest newsletter -q && docker compose run --rm web ruff check newsletter
git add backend/newsletter && git commit -m "feat(newsletter): bulk campaign send task with command and admin action (B7a)"
```

---

### Task 4: Periodic membership tasks

**Files:** Create `backend/membership/tasks.py`, `backend/membership/tests/test_tasks.py`.

- [ ] **Step 1: failing tests** (`test_tasks.py`): `expire_subscriptions` — active sub with past period_end → EXPIRED; active with future period_end stays; trialing past → EXPIRED. `cleanup_stale_pending` — incomplete subscription older than 24h → EXPIRED; pending patronage older than 24h → CANCELED; fresh ones stay. (Set "old" timestamp via `Model.objects.filter(pk=...).update(created_at=...)` to bypass auto_now_add.)

- [ ] **Step 2: `membership/tasks.py`:**
```python
from datetime import timedelta

from celery import shared_task
from django.utils import timezone


@shared_task
def expire_subscriptions():
    from membership.models import Subscription, SubStatus

    return Subscription.objects.filter(
        status__in=[SubStatus.TRIALING, SubStatus.ACTIVE],
        period_end__isnull=False,
        period_end__lt=timezone.now(),
    ).update(status=SubStatus.EXPIRED)


@shared_task
def cleanup_stale_pending():
    from membership.models import Patronage, PatronageStatus, Subscription, SubStatus

    cutoff = timezone.now() - timedelta(hours=24)
    subs = Subscription.objects.filter(
        status=SubStatus.INCOMPLETE, created_at__lt=cutoff
    ).update(status=SubStatus.EXPIRED)
    pats = Patronage.objects.filter(
        status=PatronageStatus.PENDING, created_at__lt=cutoff
    ).update(status=PatronageStatus.CANCELED)
    return {"subscriptions": subs, "patronages": pats}
```
> `.update()` nie odpala signali — to OK: te przejścia nie mają denormalizowanych liczników (seats patronów liczą tylko PAID; entitlement czyta status live).

- [ ] **Step 3: run + commit.**
```bash
docker compose run --rm web pytest membership/tests/test_tasks.py -q && docker compose run --rm web ruff check membership
git add backend/membership && git commit -m "feat(membership): periodic expire_subscriptions and cleanup_stale_pending tasks (B7a)"
```

---

### Task 5: events/playback periodic + beat schedule

**Files:** Create `backend/events/tasks.py`, `backend/playback/tasks.py`, `backend/events/tests/test_tasks.py`, `backend/playback/tests/test_tasks.py`; Modify `backend/obskura/settings.py` (CELERY_BEAT_SCHEDULE).

- [ ] **Step 1: failing tests** — `events.cleanup_stale_registrations`: pending registration older than 24h → CANCELED; fresh stays; confirmed untouched. `playback.recompute_all_ratings`: episode with ratings → rating_avg = Avg(value); manually corrupt rating_avg then run → healed; episode with no ratings → 0.

- [ ] **Step 2: `backend/events/tasks.py`:**
```python
from datetime import timedelta

from celery import shared_task
from django.utils import timezone


@shared_task
def cleanup_stale_registrations():
    from events.models import RegStatus, Registration

    cutoff = timezone.now() - timedelta(hours=24)
    return Registration.objects.filter(
        status=RegStatus.PENDING, created_at__lt=cutoff
    ).update(status=RegStatus.CANCELED)
```

- [ ] **Step 3: `backend/playback/tasks.py`:**
```python
from celery import shared_task
from django.db.models import Avg


@shared_task
def recompute_all_ratings():
    """Self-heal: przelicz Episode.rating_avg z ocen (defensywnie wobec driftu)."""
    from catalog.models import Episode
    from playback.models import Rating

    count = 0
    for pk in Episode.all_objects.values_list("pk", flat=True):
        agg = Rating.objects.filter(episode_id=pk).aggregate(avg=Avg("value"))
        Episode.all_objects.filter(pk=pk).update(rating_avg=round(agg["avg"] or 0, 2))
        count += 1
    return count
```

- [ ] **Step 4: beat schedule.** In `backend/obskura/settings.py` add `from celery.schedules import crontab` (top) and replace `CELERY_BEAT_SCHEDULE: dict = {}` with:
```python
CELERY_BEAT_SCHEDULE = {
    "expire-subscriptions": {
        "task": "membership.tasks.expire_subscriptions",
        "schedule": crontab(hour=3, minute=0),
    },
    "cleanup-stale-pending": {
        "task": "membership.tasks.cleanup_stale_pending",
        "schedule": crontab(minute=0),  # co godzinę
    },
    "cleanup-stale-registrations": {
        "task": "events.tasks.cleanup_stale_registrations",
        "schedule": crontab(minute=0),  # co godzinę
    },
    "recompute-all-ratings": {
        "task": "playback.tasks.recompute_all_ratings",
        "schedule": crontab(hour=4, minute=0),
    },
}
```

- [ ] **Step 5: run + commit.**
```bash
docker compose run --rm web pytest events/tests/test_tasks.py playback/tests/test_tasks.py -q
docker compose run --rm web python manage.py check
git add backend && git commit -m "feat(backend): events/playback periodic tasks and Celery beat schedule (B7a)"
```

---

### Task 6: Final gate

- [ ] **Step 1:** Full `docker compose run --rm web pytest -q` GREEN (all tasks + untouched suite under eager). `ruff check .` + `ruff format --check .` clean. `python manage.py check` clean. `makemigrations --check --dry-run` = "No changes detected" (B7a adds no models).
- [ ] **Step 2 (best-effort, post-rebuild, poza CI):** `docker compose build web worker beat` then `docker compose run --rm web celery -A obskura inspect registered` (or `worker --version`) to confirm Celery sees the 6 tasks. If image rebuild is out of scope here, note it.
- [ ] **Step 3: commit** anything outstanding (e.g., a `## Notatka` in README backend on running worker/beat) `docs(backend): note Celery worker/beat run commands (B7a)` (optional).

---

## Definition of Done (B7a)
- [ ] Pełny `pytest` zielony pod eager (nowe taski + niezłamana reszta — 432+).
- [ ] `ruff check .` / `ruff format --check .` / `manage.py check` / `makemigrations --check --dry-run` czyste.
- [ ] `send_email_task` używany przez ticket/welcome; `send_campaign_task` + command + admin action; 4 periodic taski + kompletny `CELERY_BEAT_SCHEDULE`.
- [ ] docker-compose ma `worker` + `beat`; `celery[redis]` w requirements.
- [ ] Commit per task, EN, bez Co-Authored-By.

**Następna faza:** B7b — Channels (ASGI ProtocolTypeRouter, channels-redis, `notifications` app + per-user WS consumer, live-status broadcast).
