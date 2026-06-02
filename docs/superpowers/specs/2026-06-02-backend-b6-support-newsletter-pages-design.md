# Faza B6 — Support + Newsletter + Pages — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-02. Jeden łączony spec dla 3 małych appów (support, newsletter, pages) + wspólny wrapper email.
> Wzorzec: B4 membership / B5 community+events. Reuse wzorca seam-zewnętrzny (`payments.py` → tu `core/email.py` dla Resend).

---

## 1. Cel

Treści i komunikacja: **Support** (FAQ + zgłoszenia kontaktowe z mailem przez Resend), **Newsletter** (subskrypcja single opt-in + katalog szablonów maili), **Pages** (CMS: dokumenty prawne wersjonowane + cytaty prasy). Front już woła `submitContact('/api/contact')` i `subscribeNewsletter('/api/newsletter')` (Zod `contactSchema`/`newsletterSchema`) — serializery są lustrem tych schematów; przepięcie frontu na `/api/v1/` to faza B8.

## 2. Decyzje (rozstrzygnięte z userem)

1. **Jeden łączony B6** — 3 appy (support/newsletter/pages) w jednym specu/planie, taski pogrupowane per app, wspólny `core/email.py`.
2. **Newsletter = single opt-in** — zgoda (`consent: true`) + zapis od razu (`consent_at`), mail powitalny. Wypis przez `unsubscribe_token`/email.
3. **Kampanie = read-only katalog szablonów** (`Campaign`) dla `GET /mailings` + `Subscriber`. **Bez** masowej wysyłki — model `Send` i bulk → B7 (Celery).
4. **Resend = wrapper `core/email.py` + mock w testach** — klucz `RESEND_API_KEY` off-repo w obskura-media (jak Stripe). Bez klucza: kod kompletny, testy zielone (mock).
5. Konwencje 1:1 jak B4/B5: TimeStamped/SoftDelete, selectors/services/signals, split read/write serializery, Redis cache, ruff, pytest + factory_boy.

### Świadomie poza zakresem B6 (deferred)
- Masowa wysyłka kampanii + model `Send` → B7 (Celery).
- Double opt-in newsletter (token potwierdzenia).
- i18n treści prawnych/prasy (osobny task — zob. [[i18n_gap_legal_pages]] w pamięci).
- `States.jsx` / strona statusu systemów (frontendowy showcase, `core.HealthView` już istnieje).
- Faktury (`api/*` faktury) — osobno.

---

## 3. Architektura

Trzy nowe appy obok accounts/catalog/playback/membership/community/events. Warstwy jak w reszcie. Wspólny **`core/email.py`** — cienki wrapper Resend (lazy import SDK, czyta `settings.RESEND_API_KEY`); jedyne miejsce wywołań email, w testach monkeypatchowane. Żadnych zależności między support/newsletter/pages.

Touched (existing): `obskura/settings.py` (INSTALLED_APPS += support/newsletter/pages; `RESEND_API_KEY`/`DEFAULT_FROM_EMAIL`/`SUPPORT_NOTIFY_EMAIL` env; throttle scopes `contact`/`newsletter`), `obskura/urls.py` (3 include), `requirements/base.txt` (`resend`).

---

## 4. Model danych

### TextChoices
- support: `TicketStatus`: `OPEN="open"`, `IN_PROGRESS="in_progress"`, `RESOLVED="resolved"`, `CLOSED="closed"`.
- newsletter: `Freq`: `WEEK="week"`, `BIG="big"`, `MONTH="month"`. `CampaignTag`: `TRANSACTIONAL="transactional"`, `MARKETING="marketing"`, `NOTIFICATION="notification"`, `CRITICAL="critical"`.
- pages: `LegalKind`: `PRYWATNOSC="prywatnosc"`, `REGULAMIN="regulamin"`, `COOKIES="cookies"`.

### support
- `FaqCategory(TimeStampedModel)`: `name`(Char), `slug`(SlugField unique, pl_slugify), `order`(PositiveInt default 0), `is_active`(default True). Meta.ordering `["order"]`.
- `FaqItem(TimeStampedModel)`: `category`(FK FaqCategory PROTECT related_name="items"), `question`(Char), `answer`(TextField), `order`(PositiveInt default 0), `is_active`(default True). Meta.ordering `["order"]`.
- `Ticket(TimeStampedModel)`: `name`(Char max 60), `email`(EmailField), `category`(Char max 40), `message`(TextField), `status`(Char choices TicketStatus default OPEN). Index `["status","-created_at"]`.

### newsletter
- `Subscriber(TimeStampedModel)`: `email`(EmailField unique), `freq`(Char choices Freq default WEEK), `consent_at`(DateTimeField null), `is_active`(default True), `unsubscribe_token`(CharField max 64 unique — generowany `secrets.token_urlsafe` w save() jeśli pusty).
- `Campaign(TimeStampedModel)`: `code`(Char unique), `label`(Char), `purpose`(Char blank), `freq_label`(Char blank), `tag`(Char choices CampaignTag), `order`(PositiveInt default 0), `is_active`(default True). Read-only katalog. Meta.ordering `["order"]`.

### pages
- `LegalDoc(TimeStampedModel)`: `kind`(Char choices LegalKind), `version`(Char), `body`(TextField), `published_at`(DateTimeField), `is_current`(BooleanField default False). Constraint: `UniqueConstraint(fields=["kind"], condition=Q(is_current=True), name="uniq_current_legaldoc_per_kind")` — max jedna bieżąca wersja per kind.
- `PressItem(TimeStampedModel)`: `source`(Char), `quote`(TextField), `author`(Char blank), `url`(Char blank), `order`(PositiveInt default 0), `is_active`(default True). Meta.ordering `["order"]`.

---

## 5. Email (core/email.py — Resend)

`send_email(*, to, subject, html, reply_to=None) -> str|None` — lazy import `resend`, ustawia `resend.api_key = settings.RESEND_API_KEY`, woła `resend.Emails.send({...})`, zwraca id. Gdy klucz pusty → no-op zwracający None (dev/test bez klucza nie wybucha). Testy monkeypatchują `core.email.send_email`.

Wyższe helpery w serwisach appów:
- `support.services.create_ticket` → po zapisie: `send_email(to=ticket.email, ...ack...)` + `send_email(to=settings.SUPPORT_NOTIFY_EMAIL, reply_to=ticket.email, ...notyfikacja...)` (notyfikacja tylko gdy `SUPPORT_NOTIFY_EMAIL` ustawiony).
- `newsletter.services.subscribe` → `send_email(to=subscriber.email, ...welcome...)`.

Settings: `RESEND_API_KEY=env(default "")`, `DEFAULT_FROM_EMAIL=env(default "OBSKURA <noreply@obskura.audio>")`, `SUPPORT_NOTIFY_EMAIL=env(default "")`. `resend~=2.0` w requirements/base.txt.

---

## 6. API (`/api/v1/...`, bez trailing slash)

| Metoda | Ścieżka | Auth/Throttle | Uwagi |
|---|---|---|---|
| GET | `/support/faq?category=` | AllowAny, cache | kategorie z items (zagnieżdżone), filtr po slug kategorii |
| POST | `/support/tickets` | AllowAny, throttle `contact` 10/h | lustro contactSchema → Ticket + email ack/notify |
| POST | `/newsletter/subscribe` | AllowAny, throttle `newsletter` 10/h | lustro newsletterSchema → Subscriber single opt-in + welcome |
| POST | `/newsletter/unsubscribe` | AllowAny | `{token}` lub `{email}` → is_active=False |
| GET | `/mailings` | AllowAny, cache | read-only katalog Campaign |
| GET | `/pages/legal` | AllowAny, cache | lista kindów (bieżące wersje, bez body lub z body — z body) |
| GET | `/pages/legal/{kind}` | AllowAny, cache | bieżąca wersja danego kind (404 gdy brak) |
| GET | `/pages/press` | AllowAny, cache | aktywne PressItem |

**Serializery write (lustro Zod):**
- `TicketWriteSerializer`: `name`(min 2, max 60), `email`(EmailField), `category`(min 1, max 40), `message`(min 10, max 5000) — polskie komunikaty jak w Zod.
- `SubscribeWriteSerializer`: `email`(EmailField), `freq`(ChoiceField Freq, default WEEK, required=False), `consent`(BooleanField — `validate_consent` wymaga True, komunikat „Wymagana zgoda…").
- `UnsubscribeSerializer`: `token`(Char required=False), `email`(EmailField required=False) — `validate` wymaga co najmniej jednego.

Read serializery: `FaqCategorySerializer` (nested `items`), `CampaignSerializer`, `LegalDocSerializer`, `PressItemSerializer`. Throttle scopes `contact`/`newsletter` dodane do `DEFAULT_THROTTLE_RATES` (jak `register`/`login`), użyte przez `ScopedRateThrottle` na widokach POST.

---

## 7. Przepływy (services)

- `support.services.create_ticket(*, name, email, category, message) -> Ticket` (@transaction.atomic): zapis + email ack do usera + (opcjonalnie) notyfikacja na inbox.
- `newsletter.services.subscribe(*, email, freq, consent) -> Subscriber`: `update_or_create` po email (reaktywuje `is_active=False` → True), ustawia `freq`, `consent_at=now`, generuje token jeśli brak; welcome email. Zwraca subscriber.
- `newsletter.services.unsubscribe(*, token=None, email=None) -> bool`: znajdź po token lub email, `is_active=False`. Zwraca czy znaleziono.

## 8. Cache, seed, throttle

- Redis: `support:faq`, `newsletter:mailings`, `pages:legal`, `pages:press` (TTL 15m) — invalidacja signalem na zmianę odpowiednich modeli (fallback LocMemCache `delete_many`).
- Seedy (idempotentne update_or_create): `seed_support` (kategorie+FAQ z `src/pages/Support.jsx`), `seed_newsletter` (7 Campaign z `src/pages/Mailings.jsx`), `seed_pages` (LegalDoc privacy/tos/cookies z `Legal.jsx` + PressItem z `Press.jsx`).
- Throttle: `contact` 10/hour, `newsletter` 10/hour (ScopedRateThrottle) — anty-spam publicznych POST.

## 9. Testy (pytest + factory_boy, Resend mockowany)

Factories: FaqCategory/FaqItem/Ticket, Subscriber/Campaign, LegalDoc/PressItem. Mock `core.email.send_email`.
Pokrycie: faq read (nested, cache, filtr, N+1); ticket create (walidacja contactSchema: name<2 →400, message<10 →400, email zły →400; happy → Ticket + email ack+notify wywołane; throttle); newsletter subscribe (consent False →400, freq enum, happy → Subscriber + welcome; duplikat email → reaktywacja, nie duplikat; unsubscribe po token/email); mailings list (read-only, cache); legal current per kind (404 nieistniejący; partial-unique blokuje 2 bieżące); press list; seeds idempotentne; `core.email.send_email` no-op gdy brak klucza.

## 10. Zarys tasków (rozwinie writing-plans; commit per task, EN, bez Co-Authored-By)

1. Scaffold support/newsletter/pages + `core/email.py` + settings (INSTALLED_APPS, RESEND_*, throttle scopes) + urls + dep `resend`.
2. **pages**: LegalDoc/PressItem + read endpoints (`/pages/legal[/{kind}]`, `/pages/press`) + cache/signals + seed_pages.
3. **support FAQ**: FaqCategory/FaqItem + `/support/faq` (cache, nested) + seed_support FAQ.
4. **support tickets**: Ticket + `POST /support/tickets` (lustro contactSchema) + Resend ack/notify + throttle `contact`.
5. **newsletter**: Subscriber/Campaign + `POST /newsletter/subscribe` (single opt-in + welcome) + `/newsletter/unsubscribe` + `GET /mailings` + throttle `newsletter` + seed.
6. Admin (wszystkie modele) + final.

**Definition of Done (B6):** pełny `pytest` zielony (3 appy + niezłamana reszta), `ruff`/`format`/`check`/`makemigrations --check` czyste, endpointy z §6 działają (Resend mock), throttle/validation/email wywołania zgodne, seedy idempotentne.

**Następna faza:** B7 — Real-time + async (Channels: live stream status, push; Celery: maile/kampanie, narracja, statystyki).
