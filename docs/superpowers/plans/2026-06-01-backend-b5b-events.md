# Faza B5b — Events — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build the events domain (online/live/klan meetups) with capacity + waitlist registration, Klan-only gating via membership, paid tickets via Stripe (test mode), and membership-gated recordings.

**Architecture:** New `events` Django app mirroring catalog/playback/membership/community layering (models → selectors → services → thin APIViews). Reuses `membership.payments` (Stripe seam) and `membership.selectors` (entitlement + new `has_klan_access`). The paid-ticket webhook is the EXISTING `membership/stripe/webhook`, whose `mode=payment` branch dispatches by metadata (`patronage_id` → patronage, `registration_id` → events via lazy import). `seats_taken` denormalized by a Registration signal; events list Redis-cached.

**Tech Stack:** Django 5.2, DRF 3.15, django-rest-knox, PostgreSQL, django-redis, stripe (via membership.payments), pytest + factory_boy.

> **Konwencje:** commity ENGLISH, bez Co-Authored-By; branch `feat/backend-b5-events`; testy w kontenerze (`docker compose run --rm web pytest`); `ruff check`+`ruff format` czyste przed commitem; migracje `python manage.py makemigrations events`. Pełny kontekst: [`docs/superpowers/specs/2026-06-01-backend-b5b-events-design.md`](../specs/2026-06-01-backend-b5b-events-design.md). **Modele — dokładne pola w §4 specu.**

---

## Decyzje projektowe (rozstrzygnięte)

1. Capacity + waitlist; cancel auto-promuje najstarszego z listy rezerwowej.
2. Klan-gating: `mode=klan` wymaga planu **Klan** lub aktywnego patronatu (nie solo) — `membership.selectors.has_klan_access`.
3. Płatne bilety: reuse `membership.payments.create_payment_checkout`; webhook = rozszerzenie `membership.stripe.webhook` o `metadata.registration_id`.
4. Nagrania: `recording_url` gated przez `recording_access` (none/klub/klan) + entitlement.
5. Konwencje 1:1 jak B4/B5a.

## File Structure

```
backend/events/
├── __init__.py · apps.py (EventsConfig.ready -> signals)
├── models.py        # Event, Registration + EventMode/EventStatus/RegStatus/RecordingAccess
├── selectors.py     # events_list(_cached), event_detail, can_see_recording, user_registrations
├── services.py      # register_for_event, cancel_registration, confirm_paid_registration
├── signals.py       # Registration -> Event.seats_taken; Event -> cache invalidation
├── serializers.py   # EventList/EventDetail (seats_remaining, gated recording) + RegistrationRead
├── pagination.py    # EventCursorPagination (upcoming) + PastEventCursorPagination
├── views.py         # EventListView, EventDetailView, RegisterView, CancelRegistrationView, RegistrationsView
├── urls.py          # /api/v1/events/... (no trailing slash)
├── admin.py · migrations/ · management/commands/seed_events.py · tests/
Touched: backend/obskura/settings.py (+events), backend/obskura/urls.py (include),
         backend/membership/selectors.py (+has_klan_access),
         backend/membership/services.py (handle_webhook_event mode=payment dispatch by metadata)
```

---

### Task 1: Scaffold `events` + `has_klan_access`

**Files:**
- Create: `backend/events/__init__.py`, `apps.py`, `models.py`, `selectors.py`, `services.py`, `serializers.py`, `views.py`, `urls.py`, `signals.py`, `admin.py`, `migrations/__init__.py`, `tests/__init__.py`
- Modify: `backend/obskura/settings.py` (INSTALLED_APPS += `"events"` after `"community"`), `backend/obskura/urls.py` (`path("api/v1/", include("events.urls"))`)
- Modify: `backend/membership/selectors.py` (add `has_klan_access`)
- Test: `backend/events/tests/test_scaffold.py`, `backend/membership/tests/test_has_klan_access.py`

- [ ] **Step 1: Failing tests.** `test_scaffold.py`: app installed (`EventsConfig`), `events.urls.urlpatterns` is a list. `test_has_klan_access.py`:

```python
import pytest
from datetime import timedelta
from django.utils import timezone
from accounts.tests.factories import UserFactory
from membership.selectors import has_klan_access
from membership.models import PlanCode, SubStatus, PatronageStatus
from membership.tests.factories import PlanFactory, SubscriptionFactory, PatronageFactory, PatronTierFactory


@pytest.mark.django_db
def test_has_klan_access_solo_is_false():
    u = UserFactory()
    SubscriptionFactory(user=u, plan=PlanFactory(code=PlanCode.SOLO), status=SubStatus.ACTIVE,
                        period_end=timezone.now() + timedelta(days=30))
    assert has_klan_access(user=u) is False


@pytest.mark.django_db
def test_has_klan_access_klan_is_true():
    u = UserFactory()
    SubscriptionFactory(user=u, plan=PlanFactory(code=PlanCode.KLAN), status=SubStatus.ACTIVE,
                        period_end=timezone.now() + timedelta(days=30))
    assert has_klan_access(user=u) is True


@pytest.mark.django_db
def test_has_klan_access_patron_is_true():
    u = UserFactory()
    tier = PatronTierFactory(code="exec")
    PatronageFactory(user=u, tier=tier, status=PatronageStatus.PAID)
    assert has_klan_access(user=u) is True


@pytest.mark.django_db
def test_has_klan_access_anonymous_is_false():
    assert has_klan_access(user=None) is False
```

Run: `docker compose run --rm web pytest events/tests/test_scaffold.py membership/tests/test_has_klan_access.py -q` → FAIL.

- [ ] **Step 2: Scaffold package.** `events/__init__.py` empty. `events/apps.py`:

```python
from django.apps import AppConfig


class EventsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "events"

    def ready(self):
        from events import signals  # noqa: F401
```

Create empty placeholder modules `models.py`, `selectors.py`, `services.py`, `serializers.py`, `views.py`, `signals.py`, `admin.py` (each a one-line comment) and `migrations/__init__.py`, `tests/__init__.py` empty. `events/urls.py`:

```python
urlpatterns = []
```

- [ ] **Step 3: Register app + include urls.** In `backend/obskura/settings.py` add `"events"` to INSTALLED_APPS right after `"community"`. In `backend/obskura/urls.py` add `path("api/v1/", include("events.urls")),` after the community include.

- [ ] **Step 4: `has_klan_access` in `membership/selectors.py`.** Append (imports `PlanCode`, `PatronageStatus`, `Patronage` already present; `active_subscription`/`current_season` defined above in the file):

```python
def has_klan_access(*, user):
    """Pełny dostęp do treści Klanu: aktywna subskrypcja planu KLAN LUB aktywny
    patronat bieżącego sezonu (patron dostaje perki klanu). Solo NIE wystarcza."""
    if user is None or not getattr(user, "is_authenticated", False):
        return False
    sub = active_subscription(user=user)
    if sub is not None and sub.plan.code == PlanCode.KLAN:
        return True
    season = current_season()
    if season is not None:
        return Patronage.objects.filter(
            user=user, tier__season=season, status=PatronageStatus.PAID
        ).exists()
    return False
```

- [ ] **Step 5: Run tests (GREEN) + lint + commit.**

```bash
docker compose run --rm web pytest events/tests/test_scaffold.py membership/tests/test_has_klan_access.py -q
docker compose run --rm web ruff format events membership && docker compose run --rm web ruff check events membership
docker compose run --rm web python manage.py check
git add backend/events backend/obskura backend/membership && git commit -m "feat(events): app scaffold and membership.has_klan_access (B5b)"
```

---

### Task 2: Models Event/Registration + migration

**Files:** Modify `backend/events/models.py`; Create `backend/events/tests/factories.py`, `backend/events/tests/test_models.py`, `backend/events/migrations/0001_initial.py` (generated).

- [ ] **Step 1: Failing `test_models.py`** asserting: create Event (slug autogen via pl_slugify, is_free derived from price_pln, base_manager all_objects), create Registration, the partial unique constraint blocks a 2nd active registration for same (event,user) (IntegrityError), soft-delete on Event.

- [ ] **Step 2: Implement `events/models.py`** — the 4 TextChoices + Event + Registration EXACTLY per spec §4. Key points: `Event(TimeStampedModel, SoftDeleteModel)` with `Meta(base_manager_name="all_objects", indexes=[Index(["starts_at"]), Index(["mode","starts_at"]), Index(["status","starts_at"])])`; `slug` via `pl_slugify(self.title)` + numeric suffix on collision in `save()`; `is_free = self.price_pln == 0` set in `save()`. `Registration(TimeStampedModel)` with `Meta.constraints=[UniqueConstraint(fields=["event","user"], condition=Q(status__in=["pending","confirmed","waitlisted"]), name="uniq_active_registration_event_user")]`, `indexes=[Index(["event","status"])]`. FKs: `host` → `catalog.Creator` SET_NULL null blank related_name="hosted_events"; `Registration.event` CASCADE related_name="registrations"; `Registration.user` AUTH_USER_MODEL CASCADE related_name="event_registrations". Polish verbose_name.

- [ ] **Step 3: factories.py** — `EventFactory` (reuse `catalog.tests.factories.CreatorFactory` for host if it exists; else host=None; read catalog factories to confirm), `RegistrationFactory` (SubFactory UserFactory + EventFactory, status default CONFIRMED). `EventFactory` defaults: mode online, starts_at = future, capacity=None, price_pln=0, status PUBLISHED.

- [ ] **Step 4: makemigrations + run + commit.**

```bash
docker compose run --rm web python manage.py makemigrations events && docker compose run --rm web python manage.py migrate
docker compose run --rm web pytest events -q
git add backend/events && git commit -m "feat(events): Event and Registration models (B5b)"
```

---

### Task 3: Read — list + detail (cache, gated recording, pagination)

**Files:** Modify `events/selectors.py`, `events/serializers.py`, `events/views.py`, `events/urls.py`, `events/signals.py` (cache invalidation), Create `events/pagination.py`, `events/tests/test_read_api.py`.

- [ ] **Step 1: Failing `test_read_api.py`:** list public + only PUBLISHED + `?mode=` + `?when=upcoming|past` filters + N+1 guard; detail returns `seats_remaining` (capacity - seats_taken, null when capacity null); recording gating — `recording_access=none` → url present; `klub` → only entitlement.full_access user sees url (others get null); `klan` → only has_klan_access user.

- [ ] **Step 2: `events/pagination.py`:**

```python
from core.pagination import DefaultCursorPagination


class EventCursorPagination(DefaultCursorPagination):
    ordering = ("starts_at", "id")  # upcoming: soonest first


class PastEventCursorPagination(DefaultCursorPagination):
    ordering = ("-starts_at", "-id")  # past: most recent first
```

- [ ] **Step 3: `events/selectors.py`:**

```python
from django.core.cache import cache
from django.utils import timezone

from events.models import Event, EventStatus, RecordingAccess, RegStatus, Registration

CACHE_TTL = 60 * 15


def events_list(*, when=None, mode=None):
    qs = Event.objects.filter(status=EventStatus.PUBLISHED).select_related("host")
    now = timezone.now()
    if when == "past":
        qs = qs.filter(starts_at__lt=now)
    elif when == "upcoming":
        qs = qs.filter(starts_at__gte=now)
    if mode:
        qs = qs.filter(mode=mode)
    return qs


def events_list_cached(*, when=None, mode=None):
    key = f"events:list:{when or 'all'}:{mode or 'all'}"
    data = cache.get(key)
    if data is None:
        data = list(events_list(when=when, mode=mode))
        cache.set(key, data, CACHE_TTL)
    return data


def event_detail(*, slug):
    return (
        Event.objects.filter(status=EventStatus.PUBLISHED)
        .select_related("host")
        .filter(slug=slug)
        .first()
    )


def can_see_recording(*, user, event):
    if not event.recording_url:
        return False
    if event.recording_access == RecordingAccess.NONE:
        return True
    from membership.selectors import entitlement, has_klan_access

    if event.recording_access == RecordingAccess.KLAN:
        return has_klan_access(user=user)
    return entitlement(user=user)["full_access"]  # KLUB


def user_registrations(*, user):
    return (
        Registration.objects.filter(user=user)
        .exclude(status=RegStatus.CANCELED)
        .select_related("event", "event__host")
        .order_by("-created_at")
    )
```

- [ ] **Step 4: serializers** — `EventListSerializer` (slug,title,mode,starts_at,duration_minutes,host_name,cover_image,capacity,seats_taken,seats_remaining,price_pln,is_free,is_featured,status), `EventDetailSerializer` (+description, +`recording_url` via SerializerMethodField gated by `can_see_recording(viewer=request.user, event=obj)` → url or None, +`recording_access`). `host_name = host.name or ""`. `seats_remaining` method = `None if capacity is None else capacity - seats_taken`.

- [ ] **Step 5: views** — `EventListView(GET, AllowAny, OptionalTokenAuthentication)`: reads `?mode=`/`?when=`, validates mode/when (invalid → 400), paginates `events_list_cached` via `PastEventCursorPagination` when `when=="past"` else `EventCursorPagination`. `EventDetailView(GET, AllowAny, OptionalTokenAuthentication)`: `event_detail(slug)` or 404; pass `context={"request": request}` to serializer.

- [ ] **Step 6: urls (GET routes)** explicit `path("events", EventListView.as_view())`, `path("events/<slug:slug>", EventDetailView.as_view())`.

- [ ] **Step 7: signals cache invalidation** — `events/signals.py`: `@receiver([post_save, post_delete], sender=Event)` → `cache.delete_pattern("events:*")` with AttributeError fallback `cache.delete_many` over the known `events:list:{when}:{mode}` combos (`when ∈ {all,upcoming,past}`, `mode ∈ {all,online,live,klan}`).

- [ ] **Step 8: run + commit** `feat(events): cached event list/detail with gated recordings (B5b)`.

---

### Task 4: Register (free) + capacity + waitlist + cancel/promote + seats signal

**Files:** Modify `events/services.py`, `events/signals.py`, `events/views.py`, `events/urls.py`, `events/serializers.py` (RegistrationReadSerializer), Create `events/tests/test_register.py`.

- [ ] **Step 1: Failing `test_register.py`:** free register under capacity → CONFIRMED + seats_taken increments; at capacity → WAITLISTED (no seat); duplicate active registration → 400; cancel CONFIRMED → CANCELED + seat freed + oldest WAITLISTED promoted to CONFIRMED; cancel WAITLISTED → CANCELED (no promote); register requires auth (401); `GET /events/registrations` lists own non-canceled.

- [ ] **Step 2: `events/services.py` (free path + cancel):**

```python
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail, PermissionDenied, ValidationError

from events.models import Event, EventMode, EventStatus, RegStatus, Registration

_ACTIVE = [RegStatus.PENDING, RegStatus.CONFIRMED, RegStatus.WAITLISTED]


def _has_space(event):
    if event.capacity is None:
        return True
    confirmed = Registration.objects.filter(event=event, status=RegStatus.CONFIRMED).count()
    return confirmed < event.capacity


@transaction.atomic
def register_for_event(*, user, event):
    event = Event.objects.select_for_update().get(pk=event.pk)
    if event.status != EventStatus.PUBLISHED or event.starts_at <= timezone.now():
        raise ValidationError({"event": ErrorDetail("Zapisy zamknięte.", code="event_not_open")})
    if event.mode == EventMode.KLAN:
        from membership.selectors import has_klan_access

        if not has_klan_access(user=user):
            raise PermissionDenied(ErrorDetail("Event tylko dla Klanu.", code="klan_required"))
    if Registration.objects.filter(event=event, user=user, status__in=_ACTIVE).exists():
        raise ValidationError({"event": ErrorDetail("Masz już zapis.", code="already_registered")})

    if event.price_pln > 0:
        return _register_paid(user=user, event=event)

    status = RegStatus.CONFIRMED if _has_space(event) else RegStatus.WAITLISTED
    reg = Registration.objects.create(event=event, user=user, status=status)
    return {"status": status, "registration_id": reg.id}


@transaction.atomic
def cancel_registration(*, user, event):
    event = Event.objects.select_for_update().get(pk=event.pk)
    reg = Registration.objects.filter(event=event, user=user, status__in=_ACTIVE).first()
    if reg is None:
        return None
    was_confirmed = reg.status == RegStatus.CONFIRMED
    reg.status = RegStatus.CANCELED
    reg.save(update_fields=["status", "updated_at"])
    if was_confirmed:
        promote = (
            Registration.objects.filter(event=event, status=RegStatus.WAITLISTED)
            .order_by("created_at", "id")
            .first()
        )
        if promote is not None:
            promote.status = RegStatus.CONFIRMED
            promote.save(update_fields=["status", "updated_at"])
    return reg
```

(`_register_paid` lands in Task 5; for Task 4 add a temporary stub that raises `ValidationError({"event": "Płatne eventy w Tasku 5."})` so the free path/tests are isolated — Task 5 replaces it.)

- [ ] **Step 3: signal `recompute_seats`** in `events/signals.py`:

```python
@receiver([post_save, post_delete], sender=Registration)
def recompute_seats(sender, instance, **kwargs):
    count = Registration.objects.filter(
        event_id=instance.event_id, status=RegStatus.CONFIRMED
    ).count()
    Event.all_objects.filter(pk=instance.event_id).update(seats_taken=count)
```

(import Registration, RegStatus, Event in signals.)

- [ ] **Step 4: RegistrationReadSerializer** (event nested minimal: slug/title/starts_at/mode; status; created_at), views `RegisterView` (POST `events/<slug>/register`, IsAuthenticated → `event_detail`-style fetch incl. non-published? use `get_object_or_404(Event.objects, slug=slug, status=PUBLISHED)`; call `register_for_event`; return result, 201 if created/checkout else 200), `CancelRegistrationView` (POST `events/<slug>/cancel`), `RegistrationsView` (GET `events/registrations`, paginated own). urls: add the 3 routes (note: `events/registrations` must be registered BEFORE `events/<slug>` is irrelevant since paths differ, but register the static `registrations` path explicitly).

- [ ] **Step 5: run + commit** `feat(events): registration with capacity, waitlist and cancel-promote (B5b)`.

---

### Task 5: Klan-gating use + paid tickets (Stripe) + webhook dispatch

**Files:** Modify `events/services.py` (`_register_paid`, `confirm_paid_registration`), `backend/membership/services.py` (`handle_webhook_event` mode=payment dispatch), Create `events/tests/test_paid_and_gating.py`.

- [ ] **Step 1: Failing `test_paid_and_gating.py`** (Stripe monkeypatched): klan event → free/solo user 403 `klan_required`, klan/patron user OK; paid event register → returns `{checkout_url}` + Registration PENDING (no seat); paid event at capacity → 400 `event_full`; webhook `checkout.session.completed` mode=payment with `metadata.registration_id` → PENDING→CONFIRMED + seat; webhook when oversold → CANCELED; patronage webhook still works (regression).

- [ ] **Step 2: `_register_paid` + `confirm_paid_registration` in `events/services.py`:**

```python
@transaction.atomic
def _register_paid(*, user, event):
    if not _has_space(event):
        raise ValidationError({"event": ErrorDetail("Brak miejsc.", code="event_full")})
    reg = Registration.objects.create(event=event, user=user, status=RegStatus.PENDING)
    from membership import payments

    session = payments.create_payment_checkout(
        user=user,
        price_id=event.stripe_price_id,
        amount=event.price_pln,
        metadata={"registration_id": str(reg.id)},
    )
    reg.stripe_checkout_session_id = session.id
    reg.save(update_fields=["stripe_checkout_session_id", "updated_at"])
    return {"checkout_url": session.url}


@transaction.atomic
def confirm_paid_registration(*, registration_id, payment_intent=""):
    reg = Registration.objects.select_related("event").filter(pk=registration_id).first()
    if reg is None or reg.status != RegStatus.PENDING:
        return None
    event = Event.objects.select_for_update().get(pk=reg.event_id)
    if event.capacity is not None and (
        Registration.objects.filter(event=event, status=RegStatus.CONFIRMED).count()
        >= event.capacity
    ):
        reg.status = RegStatus.CANCELED  # oversold -> refund out-of-band (test mode)
        reg.save(update_fields=["status", "updated_at"])
        return reg
    reg.status = RegStatus.CONFIRMED
    if payment_intent:
        reg.stripe_payment_intent_id = payment_intent
    reg.save(update_fields=["status", "stripe_payment_intent_id", "updated_at"])
    return reg
```

Remove the Task-4 temporary stub.

- [ ] **Step 3: webhook dispatch in `backend/membership/services.py`.** Existing `handle_webhook_event` mode=payment branch reads:

```python
        if obj.get("mode") == "payment":
            _handle_patronage_paid(obj)
```

Replace with metadata-based dispatch (patronage vs event registration):

```python
        if obj.get("mode") == "payment":
            meta = obj.get("metadata") or {}
            if meta.get("registration_id"):
                from events.services import confirm_paid_registration

                confirm_paid_registration(
                    registration_id=meta["registration_id"],
                    payment_intent=obj.get("payment_intent") or "",
                )
            else:
                _handle_patronage_paid(obj)
```

- [ ] **Step 4: run full suite + commit** `feat(events): klan-gated and Stripe-paid registration with webhook confirmation (B5b)`.

---

### Task 6: Seed + admin

**Files:** Create `events/management/__init__.py`, `events/management/commands/__init__.py`, `events/management/commands/seed_events.py`, `events/tests/test_seed.py`; Modify `events/admin.py`.

- [ ] **Step 1: Failing `test_seed.py`:** `seed_events` creates a set of events (mix online/live/klan, one paid, one with capacity, one past with recording), idempotent (run twice → same count), at least one `mode=klan` and one `price_pln>0`.

- [ ] **Step 2: `seed_events.py`** — idempotent `update_or_create` keyed on slug, sourced from `src/pages/Events.jsx` (read it for titles/modes/dates/seats/prices; parse `seats` "X / Y" → capacity=Y, price from `seatsLabel` "NN zł"). Map mode online/live/klan; past events → `starts_at` in past + `recording_url` + `recording_access` (klub/klan per "NAGRANIE DLA KLUBU/KLANU").

- [ ] **Step 3: `events/admin.py`** — register Event + Registration with `list_display`/`list_filter`(mode,status,is_featured)/`search_fields`(title,slug) + `list_select_related`(host) + `autocomplete_fields`(host) + `prepopulated_fields={"slug":("title",)}` for Event.

- [ ] **Step 4: run seed twice + full suite + commit** `feat(events): seed_events command and Django admin (B5b)`.

---

## Definition of Done (B5b)

- [ ] Pełny `docker compose run --rm web pytest` zielony (events + niezłamana reszta).
- [ ] `ruff check .` / `ruff format --check .` / `python manage.py check` / `makemigrations --check --dry-run` czyste (migracja events zacommitowana).
- [ ] Endpointy §7: list (mode/when, cache), detail (seats_remaining, gated recording), register (free/waitlist/klan/paid), cancel (+promote), registrations.
- [ ] Gating: klan event → solo/free 403 `klan_required`; klan/patron OK. Recording gated none/klub/klan.
- [ ] Paid: register → checkout_url + PENDING; webhook → CONFIRMED + seat; oversold → canceled; patronage webhook nietknięty (regresja zielona).
- [ ] `seats_taken` denorm = liczba CONFIRMED; waitlist auto-promote przy cancel.
- [ ] Commit per task, EN, bez Co-Authored-By.

**Następna faza:** B6 — Support + Newsletter + Pages.
