# Plan backendu OBSKURA — Django + DRF

> Wzorzec: `imroi-backend` (Django 5 + DRF + Knox + Channels + Celery).
> Cel: **najwyższa jakość kodu, bardzo optymalny** (zero N+1, indeksy, cache, paginacja).
> Baza danych jeszcze nie istnieje — na razie placeholder **`database-obskura`** (utworzysz później).
> Backend jako **katalog w monorepo** `obskura/backend/` (decyzja portfolio: jeden link, full-stack w jednym miejscu).

---

## 1. Zasady jakości (nienegocjowalne)

1. **Optymalność zapytań** — każdy queryset z `select_related`/`prefetch_related`; zero N+1 (weryfikacja `nplusone`/`django-debug-toolbar` w dev). Agregacje przez `annotate`, nie pętle Pythona. `only()`/`defer()` na ciężkich modelach.
2. **Indeksy DB** — na każdym FK, polu filtrowanym, sortowanym i `slug`/`unique`. `Meta.indexes` + composite gdzie trzeba.
3. **Paginacja zawsze** — `CursorPagination` dla dużych/rosnących list (odcinki, posty forum, historia), `PageNumber` dla skończonych.
4. **Cache** — Redis dla read-heavy i rzadko zmiennych (katalog, FAQ, plany Klubu). Inwalidacja przez `signals`.
5. **Cienkie widoki, gruba warstwa domeny** — logika w `services.py`/`selectors.py` lub managerach, nie w widokach. Widoki = orkiestracja.
6. **Serializery rozdzielone** — osobne read (z `SerializerMethodField`/annotacjami) i write (walidacja). Walidacja **lustrzana do Zod** z frontu (`src/lib/formSchemas`).
7. **Testy** — pytest + factory_boy; każdy endpoint: happy path + auth + edge. TDD dla logiki domenowej.
8. **Typy i jawność** — type hints wszędzie, `mypy` opcjonalnie; brak „magii".
9. **Bezpieczeństwo** — Knox token auth, granularne `permissions.py`, throttling DRF, walidacja uploadów, brak danych wrażliwych w logach.

---

## 2. Stack — co bierzemy z imroi (+ decyzje dla OBSKURY)

| Warstwa | imroi | OBSKURA (propozycja) | Uwaga |
|---|---|---|---|
| Framework | Django 5.0 + DRF 3.15 | **to samo** | sprawdzone |
| Auth | django-rest-knox (token) | **Knox** | idealne dla SPA; token w localStorage/httpOnly |
| User | `customauth.CustomUser` | **`accounts.User`** (email-login) | custom od początku (trudno zmienić później) |
| **Baza danych** | MS SQL Server (Azure) | **PostgreSQL 16** ✅ | ROZSTRZYGNIĘTE. JSONB, full-text PL, darmowy, najlepszy z Django. Nazwa: `database-obskura`. Engine z env (`SQL_ENGINE`) — jak imroi |
| Real-time | Channels + Redis | **Channels** (faza 2) | live stream status („stream-live" w nav), powiadomienia push |
| Async | Celery + beat + Redis | **Celery + beat** | maile, generowanie narracji audio, statystyki, miniatury |
| Cache | django-redis | **django-redis** | katalog, FAQ, plany |
| Filtry | django-filter | **django-filter** | archiwum (gatunek/czas/narrator) |
| CORS | django-cors-headers | **to samo** | dla frontu Vite/Vercel |
| Storage | Azure Blob | **Cloudflare R2** ✅ | audio/okładki — free 10 GB, zero opłat za transfer, S3-compatible (`django-storages`+`boto3`) |
| Email | Azure Communication | **Resend** ✅ | ROZSTRZYGNIĘTE. Już zintegrowany w `api/_shared.js`, free 100/dzień |
| **Hosting** | Azure (ACA + Azure SQL) | **Oracle Cloud Always Free** ✅ | VM ARM 24/7 (nie śpi), $0, docker-compose: web+db+redis+celery. Front zostaje na Vercel |
| Monitoring | opencensus-azure | **Sentry** (lżejszy) | błędy + perf |

> **Decyzje ROZSTRZYGNIĘTE (2026-05-31, profil: portfolio):** (a) **PostgreSQL 16** · (b) storage **Cloudflare R2** · (c) email **Resend** · (d) **monorepo** `obskura/backend/` · (+) hosting **Oracle Cloud Always Free** · (+) auth **Knox**. Pełne uzasadnienie + ryzyka: [`docs/superpowers/specs/2026-05-31-backend-decisions-design.md`](docs/superpowers/specs/2026-05-31-backend-decisions-design.md).

### 2.1 Hosting i deploy (portfolio, cel $0/mc)

- **Backend:** Oracle Cloud **Always Free** — VM ARM (Ampere A1), `docker-compose`: `web` (Gunicorn/Uvicorn) + `db` (Postgres 16) + `redis` + `celery` (worker+beat) + `nginx` (reverse proxy + TLS). VM działa 24/7, nie zasypia.
- **Front:** zostaje na **Vercel** (statyczne `dist/`); `VITE_API_URL` → domena backendu, CORS whitelist.
- **Storage:** **Cloudflare R2** (audio/okładki) — `django-storages` + `boto3`.
- **Email:** **Resend** (`RESEND_API_KEY` już w `.env.example`).
- **Monitoring:** **Sentry** free tier.
- **Płatności (B4):** **Stripe test mode** — pełny flow subskrypcji bez realnych transakcji.
- **Ryzyko reclaim VM:** keep-alive (lekki cron) + konfiguracja w pełni odtwarzalna z `docker-compose` w repo.

---

## 3. Architektura — aplikacje (mapowane do funkcji frontu)

Każdy app = kanoniczna struktura imroi: `models · serializers · views · urls · permissions · filters · pagination · signals · tasks · selectors/services · admin · tests`.

| App | Odpowiada za | Frontend |
|---|---|---|
| `accounts` | User (email-login), profil, onboarding-prefs, sesje Knox | Login, Register, Account, Onboarding |
| `catalog` | Sezony, Odcinki, Gatunki, Narratorzy/Twórcy (read-heavy) | Archive, Episode, StoriesGrid, Creators |
| `playback` | Postęp odsłuchu, ulubione, kolejka, historia, oceny | Player, Episode, FavoriteRow, Account |
| `membership` | Plany Klubu, tiery Patroni, subskrypcje, płatności, faktury | Club, Patrons, Account |
| `community` | Forum: kategorie, wątki, posty, reakcje, moderacja | Forum |
| `events` | Wydarzenia (online/live), zapisy, archiwum nagrań | Events |
| `support` | FAQ (kategorie/pytania), tickety kontaktowe, status systemów | Support |
| `newsletter` | Subskrypcje, kampanie (mailingi), szablony, wypisy | Newsletter, Mailings |
| `pages` | Treści CMS: prawne (polityka/regulamin/cookies), prasa | Legal, Press |
| `notifications` | Powiadomienia in-app + push (Channels) | global |
| `core` | Bazowe modele (`TimeStampedModel`, `SoftDelete`), utils, mixiny, paginacje | wszystko |

> Mapa zgodna z istniejącym frontem: `src/lib/apiClient.js` (`submitContact` → `support`), `src/lib/formSchemas` (Zod → lustrzane serializery), `api/*` Vercel (migracja do Django albo proxy).

---

## 4. Modele wstępne (kluczowe)

```
core.TimeStampedModel (abstract): created_at, updated_at, indeksy
accounts.User(AbstractBaseUser): email[unique,index], display_name, is_active, prefs(JSONB), date_joined
catalog.Season: number[index], title, slug[unique], cover, published_at
catalog.Genre: name, slug[unique], accent(red/blue)
catalog.Creator: name, slug, role(narrator/director/sound/writer), bio, avatar
catalog.Episode: season(FK,index), number, title, title_em, slug[unique], genre(FK,index),
    creators(M2M), duration_s, audio_url, poster, video_preview, rating_avg, plays_count,
    is_true_horror(bool), kind(fiction/inspired/doc), published_at[index], premium(bool)
    Meta.indexes: [(season,number), (genre,published_at), (premium,published_at)]
playback.Progress: user(FK), episode(FK), position_s, completed, updated_at  [unique(user,episode)]
playback.Favorite: user(FK), episode(FK), created_at  [unique(user,episode)]
playback.QueueItem: user(FK), episode(FK), order
membership.Plan: code(prog/solo/klan), name, price_month, price_year, features(JSONB)
membership.Subscription: user(FK), plan(FK), status, period_end[index], auto_renew
membership.PatronTier + Patronage
community.Category: name, slug, description
community.Thread: category(FK,index), author(FK), title, slug, is_pinned, is_locked, last_post_at[index]
community.Post: thread(FK,index), author(FK), body, created_at  + reactions
events.Event: title, slug, mode(online/live/clan), starts_at[index], capacity, seats_taken, recording_url
events.Registration: event(FK), user(FK)  [unique]
support.FaqCategory + FaqItem(category,question,answer,order) + Ticket(email,category,message,status)
newsletter.Subscriber(email[unique],frequency,consent_at) + Campaign + Send
pages.LegalDoc(kind,version,body,published_at) + PressItem
notifications.Notification(user,kind,payload(JSONB),read_at)
```

---

## 5. API (REST, prefix `/api/v1/`) — mapa do frontu

```
POST   /auth/register · /auth/login · /auth/logout · /auth/logoutall   (Knox)
GET    /accounts/me · PATCH /accounts/me · PUT /accounts/me/prefs
GET    /catalog/episodes?genre=&season=&sort=&search=   (filtry+cursor)
GET    /catalog/episodes/{slug} · /catalog/seasons · /catalog/genres · /catalog/creators
GET/PUT /playback/progress/{episode} · GET /playback/history
GET/POST/DELETE /playback/favorites · /playback/queue
GET    /membership/plans · /membership/patron-tiers
POST   /membership/subscribe · GET /membership/subscription
GET    /community/categories · /community/threads?category= · /community/threads/{slug}
POST   /community/threads · /community/threads/{slug}/posts
GET    /events · POST /events/{slug}/register
GET    /support/faq?category= · POST /support/tickets   (← submitContact już w froncie)
POST   /newsletter/subscribe · GET /mailings (podgląd szablonów)
GET    /pages/legal/{kind} · /pages/press
GET    /notifications · POST /notifications/{id}/read
```

Wszystkie listy: paginacja + `ETag`/`Last-Modified` dla cache. Walidacja serializerów = lustro `formSchemas` (Zod) z frontu.

---

## 6. Optymalizacja (twarde wymogi „bardzo optymalny")

- **Query:** `select_related` (FK: episode→season,genre), `prefetch_related` (M2M: creators; odwrotne: thread→posts). `Prefetch` z własnym querysetem dla filtrowanych relacji.
- **Annotacje zamiast pętli:** `rating_avg`, `plays_count`, `posts_count` przez `annotate`/`aggregate`, materializowane gdzie hot (denormalizacja + signal).
- **Indeksy:** composite na `(genre, published_at)`, `(season, number)`, `last_post_at`, `starts_at`. `db_index=True` na slug/email.
- **Cache:** Redis na `catalog` (TTL + inwalidacja signalem przy publish), `pages/legal`, `support/faq`, `membership/plans`. `cache_page`/per-obiekt.
- **Paginacja:** `CursorPagination` (odcinki, posty, historia) — stabilna przy rosnących danych.
- **Async views** (Django 5) dla I/O-bound (zewnętrzne API płatności/email).
- **Throttling** DRF (anon/user/scoped na auth i tickety).
- **Connection pooling** (pgbouncer / `CONN_MAX_AGE`).
- **Dev guard:** `django-debug-toolbar` + `nplusone` — CI fail przy N+1.

---

## 7. Fazy wdrożenia

- [x] **B0 — Szkielet:** projekt `obskura-backend`, settings (env-based jak imroi: `SQL_ENGINE`, `REDIS_HOST`, `SECRET_KEY`), `core` (base models/mixiny), Docker + docker-compose (web+db+redis), CI (lint+test). DB `database-obskura` (env).
- [x] **B1 — Auth + accounts:** `accounts.User`, Knox, register/login/me/prefs, throttling. Testy.
- [x] **B2 — Catalog (read-heavy):** Season/Genre/Creator/Episode, filtry, cursor-pagination, cache, indeksy. Seed z istniejących danych frontu.
- [x] **B3 — Playback:** progress/favorites/queue/history (gated premium).
- [x] **B4 — Membership:** plany Klubu (free/solo/klan), tiery Patroni (per sezon, seat-cap, anonimowość), subskrypcje ze **Stripe test mode** + trial 30 dni, webhook, oraz tier-gating premium + quota free 20/mc zastępujące auth-only z B3. Spec + plan w `docs/superpowers/`. _(do żywego flow potrzebny `sk_test_…`/`whsec_…` w obskura-media)_
- [x] **B5 — Community + Events** (rozbite na dwa shippable podsystemy):
  - [x] **B5a — Community (forum):** Category/Thread/Post + reakcje, **pełny pipeline moderacji** (statusy postów, zgłoszenia bez auto-ukrywania, rola `is_moderator`, audit log), widoczność (autor widzi swoje pending/flagged), cursor pagination, cache. Spec + plan w `docs/superpowers/`.
  - [x] **B5b — Events:** wydarzenia online/live/klan, zapisy + capacity + waitlist, **klan-gating** przez membership (`has_klan_access`), **płatne bilety przez Stripe** (reuse seam + webhook dispatch po `metadata`), nagrania gated (klub/klan). Spec + plan w `docs/superpowers/`.
- [x] **B6 — Support + Newsletter + Pages:** FAQ + tickety kontaktowe (Resend ack/notify, throttle), newsletter single opt-in + katalog szablonów (`/mailings`), CMS prawne (LegalDoc wersjonowany) + prasa. Wspólny `core/email.py` (Resend, mock w testach). Bulk-wysyłka kampanii odłożona do B7. Spec + plan w `docs/superpowers/`. _(żywe maile wymagają RESEND_API_KEY w obskura-media)_
- [x] **B7 — Real-time + async** (rozbite na dwa podsystemy):
  - [x] **B7a — Celery + async:** Celery app + broker Redis db1 + statyczny beat; `core.tasks.send_email_task` (maile ticket/welcome async), `newsletter.send_campaign_task` (bulk + command + akcja admin), periodic: `expire_subscriptions`, `cleanup_stale_pending`, `cleanup_stale_registrations`, `recompute_all_ratings`. docker-compose worker+beat. Testy eager. Spec+plan w `docs/superpowers/`. _(narracja ElevenLabs deferred — T8 zablokowane)_
  - [x] **B7b — Channels:** ASGI ProtocolTypeRouter + channels-redis, `TokenAuthMiddleware` (Knox WS auth po `?token=`), app `notifications` (Notification + StreamStatus singleton, REST list/read + `/stream/status`, `NotificationConsumer` per-user + `StatusConsumer` live-status), `notify()` push + 3 triggery (reply/waitlist/sub-activation). `web`/Dockerfile na daphne. (web-push/VAPID deferred.) Spec+plan w `docs/superpowers/`.
- [ ] **B8 — Integracja frontu** (meta-faza: spina ~9 podsystemów frontu z `/api/v1/` — rozbita na podfazy shippable):
  - [ ] **B8a — Fundament + Auth:** klient `fetch` na `/api/v1/` (token Knox w nagłówku, env `VITE_API_URL`, CORS, backend lokalnie), `AuthContext` (login/register/logout/me), chronione trasy (Account/Onboarding). Token w localStorage, auth dodatkowy (guest-first). Spec w `docs/superpowers/specs/2026-06-02-frontend-b8a-integration-auth-design.md`.
  - [ ] **B8b — Catalog:** `src/data/tracks.js` → `/catalog/episodes|seasons|genres|creators` (read-only). Rozważyć TanStack Query (cache list).
  - [ ] **B8c — Playback sync:** favorites/queue/progress/history localStorage → API; merge stanu gościa przy logowaniu.
  - [ ] **B8d — Membership:** Club/Patrons (plany, subscribe, status subskrypcji), premium-gating + quota free.
  - [ ] **B8e — Community:** Forum (kategorie/wątki/posty, reakcje, moderacja widoczna autorowi).
  - [ ] **B8f — Events + Support/Newsletter/Pages:** zapisy/waitlist; migracja `api/contact|newsletter` (Vercel) → Django; FAQ, legal/press z `/pages`.
  - [ ] **B8g — Notifications (WS):** klient Channels (`?token=`), in-app notifications + live stream-status.
  - [ ] **B8h — Deploy:** prod `VITE_API_URL`, domena backendu, CORS prod, odstawienie pozostałych `api/*` Vercel.

---

## 8. Integracja z istniejącym frontendem

- `src/lib/apiClient.js` → bazowy URL `VITE_API_URL` (env), Knox token w nagłówku.
- `src/lib/formSchemas` (Zod) → **źródło prawdy walidacji**; serializery DRF lustrzane (te same reguły).
- `api/*` (Vercel functions) → migracja do Django lub pozostawienie jako proxy w okresie przejściowym.
- i18n: backend zwraca klucze/identyfikatory, front tłumaczy (39 języków zostaje po stronie frontu).
- CORS: whitelist domeny frontu (prod + localhost:5188).

---

## 9. Rekomendowane skille / tooling (szczegóły niżej w czacie)

- **superpowers** (TDD, writing-plans, executing-plans, code-review, systematic-debugging, verification) — fundament jakości.
- **Lokalny skill `backend-django`** (do stworzenia, analogiczny do `frontend-design`) — konwencje DRF/Django + wzorce imroi + reguły optymalizacji z §6.
- **/security-review**, **/code-review**, **/simplify** — audyt i jakość per zmiana.
- Tooling: `ruff` (lint+format), `pytest`+`factory_boy`, `django-debug-toolbar`, `nplusone`, `mypy` (opcjonalnie).
