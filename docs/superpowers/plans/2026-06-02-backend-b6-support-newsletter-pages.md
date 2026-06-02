# Faza B6 — Support + Newsletter + Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build three small content/comms apps — `support` (FAQ + contact tickets with Resend email), `newsletter` (single opt-in subscriber + read-only campaign templates), `pages` (versioned legal docs + press items) — mirroring the existing frontend Zod contracts.

**Architecture:** Three Django apps + a shared `core/email.py` Resend wrapper (lazy SDK, no-op without key, monkeypatched in tests). Public reads cached; public POSTs (ticket, subscribe) scoped-throttled. Write serializers mirror `src/lib/formSchemas.js` (`contactSchema`, `newsletterSchema`).

**Tech Stack:** Django 5.2, DRF 3.15, django-redis, `resend`, pytest + factory_boy.

> **Konwencje:** commity ENGLISH, bez Co-Authored-By; branch `feat/backend-b6`; testy w kontenerze (`docker compose run --rm web pytest`); `ruff check`+`ruff format` czyste przed commitem; migracje per app. Pełny kontekst: [`docs/superpowers/specs/2026-06-02-backend-b6-support-newsletter-pages-design.md`](../specs/2026-06-02-backend-b6-support-newsletter-pages-design.md). **Modele — dokładne pola w §4 specu.**

---

## Decyzje projektowe (rozstrzygnięte)
1. Jeden łączony B6 (3 appy), wspólny `core/email.py`.
2. Newsletter single opt-in (consent + zapis + welcome).
3. Kampanie = read-only katalog (Campaign); bulk-send/`Send` → B7.
4. Resend wrapper + mock w testach; klucz z obskura-media.
5. Konwencje 1:1 jak B4/B5.

## File Structure
```
backend/core/email.py                  # Resend wrapper (NEW)
backend/support/   (models, selectors, services, serializers, views, urls, signals, admin, management/commands/seed_support.py, tests)
backend/newsletter/ (j.w. + seed_newsletter)
backend/pages/      (j.w. + seed_pages)
Touched: backend/obskura/settings.py (INSTALLED_APPS, RESEND_*, throttle scopes), backend/obskura/urls.py (3 include), backend/requirements/base.txt (resend)
```

---

### Task 1: Scaffold 3 apps + core/email.py + settings

**Files:** Create app skeletons for `support`, `newsletter`, `pages` (each: `__init__.py`, `apps.py` z `ready()` importującym signals, puste `models/selectors/services/serializers/views/signals/admin.py`, `urls.py` z `urlpatterns=[]`, `migrations/__init__.py`, `tests/__init__.py`); Create `backend/core/email.py`; Modify `backend/obskura/settings.py`, `backend/obskura/urls.py`, `backend/requirements/base.txt`; Test `backend/core/tests/test_email.py` (+ a scaffold test per app or one shared).

- [ ] **Step 1: Failing tests.** `backend/core/tests/test_email.py`:
```python
import pytest
from core import email


def test_send_email_noop_without_key(settings, monkeypatch):
    settings.RESEND_API_KEY = ""
    # brak klucza -> None, bez importu/wywołania resend
    assert email.send_email(to="x@example.com", subject="s", html="<p>h</p>") is None


def test_send_email_uses_resend_with_key(settings, monkeypatch):
    settings.RESEND_API_KEY = "re_test"
    settings.DEFAULT_FROM_EMAIL = "OBSKURA <noreply@obskura.audio>"
    sent = {}

    class _FakeEmails:
        @staticmethod
        def send(params):
            sent.update(params)
            return {"id": "email_1"}

    import sys
    import types

    fake = types.ModuleType("resend")
    fake.Emails = _FakeEmails
    fake.api_key = None
    monkeypatch.setitem(sys.modules, "resend", fake)

    rid = email.send_email(to="x@example.com", subject="Temat", html="<p>h</p>", reply_to="r@example.com")
    assert rid == "email_1"
    assert sent["to"] == ["x@example.com"]
    assert sent["reply_to"] == "r@example.com"
    assert sent["from"] == "OBSKURA <noreply@obskura.audio>"
```
Add per-app scaffold assertions (app installed, urls importable) — one small `tests/test_scaffold.py` per app.

Run: `docker compose run --rm web pytest core/tests/test_email.py -q` → FAIL.

- [ ] **Step 2: app skeletons.** For each of `support`, `newsletter`, `pages`: `apps.py` mirrors membership (`<Name>Config`, `default_auto_field`, `ready()` → `from <app> import signals`). Empty placeholder modules + `urls.py` with `urlpatterns = []`.

- [ ] **Step 3: `backend/core/email.py`:**
```python
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def send_email(*, to, subject, html, reply_to=None):
    """Cienki wrapper Resend. No-op (None) gdy brak RESEND_API_KEY (dev/test/CI bez klucza).
    Wszystkie maile aplikacji przechodzą tędy; w testach monkeypatchowane."""
    if not settings.RESEND_API_KEY:
        logger.info("Resend pominięty (brak klucza): to=%s subject=%s", to, subject)
        return None
    import resend  # noqa: PLC0415 — leniwy import (pakiet/klucz mogą być nieobecne)

    resend.api_key = settings.RESEND_API_KEY
    params = {
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": [to] if isinstance(to, str) else list(to),
        "subject": subject,
        "html": html,
    }
    if reply_to:
        params["reply_to"] = reply_to
    result = resend.Emails.send(params)
    if isinstance(result, dict):
        return result.get("id")
    return getattr(result, "id", None)
```
Create `backend/core/tests/__init__.py` if missing.

- [ ] **Step 4: settings.** Add `"support"`, `"newsletter"`, `"pages"` to INSTALLED_APPS local block (after `"events"`). Add (env-based):
```python
RESEND_API_KEY = env("RESEND_API_KEY", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="OBSKURA <noreply@obskura.audio>")
SUPPORT_NOTIFY_EMAIL = env("SUPPORT_NOTIFY_EMAIL", default="")
```
Add throttle scopes to `DEFAULT_THROTTLE_RATES` (obok register/login): `"contact": "10/hour"`, `"newsletter": "10/hour"`.

- [ ] **Step 5: urls + requirements.** In `obskura/urls.py` add `path("api/v1/", include("support.urls"))`, `...("newsletter.urls")`, `...("pages.urls")`. In `requirements/base.txt` append `resend~=2.0`. Install into container: `docker compose run --rm web pip install "resend~=2.0"`.

- [ ] **Step 6: run + lint + commit.**
```bash
docker compose run --rm web pytest core/tests/test_email.py support newsletter pages -q
docker compose run --rm web ruff format core support newsletter pages && docker compose run --rm web ruff check . && docker compose run --rm web python manage.py check
git add backend && git commit -m "feat(backend): scaffold support/newsletter/pages apps and core Resend email wrapper (B6)"
```
> `resend` import jest leniwy → brak pakietu nie psuje importu `core.email`; testy mockują. Jeśli pakiet nie zainstaluje się w obrazie, no-op path i tak działa bez niego.

---

### Task 2: pages — LegalDoc/PressItem + read endpoints + seed

**Files:** `pages/models.py`, `pages/selectors.py`, `pages/serializers.py`, `pages/views.py`, `pages/urls.py`, `pages/signals.py`, `pages/migrations/0001_initial.py`, `pages/management/commands/seed_pages.py`, `pages/tests/{factories,test_models,test_api,test_seed}.py`.

- [ ] **Step 1: failing tests** — LegalDoc partial-unique (2 `is_current=True` per kind → IntegrityError); `GET /pages/legal` lists current docs; `GET /pages/legal/{kind}` returns current (404 unknown kind/none); `GET /pages/press` lists active ordered; cache; seed idempotent.

- [ ] **Step 2: models** — `LegalKind` + `LegalDoc` + `PressItem` per spec §4. `LegalDoc.Meta.constraints=[UniqueConstraint(fields=["kind"], condition=Q(is_current=True), name="uniq_current_legaldoc_per_kind")]`. `PressItem.Meta.ordering=["order"]`. makemigrations pages.

- [ ] **Step 3: selectors** — `current_legal()` (LegalDoc filter is_current=True), `legal_by_kind(*, kind)` (is_current=True, kind=kind → first), `press_items()` (is_active=True order by order); `*_cached` for legal+press under `pages:legal`/`pages:press`.

- [ ] **Step 4: serializers + views + urls** — `LegalDocSerializer` (kind, version, body, published_at), `PressItemSerializer` (source, quote, author, url, order). Views: `LegalListView` (GET `/pages/legal`, AllowAny, cached), `LegalDetailView` (GET `/pages/legal/<slug:kind>`, 404 if none), `PressView` (GET `/pages/press`, cached). `urls.py` explicit paths.

- [ ] **Step 5: signals** — invalidate `pages:legal`/`pages:press` on LegalDoc/PressItem save/delete (delete_pattern + fallback).

- [ ] **Step 6: seed_pages** — idempotent `update_or_create`: 3 LegalDoc (kinds prywatnosc/regulamin/cookies, version "4.2.1", body placeholder/short text from `src/pages/Legal.jsx`, published_at now, is_current=True) + a few PressItem from `src/pages/Press.jsx` (the `cov*` quotes: source + quote + author). Read those files for content.

- [ ] **Step 7: run + commit** `feat(pages): legal docs and press read endpoints with seed (B6)`.

---

### Task 3: support FAQ — read endpoint + seed

**Files:** `support/models.py` (FaqCategory, FaqItem — Ticket added in Task 4), `support/selectors.py`, `support/serializers.py`, `support/views.py`, `support/urls.py`, `support/signals.py`, migration, `support/management/commands/seed_support.py`, tests.

- [ ] **Step 1: failing tests** — `GET /support/faq` returns active categories with nested active items (ordered); `?category=<slug>` filters; cache; N+1 guard (prefetch items); seed idempotent.

- [ ] **Step 2: models** — `FaqCategory` + `FaqItem` per spec §4 (FaqItem.category PROTECT related_name="items"). makemigrations support.

- [ ] **Step 3: selectors** — `faq(*, category=None)`: `FaqCategory.objects.filter(is_active=True).prefetch_related(Prefetch("items", queryset=FaqItem.objects.filter(is_active=True).order_by("order")))`; filter by category slug; `faq_cached(*, category=None)` keyed `support:faq[:<cat>]`.

- [ ] **Step 4: serializers + views + urls** — `FaqItemSerializer` (question, answer, order), `FaqCategorySerializer` (name, slug, order, `items` nested). `FaqView` (GET `/support/faq`, AllowAny, cached, `?category=`). urls path.

- [ ] **Step 5: signals** — invalidate `support:faq*` on FaqCategory/FaqItem save/delete.

- [ ] **Step 6: seed_support** — categories + FAQ items from `src/pages/Support.jsx` (the `faqN_q`/`faqN_a` defaults). Idempotent.

- [ ] **Step 7: run + commit** `feat(support): FAQ read endpoint with seed (B6)`.

---

### Task 4: support tickets — create + Resend + throttle

**Files:** `support/models.py` (add Ticket), `support/services.py`, `support/serializers.py` (add TicketWriteSerializer), `support/views.py` (add TicketCreateView), `support/urls.py`, migration (Ticket), `support/tests/test_tickets.py`.

- [ ] **Step 1: failing tests** (mock `core.email.send_email`): POST valid → 201 + Ticket row + ack email to user + notify email when `SUPPORT_NOTIFY_EMAIL` set (capture send_email calls); name<2 → 400; message<10 → 400; bad email → 400; category empty → 400; throttle scope present.

- [ ] **Step 2: Ticket model** (per spec §4) + makemigrations support.

- [ ] **Step 3: TicketWriteSerializer** (mirror `contactSchema`):
```python
from rest_framework import serializers


class TicketWriteSerializer(serializers.Serializer):
    name = serializers.CharField(
        min_length=2, max_length=60,
        error_messages={"min_length": "Imię jest wymagane.", "blank": "Imię jest wymagane."},
    )
    email = serializers.EmailField(error_messages={"invalid": "Nieprawidłowy adres e-mail."})
    category = serializers.CharField(
        min_length=1, max_length=40, error_messages={"blank": "Wybierz kategorię."}
    )
    message = serializers.CharField(
        min_length=10, max_length=5000,
        error_messages={"min_length": "Wiadomość musi mieć min. 10 znaków."},
    )
```

- [ ] **Step 4: services.create_ticket:**
```python
from django.conf import settings
from django.db import transaction

from support.models import Ticket


@transaction.atomic
def create_ticket(*, name, email, category, message):
    ticket = Ticket.objects.create(name=name, email=email, category=category, message=message)
    from core.email import send_email

    send_email(
        to=email,
        subject="Otrzymaliśmy Twoje zgłoszenie — OBSKURA",
        html=f"<p>Cześć {name},</p><p>Dziękujemy za kontakt. Odpiszemy najszybciej, jak się da.</p>",
    )
    if settings.SUPPORT_NOTIFY_EMAIL:
        send_email(
            to=settings.SUPPORT_NOTIFY_EMAIL,
            reply_to=email,
            subject=f"[Support] {category} — {name}",
            html=f"<p>Od: {name} &lt;{email}&gt;</p><p>Kategoria: {category}</p><p>{message}</p>",
        )
    return ticket
```

- [ ] **Step 5: view + url:**
```python
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from support import services
from support.serializers import TicketWriteSerializer


class TicketCreateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request):
        s = TicketWriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        services.create_ticket(**s.validated_data)
        return Response({"detail": "Zgłoszenie przyjęte."}, status=status.HTTP_201_CREATED)
```
Add `path("support/tickets", TicketCreateView.as_view(), name="support-tickets")`.

- [ ] **Step 6: run + commit** `feat(support): contact ticket endpoint with Resend notifications and throttle (B6)`.

---

### Task 5: newsletter — subscribe/unsubscribe + mailings + seed

**Files:** `newsletter/models.py` (Subscriber, Campaign), `newsletter/selectors.py`, `newsletter/services.py`, `newsletter/serializers.py`, `newsletter/views.py`, `newsletter/urls.py`, `newsletter/signals.py`, migration, `newsletter/management/commands/seed_newsletter.py`, tests.

- [ ] **Step 1: failing tests** (mock `core.email.send_email`): subscribe valid → 201 + Subscriber active + consent_at set + welcome email; consent False → 400; freq enum invalid → 400; duplicate email → reactivates same row (count stays 1); unsubscribe by token → is_active False; unsubscribe by email → ok; unknown → 404/ok=false; `GET /mailings` lists active campaigns (cache); throttle scope present; seed idempotent.

- [ ] **Step 2: models** — `Freq`, `CampaignTag`, `Subscriber` (unsubscribe_token via `secrets.token_urlsafe(32)` in save() if blank), `Campaign` per spec §4. makemigrations newsletter.

- [ ] **Step 3: serializers:**
```python
from rest_framework import serializers

from newsletter.models import Campaign, Freq


class SubscribeWriteSerializer(serializers.Serializer):
    email = serializers.EmailField(error_messages={"invalid": "Nieprawidłowy adres e-mail."})
    freq = serializers.ChoiceField(choices=Freq.choices, default=Freq.WEEK, required=False)
    consent = serializers.BooleanField()

    def validate_consent(self, value):
        if value is not True:
            raise serializers.ValidationError("Wymagana zgoda na otrzymywanie wiadomości.")
        return value


class UnsubscribeSerializer(serializers.Serializer):
    token = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)

    def validate(self, attrs):
        if not attrs.get("token") and not attrs.get("email"):
            raise serializers.ValidationError("Podaj token lub e-mail.")
        return attrs


class CampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["code", "label", "purpose", "freq_label", "tag", "order"]
        read_only_fields = fields
```

- [ ] **Step 4: services:**
```python
from django.db import transaction
from django.utils import timezone

from newsletter.models import Subscriber


@transaction.atomic
def subscribe(*, email, freq, consent):  # noqa: ARG001 — consent zweryfikowany w serializerze
    sub, _created = Subscriber.objects.update_or_create(
        email=email,
        defaults={"freq": freq, "consent_at": timezone.now(), "is_active": True},
    )
    from core.email import send_email

    send_email(
        to=email,
        subject="Witaj w newsletterze OBSKURY",
        html="<p>Zapis potwierdzony. Do usłyszenia w ciemności.</p>",
    )
    return sub


@transaction.atomic
def unsubscribe(*, token=None, email=None):
    sub = None
    if token:
        sub = Subscriber.objects.filter(unsubscribe_token=token).first()
    elif email:
        sub = Subscriber.objects.filter(email=email).first()
    if sub is None:
        return False
    if sub.is_active:
        sub.is_active = False
        sub.save(update_fields=["is_active", "updated_at"])
    return True
```

- [ ] **Step 5: selectors + views + urls** — `campaigns()` (is_active order by order) + `campaigns_cached()` (`newsletter:mailings`). Views: `SubscribeView` (POST, AllowAny, auth=[], ScopedRateThrottle scope `newsletter`, SubscribeWriteSerializer → services.subscribe → 201), `UnsubscribeView` (POST, AllowAny → services.unsubscribe → 200 ok / 404 not found), `MailingsView` (GET, AllowAny, cached → CampaignSerializer). urls: `newsletter/subscribe`, `newsletter/unsubscribe`, `mailings`.

- [ ] **Step 6: signals** — invalidate `newsletter:mailings` on Campaign save/delete.

- [ ] **Step 7: seed_newsletter** — 7 Campaign from `src/pages/Mailings.jsx` TEMPLATES (welcome/newsletter/premiere/reset/invoice/security/cancel — code, label, purpose, freq_label, tag). Idempotent.

- [ ] **Step 8: run + commit** `feat(newsletter): single opt-in subscribe/unsubscribe, mailings catalog and seed (B6)`.

---

### Task 6: Admin + final

**Files:** `support/admin.py`, `newsletter/admin.py`, `pages/admin.py`, `support/tests/test_seed.py` etc. if missing.

- [ ] **Step 1:** Register all models in their app admins with `list_display`/`list_filter`(status/tag/kind/is_active)/`search_fields`(email/name/question/source) + `prepopulated_fields` slug for FaqCategory + `list_select_related` for FaqItem.category + `date_hierarchy` for Ticket/Subscriber.

- [ ] **Step 2:** Full `docker compose run --rm web pytest -q` GREEN, `ruff check .`/`ruff format --check .`/`manage.py check`/`makemigrations --check --dry-run` clean.

- [ ] **Step 3: commit** `feat(backend): admin for support/newsletter/pages models (B6)`.

---

## Definition of Done (B6)
- [ ] Pełny `docker compose run --rm web pytest` zielony (3 appy + niezłamana reszta).
- [ ] `ruff check .` / `ruff format --check .` / `manage.py check` / `makemigrations --check --dry-run` czyste (wszystkie migracje zacommitowane).
- [ ] Endpointy §6: `/support/faq`, `/support/tickets`, `/newsletter/subscribe`, `/newsletter/unsubscribe`, `/mailings`, `/pages/legal[/{kind}]`, `/pages/press`.
- [ ] Walidacja lustro Zod (contact/newsletter); throttle `contact`/`newsletter`; email przez `core.email.send_email` (mock w testach, no-op bez klucza).
- [ ] LegalDoc partial-unique (1 bieżąca/kind); single opt-in + reaktywacja; seedy idempotentne.
- [ ] Commit per task, EN, bez Co-Authored-By.

**Następna faza:** B7 — Real-time + async (Channels, Celery: maile/kampanie bulk, narracja, statystyki).
