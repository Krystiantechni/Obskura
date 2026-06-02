# Faza B5b — Events — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-01. Drugi (i ostatni) podsystem fazy B5; pierwszy to [B5a Community](2026-06-01-backend-b5a-community-design.md).
> Wzorzec: B4 membership + B5a community. Reuse `membership.payments` (seam Stripe) i `membership.selectors.entitlement` (gating).

---

## 1. Cel

Wydarzenia OBSKURY (spotkania online/live/klan): lista i szczegóły, **zapisy z limitem miejsc i listą rezerwową**, **gating eventów „tylko Klan"** przez membership, **płatne bilety przez Stripe** (test mode), oraz **gated dostęp do nagrań** po fakcie (klub/klan). Front (`src/pages/Events.jsx`) jest dziś statycznym mockiem — B5b definiuje kontrakt; read serializery odwzorowują kształty, których front oczekuje.

## 2. Decyzje (rozstrzygnięte z userem)

1. **Capacity + waitlist** — `register` atomowo (`select_for_update` na evencie); brak miejsc → `waitlisted`. Cancel zwalnia miejsce i **auto-promuje** najstarszego z listy rezerwowej.
2. **Klan-gating** — event `mode=klan` wymaga **planu Klan LUB aktywnego patronatu** (nie samo solo). Helper `membership.selectors.has_klan_access`. Free/solo → 403 `klan_required`.
3. **Płatne bilety przez Stripe** — reuse `membership.payments.create_payment_checkout`; **rozszerzenie istniejącego webhooka** `membership.stripe.webhook` o `metadata.registration_id` (jedno konto Stripe = jeden endpoint). Webhook `paid` → Registration `confirmed` + seat (z recheckiem capacity, nadkomplet → refunded out-of-band, jak patronat).
4. **Nagrania** — `recording_url` widoczne tylko gdy `recording_access` (none/klub/klan) spełnione przez entitlement; past eventy w tym samym modelu (`status` + `starts_at` w przeszłości).
5. Konwencje 1:1 jak B4/B5a (TimeStamped/SoftDelete, selectors/services/signals, split read/write serializery, cursor pagination, Redis cache, ruff, pytest).

### Świadomie poza zakresem B5b (deferred)
- i18n treści eventów (front trzyma własne), galerie/transkrypty nagrań, realne pliki nagrań w R2 (na razie `recording_url`), powiadomienia o starcie eventu, refund biletu (test mode → zwrot out-of-band jak patronat), liczniki marketingowe (statyczne na froncie).

---

## 3. Architektura

Nowy app **`events`** obok accounts/catalog/playback/membership/community. Warstwy jak w reszcie. Zależności: `events` zależy od `membership` (payments + entitlement/has_klan_access) i `catalog` (host FK → Creator). Webhook płatności pozostaje w `membership` — jego handler `mode=payment` rozgałęzia po `metadata` (patronage_id → patronat; registration_id → **lazy import** `events.services` by uniknąć cyklu importów).

Touched (existing): `obskura/settings.py` (INSTALLED_APPS += "events"), `obskura/urls.py` (include), `membership/services.py` (`handle_webhook_event` mode=payment → dispatch registration_id), `membership/selectors.py` (+`has_klan_access`).

---

## 4. Model danych

### TextChoices (events/models.py)
- `EventMode`: `ONLINE="online"`, `LIVE="live"`, `KLAN="klan"`.
- `EventStatus`: `DRAFT="draft"`, `PUBLISHED="published"`, `CANCELED="canceled"`.
- `RegStatus`: `PENDING="pending"` (paid, czeka na płatność), `CONFIRMED="confirmed"`, `WAITLISTED="waitlisted"`, `CANCELED="canceled"`.
- `RecordingAccess`: `NONE="none"`, `KLUB="klub"`, `KLAN="klan"`.

### `Event(TimeStampedModel, SoftDeleteModel)`
| pole | typ | uwagi |
|---|---|---|
| `title` | CharField | |
| `slug` | SlugField unique | `pl_slugify(title)` + sufiks przy kolizji |
| `mode` | CharField choices EventMode | online/live/klan |
| `description` | TextField blank | |
| `starts_at` | DateTimeField db_index | |
| `duration_minutes` | PositiveIntegerField default 0 | |
| `host` | FK catalog.Creator SET_NULL null blank, related_name="hosted_events" | |
| `cover_image` | CharField blank | URL/ścieżka |
| `capacity` | PositiveIntegerField null | null = bez limitu |
| `seats_taken` | PositiveIntegerField default 0 | denorm = liczba CONFIRMED (signal) |
| `price_pln` | PositiveIntegerField default 0 | 0 = darmowy |
| `is_free` | BooleanField default True | = (price_pln == 0), ustawiane w save() |
| `status` | CharField choices EventStatus, default PUBLISHED | |
| `is_featured` | BooleanField default False | |
| `recording_url` | CharField blank | |
| `recording_access` | CharField choices RecordingAccess, default NONE | gating nagrania |
| `stripe_price_id` | CharField blank | dla płatnych |

Meta: `base_manager_name="all_objects"`, indexes `[Index(["starts_at"]), Index(["mode","starts_at"]), Index(["status","starts_at"])]`. `seats_remaining` (computed w serializerze) = `capacity - seats_taken` (null gdy capacity null).

### `Registration(TimeStampedModel)`
| pole | typ | uwagi |
|---|---|---|
| `event` | FK Event CASCADE, related_name="registrations" | |
| `user` | FK AUTH_USER_MODEL CASCADE, related_name="event_registrations" | |
| `status` | CharField choices RegStatus, default CONFIRMED | |
| `stripe_checkout_session_id` | CharField blank | |
| `stripe_payment_intent_id` | CharField blank | |

Constraint: `UniqueConstraint(fields=["event","user"], condition=Q(status__in=["pending","confirmed","waitlisted"]), name="uniq_active_registration_event_user")` — jeden żywy zapis na (event, user). Index `["event","status"]`.

---

## 5. Gating (membership)

Dodaj do `membership.selectors`:
- `has_klan_access(*, user) -> bool` — `True` gdy aktywna subskrypcja planu **klan** LUB aktywny patronat bieżącego sezonu (patron dostaje perki klanu). (solo → False.)

Polityki w `events`:
- **Rejestracja na event `mode=klan`** wymaga `has_klan_access` — inaczej `PermissionDenied` kod `klan_required`.
- **`recording_url`** widoczne w detalu gdy: `recording_access==NONE` (każdy, kto widzi event) · `==KLUB` → `entitlement(user).full_access` · `==KLAN` → `has_klan_access(user)`. W przeciwnym razie pole `None`.
- Read eventów publiczny; tylko `status=PUBLISHED` widoczne publicznie (draft/canceled ukryte poza adminem/moderacją — tu: tylko published w selektorach).

---

## 6. Przepływ rejestracji (services)

`register_for_event(*, user, event)` — `@transaction.atomic`, `select_for_update` na evencie:
- event musi być `PUBLISHED` i `starts_at` w przyszłości; inaczej `ValidationError` (`event_not_open`).
- `mode=klan` → wymaga `has_klan_access` (inaczej `klan_required`).
- brak żywego zapisu user+event (constraint); duplikat → `ValidationError`.
- **darmowy** (`price_pln==0`): liczba CONFIRMED < capacity (lub capacity null) → Registration `CONFIRMED` (+seat); inaczej → `WAITLISTED`. Zwraca `{"status": "...", "registration_id": ...}`.
- **płatny** (`price_pln>0`): capacity check (CONFIRMED < capacity, inaczej `event_full` — biletów nie sprzedajemy ponad limit); Registration `PENDING` + `payments.create_payment_checkout(metadata={"registration_id": ...})` → `{"checkout_url": ...}`.

`cancel_registration(*, user, event)`:
- znajdź żywy zapis usera; `CONFIRMED` → `CANCELED` + seat--, **promuj** najstarszy `WAITLISTED` → `CONFIRMED` (+seat); `WAITLISTED`/`PENDING` → `CANCELED` (bez zmian miejsc).

Webhook (w `membership.handle_webhook_event`, mode=payment): jeśli `metadata.registration_id` → lazy `events.services.confirm_paid_registration(registration_id, payment_intent)`: tylko `PENDING`→`CONFIRMED`; recheck capacity (CONFIRMED < capacity), nadkomplet → `CANCELED` (refund out-of-band); set seat + stripe_payment_intent_id.

`seats_taken` denorm: signal na `Registration` save/delete przelicza `event.seats_taken = count(status=CONFIRMED)`. Capacity-check w serwisach liczy CONFIRMED bezpośrednio pod lockiem (autorytatywnie).

---

## 7. API (`/api/v1/events/...`, bez trailing slash)

| Metoda | Ścieżka | Auth | Uwagi |
|---|---|---|---|
| GET | `/events?mode=&when=upcoming\|past` | AllowAny+opt | cache, cursor po `starts_at` |
| GET | `/events/{slug}` | AllowAny+opt | `seats_remaining`, `recording_url` gated |
| POST | `/events/{slug}/register` | IsAuth | free→confirmed/waitlist; klan→gating; paid→`{checkout_url}` |
| POST | `/events/{slug}/cancel` | IsAuth | zwalnia miejsce → promuje waitlist |
| GET | `/events/registrations` | IsAuth | własne zapisy |

Serializery: read (EventListSerializer, EventDetailSerializer z `seats_remaining` + gated `recording_url`, RegistrationReadSerializer z nested event minimal); write — rejestracja nie potrzebuje body (event ze slug w URL); brak ekspozycji `stripe_*`.

Webhook bez trailing slash: pozostaje `membership/stripe/webhook` (jeden endpoint).

## 8. Cache, denorm, paginacja

- Redis `events:list` (lub per-filtr `events:list:<mode>:<when>`) TTL 15m — invalidacja signalem na Event save/delete; klucze per-filtr czyszczone wzorcem `events:*` (fallback delete_many znanych).
- Signals: Registration save/delete → przelicz `Event.seats_taken` (count CONFIRMED). Event save/delete → invalidacja cache.
- Paginacja: `EventCursorPagination` ordering upcoming `("starts_at","id")`, past `("-starts_at","-id")` — wariant per `when` (dwie klasy lub dynamiczny ordering w widoku).

## 9. Testy (pytest + factory_boy, Stripe mockowany)

Factories: EventFactory, RegistrationFactory (+ UserFactory, CreatorFactory z catalog, oraz membership PlanFactory/SubscriptionFactory/PatronageFactory do gatingu). Knox `_client`, `_klan_user()` helper.
Pokrycie: list (mode/when filtry, tylko published, cache, N+1); detail (seats_remaining; recording gated none/klub/klan dla różnych userów); register free (confirmed pod limit; 21. → waitlisted); register klan (free/solo → 403 klan_required; klan/patron → ok); register paid (→ checkout_url + PENDING; capacity full → event_full); webhook paid (PENDING→CONFIRMED + seat; nadkomplet → canceled); cancel (confirmed → canceled + promuje waitlist; waitlisted → canceled); duplikat zapisu → 400; auth required (401); `has_klan_access` (solo False, klan True, patron True).

## 10. Zarys tasków (rozwinie writing-plans; commit per task, EN, bez Co-Authored-By)

1. Scaffold `events` + INSTALLED_APPS/urls + `membership.selectors.has_klan_access` (+test).
2. Modele Event/Registration + TextChoices + migracja (indexy/constraints).
3. Read: list (mode/when, cache, N+1) + detail (seats_remaining, gated recording) — selectors/serializers/pagination/signals(cache).
4. Register free + capacity + waitlist + cancel/auto-promote + Registration seat signal.
5. Klan-gating (`has_klan_access` użycie) + paid ticket checkout + webhook `registration_id` dispatch w membership.
6. Seed `seed_events` (z Events.jsx) + admin.

**Definition of Done (B5b):** pełny `pytest` zielony (events + niezłamana reszta), `ruff`/`format`/`check`/`makemigrations --check` czyste, endpointy z §7 działają (Stripe mock), gating klan + recording z §5 wymuszony, waitlist/promote i webhook z §6 poprawne, denorm `seats_taken` zgodny.

**Następna faza:** B6 — Support + Newsletter + Pages (FAQ/tickety przez Resend, subskrypcje/kampanie, CMS prawne/prasa).
