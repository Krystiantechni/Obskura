# Faza B7b — Channels (real-time) — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-02. Drugi (i ostatni) podsystem B7; pierwszy to [B7a Celery](2026-06-02-backend-b7a-celery-design.md). Domyka B7.
> Wzorzec: imroi (Channels + Knox). Reuse `knox.auth` do uwierzytelniania WS.

---

## 1. Cel

Real-time przez **Django Channels** (ASGI + Redis channel layer): **in-app powiadomienia** dostarczane na żywo przez WebSocket (per-user) z REST do listy/odczytu, oraz **broadcast statusu live** („stream-live" w nav). Bez web-push/VAPID. Front nie ma jeszcze UI powiadomień — B7b definiuje kontrakt (REST + WS).

## 2. Decyzje (rozstrzygnięte z userem)

1. **Split B7** — B7b Channels (ten spec), po B7a Celery.
2. **Zakres** — in-app WS notifications + live-status broadcast. Web-push/VAPID **deferred**.
3. **Runtime** — `web` przechodzi na **daphne** (ASGI); deps channels/channels-redis/daphne; **rebuild obrazu**. Testy na **InMemoryChannelLayer** + `pytest-asyncio` (zielone bez Redis-WS).
4. **Triggery** — reprezentatywny zestaw 3: odpowiedź w wątku → autor; promocja z waitlisty eventu → user; aktywacja subskrypcji (webhook) → user. + serwis `notify()` do dalszego użytku.
5. Auth WS = **Knox token w query stringu** (`?token=…`); test layer in-memory; `StreamStatus` = singleton + toggle w adminie.

### Świadomie poza zakresem B7b (deferred)
- web-push/VAPID/Service Worker, presence/typing indicators, skalowanie wielu instancji ASGI, szerokie podpięcie triggerów (dokładane w miarę potrzeb).

---

## 3. Architektura ASGI

- INSTALLED_APPS: dodać **`daphne`** na samej górze (przed `django.contrib.staticfiles` — przejmuje `runserver` na ASGI), **`channels`** w third-party, **`notifications`** w local.
- `requirements/base.txt` += `channels~=4.1`, `channels-redis~=4.2`, `daphne~=4.1`; `requirements/dev.txt` += `pytest-asyncio~=0.24`.
- `obskura/asgi.py`:
  ```python
  ProtocolTypeRouter({
      "http": get_asgi_application(),
      "websocket": TokenAuthMiddleware(URLRouter(notifications.routing.websocket_urlpatterns)),
  })
  ```
- **`notifications/middleware.py` `TokenAuthMiddleware`** — czyta `token` z query stringa scope, waliduje `knox.auth.TokenAuthentication().authenticate_credentials(token.encode())` przez `channels.db.database_sync_to_async`; ustawia `scope["user"]` (lub `AnonymousUser`). Owija inner app.
- `CHANNEL_LAYERS = {"default": {"BACKEND": "channels_redis.core.RedisChannelLayer", "CONFIG": {"hosts": [redis db 2]}}}`. Testy: `InMemoryChannelLayer` (override w conftest).
- docker-compose `web.command` → `daphne -b 0.0.0.0 -p 8000 obskura.asgi:application`; Dockerfile CMD → daphne (prod). worker/beat (z B7a) bez zmian.

---

## 4. Model danych (app `notifications`)

### TextChoices `NotificationKind`
`SYSTEM="system"`, `REPLY="reply"`, `EVENT="event"`, `MEMBERSHIP="membership"`, `PATRONAGE="patronage"`.

### `Notification(TimeStampedModel)`
| pole | typ | uwagi |
|---|---|---|
| `user` | FK AUTH_USER_MODEL CASCADE, related_name="notifications" | |
| `kind` | CharField choices NotificationKind | |
| `title` | CharField | |
| `body` | TextField blank | |
| `url` | CharField blank | deep-link na froncie |
| `payload` | JSONField default=dict | dowolne dane (np. thread_slug, event_slug) |
| `read_at` | DateTimeField null | null = nieprzeczytane |

Indeksy: `[user, -created_at]`, `[user, read_at]`.

### `StreamStatus(TimeStampedModel)` — singleton
| pole | typ | uwagi |
|---|---|---|
| `is_live` | BooleanField default False | |
| `title` | CharField blank | tytuł streamu |
| `started_at` | DateTimeField null | |

Singleton: `save()` wymusza `pk=1`; helper `StreamStatus.load()` (get_or_create pk=1). Edycja w adminie → signal broadcast do grupy `stream_status`.

---

## 5. Serwisy (notifications/services.py)

- `notify(*, user, kind, title, body="", url="", payload=None) -> Notification` (@transaction.atomic): tworzy `Notification`, następnie `_push(user_id, serialized)` → `async_to_sync(get_channel_layer().group_send)(f"notif.user.{user_id}", {"type": "notify.message", "data": <NotificationSerializer.data>})`. Push owinięty try/except (brak channel layer / Redis nie wywala zapisu — notyfikacja zostaje w bazie).
- `broadcast_stream_status(status: StreamStatus)` → `group_send("stream_status", {"type": "status.message", "data": <StreamStatusSerializer.data>})`.

Selectors: `user_notifications(*, user)` (own, -created_at), `unread_count(*, user)`.

## 6. Consumery (notifications/consumers.py) + routing

- **`NotificationConsumer(AsyncWebsocketConsumer)`** — `connect`: jeśli `scope["user"]` uwierzytelniony → `group_add(f"notif.user.{user.id}")`, `accept()`; inaczej `close(code=4401)`. Handler `notify_message(event)` → `send(text_data=json.dumps(event["data"]))`. `disconnect` → group_discard.
- **`StatusConsumer(AsyncWebsocketConsumer)`** — `connect`: `group_add("stream_status")`, `accept()`, wyślij bieżący status (`StreamStatus.load()` przez database_sync_to_async). Handler `status_message` → send. Publiczny (anonim OK).
- `notifications/routing.py`: `websocket_urlpatterns = [re_path(r"^ws/notifications$", NotificationConsumer.as_asgi()), re_path(r"^ws/stream$", StatusConsumer.as_asgi())]`.

## 7. REST (`/api/v1/...`)

| Metoda | Ścieżka | Auth | Uwagi |
|---|---|---|---|
| GET | `/notifications` | IsAuth | własne, cursor (-created_at) |
| GET | `/notifications/unread-count` | IsAuth | `{unread: n}` |
| POST | `/notifications/{id}/read` | IsAuth | mark read (404 jeśli cudze) |
| POST | `/notifications/read-all` | IsAuth | wszystkie własne → read |
| GET | `/stream/status` | AllowAny | bieżący `StreamStatus` |

Serializery: `NotificationSerializer` (id, kind, title, body, url, payload, read_at, created_at), `StreamStatusSerializer` (is_live, title, started_at). Cursor pagination dla listy.

## 8. Triggery (reprezentatywne 3)

- **community** (`services.create_post`): po utworzeniu opublikowanej odpowiedzi (nie pierwszej), jeśli `thread.author_id != user.id` → `notify(user=thread.author, kind=REPLY, title=..., url=thread, payload={"thread_slug"})`. Lazy import `notifications.services` (unik cyklu).
- **events** (`services.cancel_registration`): gdy promuje waitlisted→confirmed → `notify(user=promoted.user, kind=EVENT, ...)`.
- **membership** (`services.handle_webhook_event`, gdy INCOMPLETE→ACTIVE) → `notify(user=sub.user, kind=MEMBERSHIP, ...)`.
- **StreamStatus** signal (post_save) → `broadcast_stream_status`.

Wszystkie `notify()` wywołania lazy-importują `notifications.services` i są no-throw (push w try/except), więc nie psują głównej operacji.

## 9. Testy (InMemoryChannelLayer + pytest-asyncio)

- conftest: override `settings.CHANNEL_LAYERS` na `InMemoryChannelLayer` (autouse fixture); `pytest-asyncio` mode (markery `@pytest.mark.asyncio`).
- REST: list/unread-count/read (404 cudze)/read-all/auth(401); stream/status public.
- `TokenAuthMiddleware`: ważny token → `scope["user"]` zalogowany; brak/zły → Anonymous.
- Consumery (`channels.testing.WebsocketCommunicator`, `@pytest.mark.django_db(transaction=True)` + `asyncio`): authed NotificationConsumer connect → przyjęty, po `notify()` odbiera wiadomość; bez tokenu → odrzucony (close 4401); StatusConsumer public connect → przyjęty + dostaje bieżący status; po `broadcast_stream_status` odbiera update.
- Triggery: reply notuje autora (nie self); waitlist-promote notuje; webhook activation notuje. `notify()` no-throw gdy push pada.
- Cały istniejący suite (453) zielony pod in-memory layer.

## 10. Zarys tasków (rozwinie writing-plans; commit per task, EN, bez Co-Authored-By)

1. **ASGI/Channels scaffold**: deps + INSTALLED_APPS (daphne/channels) + CHANNEL_LAYERS + `asgi.py` ProtocolTypeRouter + `TokenAuthMiddleware` + app `notifications` skeleton + routing + compose web→daphne + conftest in-memory + pytest-asyncio. (test: middleware auth + trywialny connect)
2. **Models**: Notification + StreamStatus (singleton) + migracja + admin.
3. **REST**: notifications list/unread/read/read-all + stream/status + serializery/selectors.
4. **Consumery + serwisy**: NotificationConsumer + StatusConsumer + `notify()`/`broadcast_stream_status` + routing wired (channels tests).
5. **Triggery**: 3 hooki (reply/waitlist/sub-activated) + StreamStatus broadcast signal.
6. **Final**: pełny gate; compose/Dockerfile na daphne; rebuild verify (`daphne` + WS handshake).

**Definition of Done (B7b):** pełny `pytest` zielony pod in-memory layer (REST + consumery + triggery + niezłamana reszta), `ruff`/`format`/`check`/`makemigrations --check` czyste, WS `/ws/notifications` (auth) i `/ws/stream` (public) działają w testach, `notify()` push + REST odczyt spójne, compose/Dockerfile na ASGI(daphne).

**Następna faza:** B8 — Integracja frontu (`apiClient` → `/api/v1/`, WS klient na `/ws/*`, CORS, `VITE_API_URL`, migracja `api/*` Vercel).
