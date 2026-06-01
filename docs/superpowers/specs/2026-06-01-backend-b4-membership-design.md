# Faza B4 — Membership — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-01. Profil projektu: portfolio, $0/mc, backend **nie obsługuje realnych pieniędzy** (Stripe **test mode**).
> Poprzednie: B0 szkielet, B1 auth, B2 catalog, B3 playback. To jest następna faza wg [`BACKEND-PLAN.md`](../../../BACKEND-PLAN.md) §7.

---

## 1. Cel

Domena członkostwa OBSKURY: **plany Klubu** (free/solo/klan, subskrypcja recurring), **patronat** (tiery per sezon, płatność jednorazowa, limit miejsc, anonimowość), oraz **realne bramkowanie premium** zastępujące auth-only z B3. Płatności przez **Stripe w trybie testowym** (pełny flow Checkout + webhook, bez realnych transakcji), z **30-dniowym trialem** na planach płatnych.

## 2. Decyzje (rozstrzygnięte z userem)

1. **Płatności = pełny Stripe test mode.** Realny Checkout Session + webhook, biblioteka `stripe`, klucze `sk_test_…`/`whsec_…` w `obskura-media` (off-repo). Wszystkie wywołania Stripe za cienkim wrapperem `payments.py` → w testach mockowane (CI zielone bez klucza).
2. **Gating = pełny: quota free 20/mc + tiery.** Free dostaje 20 różnych nie-premium odcinków/mc; solo/klan/patron — bez limitu; premium tylko dla solo/klan/patron. Szczegóły w §6.
3. **Patronat = pełny.** PatronTier per sezon, `capacity`/seat-cap (Producent 12/sezon), anonimowość (`anon_number` sekwencyjny), status pending/paid, tier „Aplikuj" (`requires_application`).
4. **Trial 30 dni** na planach solo/klan, przyznawany przy **pierwszej** płatnej subskrypcji usera (anty-abuse). `status='trialing'` = pełny dostęp; po 30 dniach Stripe pobiera → `active`.
5. **Kod planu `free`** (nie `prog` z §4 planu) — zgodnie z `id:"free"` z frontu, na tym opiera się gating. „Próg" to tylko `name`.
6. **Ceny w całych złotych (PLN), `PositiveIntegerField`.** `price_year` = stawka/mc przy rozliczeniu rocznym (jak front); roczny total = `price_year*12` (computed w serializerze). Konwersja na grosze (minor unit Stripe) tylko na styku `payments.py`.

### Świadomie poza zakresem B4 (deferred)
- **Faktury/`faktury`** (§3 wspomina, brak modelu/endpointu w §4/§5) → osobno (B6 albo dedykowana).
- **Limity urządzeń/profili** (1/2/6, profil 12+) — pozostają display-only w `features` JSONB, **nie** strukturalnie egzekwowane (gating ich nie potrzebuje).
- **Liczniki marketingowe** (412 patronów, 147 280 zł, 73% celu) — statyczne na froncie; brak agregacyjnego endpointu w B4.
- **Webhook retry/idempotency store** — minimalny (sprawdzenie `event.id` w pamięci/log), pełna kolejka idempotencji deferred do B7 (Celery).

---

## 3. Architektura

Nowy app **`membership`** obok `accounts/catalog/playback`. Warstwy jak w reszcie repo:

```
models.py       dane + Meta(indexes/constraints) + properties (is_active itp.)
selectors.py    read-querysety (select_related/prefetch, zero N+1) + *_cached (Redis)
services.py     mutacje @transaction.atomic (create_subscription, create_patronage,
                handle_webhook_event, register_play, cancel_subscription)
payments.py     cienki wrapper Stripe SDK (checkout, webhook verify, cancel, price sync)
serializers.py  split read/write
signals.py      invalidacja cache 'membership:*' przy zmianie Plan/PatronTier
views.py        cienkie APIView/ViewSet → delegują do selectors/services
urls.py         /api/v1/membership/... (bez trailing slash)
admin.py        rejestracja modeli (list_select_related + autocomplete_fields)
management/commands/seed_membership.py    seed planów + tierów (idempotent)
management/commands/sync_stripe_prices.py Products/Prices w Stripe (gdy klucz)
tests/          factories.py + test_*.py (pytest + factory_boy, Stripe mock)
```

**Kierunek zależności:** `catalog` i `playback` zależą od `membership` (entitlement). `membership` zależy od `catalog` (FK do `Season`/`Episode`). Import cyklu unikamy: `catalog.serializers`/`playback.services` importują `membership.selectors`/`membership.services` **wewnątrz funkcji** (lazy import), nie na poziomie modułu.

**Plug-in do infrastruktury:** dodanie `"membership"` do `INSTALLED_APPS` (po `playback`), `path("api/v1/", include("membership.urls"))` w `obskura/urls.py`, `stripe` do `requirements/base.txt`, zmienne `STRIPE_*` w `settings.py` (env, default `""`).

---

## 4. Model danych

### `Plan(TimeStampedModel)` — katalog planów Klubu (admin-managed, cache'owany)
| pole | typ | uwagi |
|---|---|---|
| `code` | Char unique, choices free/solo/klan | lookup key |
| `name` | Char | "Próg"/"Solo"/"Klan" |
| `price_month` | PositiveInt | PLN (0/29/49) |
| `price_year` | PositiveInt | PLN/mc przy rocznym (0/24/39); total ×12 w serializerze |
| `currency` | Char default "PLN" | |
| `featured` | Bool | solo=True |
| `tag`,`badge`,`cta_label` | Char blank | prezentacja 1:1 z frontu |
| `monthly_quota` | PositiveInt null | free=20, solo/klan=null (∞) |
| `features` | JSON | `[{ok:bool, text:str}]` — bullet listy 1:1 z Club.jsx |
| `stripe_price_id_month`,`stripe_price_id_year` | Char blank | wypełnia `sync_stripe_prices` (free: puste) |
| `is_active`,`order` | Bool, PositiveInt | |

### `Subscription(TimeStampedModel)` — subskrypcja Klubu (recurring)
| pole | typ | uwagi |
|---|---|---|
| `user` | FK AUTH_USER_MODEL, CASCADE, related_name="subscriptions" | |
| `plan` | FK Plan, PROTECT | |
| `status` | Char choices | incomplete/trialing/active/past_due/canceled/expired |
| `billing_period` | Char choices | month/year |
| `period_start`,`period_end` | DateTime; `period_end` db_index | |
| `trial_end` | DateTime null | trial 30 dni |
| `auto_renew` | Bool default True | |
| `cancel_at_period_end` | Bool default False | |
| `stripe_customer_id`,`stripe_subscription_id` | Char blank | |

- Constraint: `UniqueConstraint(fields=["user"], condition=Q(status__in=["trialing","active"]), name="uniq_active_subscription_per_user")` — max 1 żywa subskrypcja na usera.
- Index: `["user","status"]`. Property `is_live` = status∈{trialing,active} oraz `period_end` w przyszłości.

### `PatronTier(TimeStampedModel)` — tier patronatu, **per sezon**, one-time
| pole | typ | uwagi |
|---|---|---|
| `season` | FK catalog.Season, PROTECT, related_name="patron_tiers" | |
| `code` | Char choices witness/ally/exec | unikalny w obrębie sezonu |
| `role_label`,`title` | Char | "// ŚWIADEK" / "Anonim w cieniu" |
| `amount` | PositiveInt | PLN one-time (120/450/2400) |
| `currency` | Char default "PLN" | |
| `featured` | Bool | ally=True |
| `capacity` | PositiveInt null | null=∞; exec=12 |
| `requires_application` | Bool | exec=True (CTA "Aplikuj") |
| `perks` | JSON | lista stringów |
| `stripe_price_id` | Char blank | one-time price |
| `is_active`,`order` | | |

- Constraint: `UniqueConstraint(fields=["season","code"], name="uniq_patron_tier_season_code")`.
- `seats_taken` = annotacja `Count` patronaży o statusie **`paid`** (porzucone `pending` z Checkout nie blokują miejsc); `seats_remaining` = `capacity - seats_taken` (computed, null gdy `capacity` null). Guard przy zakupie odrzuca gdy `seats_taken >= capacity`. Rzadki wyścig (dwa równoległe checkouty na ostatnie miejsce) rozstrzyga webhook — drugi `paid` ponad limit → `status="refunded"` + zwrot (test mode).

### `Patronage(TimeStampedModel)` — patronat usera
| pole | typ | uwagi |
|---|---|---|
| `user` | FK, CASCADE, related_name="patronages" | |
| `tier` | FK PatronTier, PROTECT, related_name="patronages" | |
| `amount` | PositiveInt | kopiowane z tier w chwili zakupu |
| `status` | Char choices | pending/paid/refunded/canceled |
| `is_anonymous` | Bool | |
| `credit_name` | Char blank | publiczny podpis w napisach |
| `anon_number` | PositiveInt null | sekwencyjny per sezon dla anonimów ("Anonim #042") |
| `is_company`,`company_name` | Bool, Char blank | opcja faktury exec |
| `stripe_checkout_session_id`,`stripe_payment_intent_id` | Char blank | |

- Constraint: `UniqueConstraint(fields=["user","tier"], condition=Q(status__in=["pending","paid"]), name="uniq_active_patronage_user_tier")` — jeden żywy patronat na (user, tier).
- Bez soft-delete: anulowanie/zwrot = `status`, wiersz zostaje (historia napisów). `anon_number` nadawany w serwisie/webhooku przy przejściu na `paid` (max+1 w obrębie sezonu).

### `FreePlayGrant(TimeStampedModel)` — licznik quoty free 20/mc
| pole | typ | uwagi |
|---|---|---|
| `user` | FK, CASCADE, related_name="free_play_grants" | |
| `episode` | FK catalog.Episode, CASCADE | |
| `period` | Char "YYYY-MM", db_index | miesiąc kalendarzowy (timezone.now) |

- Constraint: `UniqueConstraint(fields=["user","episode","period"], name="uniq_free_grant_user_episode_period")` — ten sam odcinek w tym samym miesiącu nie konsumuje 2×.
- Index: `["user","period"]` (zliczanie wykorzystania w miesiącu).

---

## 5. Entitlement (uprawnienia) — centralny selektor

`membership.selectors.entitlement(*, user)` → zwraca lekki obiekt:
- `full_access: bool` — `True` gdy user ma żywą `Subscription` w {trialing, active} planu **solo/klan** LUB `Patronage(status="paid")` powiązany z tierem **bieżącego sezonu** (bieżący = sezon o najwyższym `number`).
- `plan_code: str|None` — kod planu (lub `"free"` dla zalogowanego bez subskrypcji, `None` dla anonima).
- `monthly_quota: int|None` — limit (free=20, full=∞).

`membership.selectors.can_access_audio(*, user, episode)` (czysty read, **bez mutacji**) → `bool`:
- `episode.premium == False`:
  - anonim → `True` (publiczny preview, jak B3),
  - free → `True` jeśli (już ma grant na ten odcinek w tym mc) **lub** (wykorzystane granty w mc < 20),
  - full → `True`.
- `episode.premium == True`:
  - full → `True`; w przeciwnym razie `False` (anonim i free nie mają premium).

> Read tylko *odzwierciedla* uprawnienie — nie zżera limitu. Stąd przeglądanie 25 odcinków nie konsumuje quoty.

---

## 6. Polityka gatingu (egzekwowanie)

| Kto | Premium | Nie-premium |
|---|---|---|
| Niezalogowany | ❌ `audio_url=None` | ✅ publiczne |
| Zalogowany free / bez sub | ❌ (upgrade) | ✅ **metrowane: 20 różnych/mc**; 21. → 403 |
| solo/klan (active/trialing) | ✅ ∞ | ✅ ∞ |
| Patron (paid, bieżący sezon) | ✅ ∞ | ✅ ∞ |

**Dwa punkty styku z istniejącym kodem (B2/B3):**
1. **Read — `catalog/serializers.py` `EpisodeDetailSerializer.get_audio_url`:** zamiana `request.user.is_authenticated` na `membership.selectors.can_access_audio(user, episode)` (lazy import). Zachowuje „reszta odcinka publiczna".
2. **Write (autorytatywne) — `playback/services.py upsert_progress`:** na starcie odtwarzania woła `membership.services.register_play(user=..., episode=...)`:
   - full → no-op (pełny dostęp),
   - premium & nie-full → `PermissionDenied` kod `premium_required` (402/403),
   - free & nie-premium → `get_or_create(FreePlayGrant)` na bieżący miesiąc; jeśli `created` i liczba grantów w mc **> 20** → usuń świeży grant, `PermissionDenied` kod `quota_exceeded`.

> Konsumpcja przy starcie odtwarzania, nie przy przeglądaniu — `POST /playback/progress` jest naturalnym sygnałem „gram to". Frontend dostaje kod błędu → pokazuje upgrade-prompt.

---

## 7. Przepływ płatności (Stripe test mode)

### Subskrypcja Klubu
- `POST /membership/subscribe {plan_code, billing_period}`:
  - plan **free** → bez Stripe: tworzy/aktualizuje lokalną `Subscription(plan=free, status=active)`; zwraca `{status:"active"}`.
  - plan **solo/klan** → `payments.create_subscription_checkout(user, price_id, trial_days)`:
    - `trial_days=30` tylko gdy user **nie ma** żadnej wcześniejszej `Subscription` (anty-abuse), inaczej `0`.
    - tworzy `Subscription(status="incomplete")` + zwraca `{checkout_url}`. Front przekierowuje na Stripe Checkout.
- **Webhook** `POST /membership/stripe/webhook` (open, podpis `whsec_`):
  - `checkout.session.completed` → ustaw `stripe_customer_id`/`stripe_subscription_id`, status z sesji.
  - `customer.subscription.updated` → `status` (trialing/active/past_due/canceled), `period_end`, `trial_end`, `cancel_at_period_end`.
  - `customer.subscription.deleted` → `status="canceled"`.
  - `invoice.payment_failed` → `status="past_due"`.
- `GET /membership/subscription` → bieżąca żywa subskrypcja (lub `{subscription:null}`).
- `POST /membership/subscription/cancel` → `payments.cancel_at_period_end(stripe_subscription_id)`; lokalnie `cancel_at_period_end=True`.

### Patronat (one-time)
- `POST /membership/patronages {tier_id, is_anonymous, credit_name, is_company, company_name}`:
  - walidacja: tier `is_active`, seat-cap (`seats_taken(paid) < capacity` jeśli `capacity`), brak żywego patronatu user+tier.
  - `Patronage(status="pending")` + `payments.create_payment_checkout(amount/price_id)` → `{checkout_url}`. `pending` nie blokuje miejsca (liczy się dopiero `paid` z webhooka); ostateczny seat-cap rozstrzyga webhook.
  - `requires_application` (exec): też przez checkout w B4 (seat-cap = forma limitu); pełny approval-flow można dodać później.
- **Webhook** `checkout.session.completed` (mode=payment) → `Patronage.status="paid"`, `stripe_payment_intent_id`, nadanie `anon_number` (max+1 w sezonie) gdy `is_anonymous`.
- `GET /membership/patronages` → patronaty usera.

### Wrapper `payments.py`
Funkcje: `create_subscription_checkout`, `create_payment_checkout`, `construct_event` (weryfikacja podpisu), `cancel_at_period_end`, `retrieve_subscription`, `ensure_product_and_price` (dla `sync_stripe_prices`). Czyta `settings.STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET`. W testach **monkeypatch** na te funkcje — zero realnych wywołań, klucz niepotrzebny w CI.

---

## 8. API (`/api/v1/membership/...`, bez trailing slash)

| Metoda | Ścieżka | Auth | Cache | Uwagi |
|---|---|---|---|---|
| GET | `/membership/plans` | AllowAny | Redis 15m | lista planów (computed `price_year_total`) |
| GET | `/membership/patron-tiers?season=` | AllowAny | Redis 15m | `seats_remaining` |
| POST | `/membership/subscribe` | IsAuth | — | → `{checkout_url}` lub `{status:"active"}` (free) |
| GET | `/membership/subscription` | IsAuth | — | bieżąca |
| POST | `/membership/subscription/cancel` | IsAuth | — | cancel at period end |
| GET | `/membership/patronages` | IsAuth | — | własne |
| POST | `/membership/patronages` | IsAuth | — | → `{checkout_url}` |
| POST | `/membership/stripe/webhook` | open (auth=[], csrf-exempt, throttle=[]) | — | podpis `whsec_` |

Walidacja serializerów write = lustro przyszłych `src/lib/formSchemas` (Zod) — B4 definiuje kontrakt (frontu jeszcze nie ma na te akcje).

**Serializery:** `PlanSerializer`, `PatronTierSerializer` (read, cache'owane); `SubscribeWriteSerializer`/`SubscriptionReadSerializer`; `PatronageWriteSerializer`/`PatronageReadSerializer`. `stripe_*` nigdy nie eksponowane.

---

## 9. Cache i seed

- `membership:plans`, `membership:patron_tiers` (TTL 15m) — invalidacja signalem post_save/post_delete na `Plan`/`PatronTier` (`cache.delete_pattern("membership:*")` z fallbackiem na LocMemCache, jak catalog).
- `seed_membership` — idempotentny `update_or_create`: 3 plany (free/solo/klan z cenami i features z Club.jsx) + 3 tiery dla bieżącego sezonu (Świadek/Sojusznik/Producent z Patrons.jsx). Stripe price id puste.
- `sync_stripe_prices` — gdy `STRIPE_SECRET_KEY` ustawiony: tworzy Products/Prices (month+year dla solo/klan, one-time dla tierów) i zapisuje id do modeli.

---

## 10. Testy (pytest + factory_boy, Stripe mockowany)

Factories: `PlanFactory`, `SubscriptionFactory`, `PatronTierFactory`, `PatronageFactory`, `FreePlayGrantFactory` (+ `UserFactory` z accounts, `EpisodeFactory`/`SeasonFactory` z catalog). Auth: knox `_client(user)` helper.

Pokrycie:
- **plans/patron-tiers** — publiczne, cache, N+1 (`django_assert_num_queries`), `seats_remaining`.
- **subscribe** — free → lokalna active; solo z trialem → `incomplete` + checkout_url (mock); trial tylko za 1. razem.
- **webhook** — weryfikacja podpisu (mock `construct_event`), przejścia statusów (trialing→active→past_due→canceled), nadanie `anon_number`.
- **subscription** — read bieżącej, cancel → `cancel_at_period_end`.
- **patronage** — seat-cap (sold-out → 400), anonimowość + sekwencyjny `anon_number`, unikalność user+tier, status flow.
- **gating** — premium wymaga solo/klan/patron (anonim/free → 403/None); free quota: 20 OK, 21. → 403 `quota_exceeded`; ten sam odcinek 2× w mc nie zżera limitu; full → ∞; przeglądanie nie konsumuje.

---

## 11. Konfiguracja operacyjna (Stripe)

`settings.py` (env, default `""`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`. Klucze testowe (`sk_test_…`/`whsec_…`) w `~/Desktop/obskura-media/obskura-backend.env` (off-repo, jak R2/Resend) — nigdy w gicie. Bez klucza: kod kompletny, testy zielone (mock), żywy flow nieweryfikowalny do czasu dostarczenia klucza.

---

## 12. Zarys tasków (rozwinie writing-plans, commit per task, EN, bez Co-Authored-By)

1. Scaffold app + `INSTALLED_APPS`/`urls` + env `STRIPE_*` + `payments.py` (+ dep `stripe`).
2. Modele Plan/Subscription/PatronTier/Patronage/FreePlayGrant + migracja (constraints/indexes).
3. Read endpoints plans + patron-tiers (selectors + cache + signals + serializery).
4. Subscribe (Checkout + trial 30) + subscription read/cancel + webhook subskrypcji.
5. Patronage (checkout + seat-cap + anonimowość) + webhook płatności.
6. Tier-gating: rewrite `catalog.get_audio_url` + quota free 20/mc w `playback.upsert_progress`.
7. Seed `seed_membership` + `sync_stripe_prices` + admin.

**Definition of Done (B4):** wszystkie testy zielone (`docker compose run --rm web pytest`), `ruff check`/`ruff format` czyste, `manage.py check` OK, endpointy z §8 działają (Stripe mock), gating z §6 wymuszony, seed odtwarza dane frontu.

**Następna faza:** B5 — Community + Events.
