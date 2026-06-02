# Faza B7b — Channels (real-time) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Add Django Channels (ASGI + Redis channel layer) for in-app WebSocket notifications (per-user) with REST list/read, plus a public live-status broadcast. No web-push.

**Architecture:** `obskura/asgi.py` becomes a `ProtocolTypeRouter` (http→Django, websocket→`TokenAuthMiddleware`→`URLRouter`). New `notifications` app holds `Notification`+`StreamStatus` models, REST endpoints, two `AsyncWebsocketConsumer`s, and a `notify()` service that persists + pushes via the channel layer. Tests use `InMemoryChannelLayer` + `pytest-asyncio` (green without Redis/WS). `web` runs on **daphne**.

**Tech Stack:** Django 5.2, Channels 4, channels-redis, daphne, knox (WS auth), pytest-asyncio.

> **Konwencje:** commity ENGLISH, bez Co-Authored-By; branch `feat/backend-b7b-channels`; testy `docker compose run --rm web pytest`; `ruff`+`format` czyste; **Task 1 dodaje deps → rebuild obrazu po Tasku 1** (`docker compose build web`). Kontekst: [`docs/superpowers/specs/2026-06-02-backend-b7b-channels-design.md`](../specs/2026-06-02-backend-b7b-channels-design.md).

---

## Decyzje projektowe (rozstrzygnięte)
1. B7b Channels po B7a. In-app WS notifications + live-status; web-push deferred.
2. daphne (ASGI), auth WS = Knox `?token=`, test layer in-memory, StreamStatus singleton.
3. 3 triggery: reply→autor, waitlist-promote→user, sub-activation→user.

## File Structure
```
backend/obskura/asgi.py            # ProtocolTypeRouter (MODIFY)
backend/obskura/settings.py        # daphne/channels/notifications + CHANNEL_LAYERS (MODIFY)
backend/notifications/            # NEW app: models, serializers, selectors, services, views, urls,
                                  #   consumers, routing, middleware, signals, admin, migrations, tests
backend/conftest.py                # in-memory channel layer fixture (MODIFY)
backend/pyproject.toml             # asyncio_mode=auto (MODIFY)
backend/requirements/base.txt      # channels, channels-redis, daphne (MODIFY)
backend/requirements/dev.txt       # pytest-asyncio (MODIFY)
backend/docker-compose.yml         # web -> daphne (MODIFY); backend/Dockerfile CMD -> daphne (MODIFY)
Touched (triggers, Task 5): backend/community/services.py, backend/events/services.py, backend/membership/services.py
```

---

### Task 1: ASGI/Channels scaffold + TokenAuthMiddleware

**Files:** Modify `settings.py`, `obskura/asgi.py`, `conftest.py`, `pyproject.toml`, `requirements/base.txt`, `requirements/dev.txt`, `docker-compose.yml`, `Dockerfile`; Create `notifications/` skeleton (`__init__.py`, `apps.py`, `models.py`, `serializers.py`, `selectors.py`, `services.py`, `views.py`, `urls.py`, `consumers.py`, `routing.py`, `middleware.py`, `signals.py`, `admin.py`, `migrations/__init__.py`, `tests/__init__.py`), `notifications/tests/test_middleware.py`.

- [ ] **Step 1: deps + INSTALLED_APPS + CHANNEL_LAYERS.** `requirements/base.txt` += `channels~=4.1`, `channels-redis~=4.2`, `daphne~=4.1`. `requirements/dev.txt` += `pytest-asyncio~=0.24`. In `settings.py` INSTALLED_APPS: add `"daphne"` as the FIRST entry (before `"django.contrib.admin"`), `"channels"` in the third-party block, `"notifications"` at the end of local. Append:
```python
# --- Channels (real-time) ---
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [
                f"redis://{env('REDIS_HOST', default='redis')}:{env('REDIS_PORT', default='6379')}/2"
            ]
        },
    }
}
```
(ASGI_APPLICATION already = "obskura.asgi.application".) Install into running container: `docker compose run --rm web pip install "channels~=4.1" "channels-redis~=4.2" "daphne~=4.1" "pytest-asyncio~=0.24"` (ephemeral; rebuild after this task).

- [ ] **Step 2: notifications skeleton.** `apps.py`:
```python
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "notifications"

    def ready(self):
        from notifications import signals  # noqa: F401
```
Empty placeholder modules `models.py`, `serializers.py`, `selectors.py`, `services.py`, `views.py`, `signals.py`, `admin.py` (one-line comments); `urls.py` → `urlpatterns = []`; `routing.py` → `websocket_urlpatterns = []`; `migrations/__init__.py`, `tests/__init__.py` empty.

- [ ] **Step 3: `notifications/middleware.py`:**
```python
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser


@database_sync_to_async
def _user_from_token(token):
    from knox.auth import TokenAuthentication
    from rest_framework.exceptions import AuthenticationFailed

    if not token:
        return AnonymousUser()
    try:
        user, _auth = TokenAuthentication().authenticate_credentials(token.encode())
        return user
    except AuthenticationFailed:
        return AnonymousUser()


class TokenAuthMiddleware(BaseMiddleware):
    """Uwierzytelnianie WS po Knox tokenie z query stringa (?token=...)."""

    async def __call__(self, scope, receive, send):
        qs = parse_qs((scope.get("query_string") or b"").decode())
        token = (qs.get("token") or [None])[0]
        scope["user"] = await _user_from_token(token)
        return await super().__call__(scope, receive, send)
```

- [ ] **Step 4: `obskura/asgi.py`:**
```python
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

from notifications.middleware import TokenAuthMiddleware  # noqa: E402
from notifications.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": TokenAuthMiddleware(URLRouter(websocket_urlpatterns)),
    }
)
```

- [ ] **Step 5: conftest + pyproject.** In `backend/conftest.py` add autouse fixture:
```python
@pytest.fixture(autouse=True)
def _inmemory_channel_layer(settings):
    settings.CHANNEL_LAYERS = {"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}}
```
In `backend/pyproject.toml` under `[tool.pytest.ini_options]` add `asyncio_mode = "auto"`.

- [ ] **Step 6: failing middleware test** `notifications/tests/test_middleware.py`:
```python
import pytest
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from knox.models import AuthToken

from accounts.tests.factories import UserFactory
from notifications.middleware import TokenAuthMiddleware


class _Inner:
    def __init__(self):
        self.scope = None

    async def __call__(self, scope, receive, send):
        self.scope = scope


@pytest.mark.django_db(transaction=True)
async def test_middleware_sets_user_for_valid_token():
    user = await database_sync_to_async(UserFactory)()
    token = await database_sync_to_async(lambda: AuthToken.objects.create(user)[1])()
    inner = _Inner()
    mw = TokenAuthMiddleware(inner)
    scope = {"type": "websocket", "query_string": f"token={token}".encode()}
    await mw(scope, None, None)
    assert inner.scope["user"].id == user.id


@pytest.mark.django_db(transaction=True)
async def test_middleware_anonymous_for_bad_token():
    inner = _Inner()
    mw = TokenAuthMiddleware(inner)
    scope = {"type": "websocket", "query_string": b"token=bogus"}
    await mw(scope, None, None)
    assert isinstance(inner.scope["user"], AnonymousUser)
```
Run: `docker compose run --rm web pytest notifications/tests/test_middleware.py -q` → FAIL (no module yet) → after steps, PASS.

- [ ] **Step 7: compose + Dockerfile → daphne.** In `docker-compose.yml` change `web.command` to `daphne -b 0.0.0.0 -p 8000 obskura.asgi:application`. In `backend/Dockerfile` change CMD to `CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "obskura.asgi:application"]`.

- [ ] **Step 8: rebuild + run + commit.**
```bash
docker compose build web
docker compose run --rm web pytest notifications/tests/test_middleware.py -q
docker compose run --rm web pytest -q   # full suite green under in-memory layer
docker compose run --rm web ruff format notifications obskura && docker compose run --rm web ruff check .
docker compose run --rm web python manage.py check
git add backend && git commit -m "feat(notifications): Channels ASGI scaffold with Knox WS token middleware (B7b)"
```

---

### Task 2: Notification + StreamStatus models

**Files:** `notifications/models.py`, `notifications/admin.py`, migration, `notifications/tests/factories.py`, `notifications/tests/test_models.py`.

- [ ] **Step 1: failing model tests** — create Notification (read_at null default), StreamStatus.load() returns singleton (pk=1, second save keeps pk=1), is-unread helper.

- [ ] **Step 2: `notifications/models.py`:**
```python
from django.conf import settings
from django.db import models

from core.models import TimeStampedModel


class NotificationKind(models.TextChoices):
    SYSTEM = "system", "Systemowe"
    REPLY = "reply", "Odpowiedź"
    EVENT = "event", "Wydarzenie"
    MEMBERSHIP = "membership", "Subskrypcja"
    PATRONAGE = "patronage", "Patronat"


class Notification(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="użytkownik",
    )
    kind = models.CharField(max_length=16, choices=NotificationKind.choices, verbose_name="rodzaj")
    title = models.CharField(max_length=160, verbose_name="tytuł")
    body = models.TextField(blank=True, verbose_name="treść")
    url = models.CharField(max_length=300, blank=True, verbose_name="link")
    payload = models.JSONField(default=dict, blank=True, verbose_name="dane")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="przeczytano")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "powiadomienie"
        verbose_name_plural = "powiadomienia"
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["user", "read_at"]),
        ]

    def __str__(self):
        return f"notif u{self.user_id} [{self.kind}] {self.title}"


class StreamStatus(TimeStampedModel):
    """Singleton (pk=1) — status streamu na żywo dla nav 'stream-live'."""

    is_live = models.BooleanField(default=False, verbose_name="na żywo")
    title = models.CharField(max_length=200, blank=True, verbose_name="tytuł streamu")
    started_at = models.DateTimeField(null=True, blank=True, verbose_name="start")

    class Meta(TimeStampedModel.Meta):
        verbose_name = "status streamu"
        verbose_name_plural = "status streamu"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "LIVE" if self.is_live else "offline"
```

- [ ] **Step 3: factories + admin + makemigrations.** `NotificationFactory` (SubFactory UserFactory, kind SYSTEM, title seq). `admin.py`: register Notification (list_display user/kind/title/read_at/created_at, list_filter kind+read_at, search_fields title/user__email, list_select_related user, date_hierarchy created_at) + StreamStatus (list_display is_live/title/started_at). makemigrations notifications.

- [ ] **Step 4: run + commit** `feat(notifications): Notification and StreamStatus models with admin (B7b)`.

---

### Task 3: REST — notifications + stream/status

**Files:** `notifications/selectors.py`, `notifications/serializers.py`, `notifications/services.py` (mark-read helpers only here; notify in Task 4), `notifications/views.py`, `notifications/urls.py`, `notifications/pagination.py`, `notifications/tests/test_api.py`.

- [ ] **Step 1: failing API tests** — GET /notifications (own only, cursor, auth 401); GET /notifications/unread-count `{unread}`; POST /notifications/{id}/read sets read_at (404 for another user's); POST /notifications/read-all marks all own unread; GET /stream/status public returns current StreamStatus.

- [ ] **Step 2: selectors:**
```python
from notifications.models import Notification


def user_notifications(*, user):
    return Notification.objects.filter(user=user).order_by("-created_at")


def unread_count(*, user):
    return Notification.objects.filter(user=user, read_at__isnull=True).count()
```

- [ ] **Step 3: serializers** — `NotificationSerializer` (id, kind, title, body, url, payload, read_at, created_at; read_only), `StreamStatusSerializer` (is_live, title, started_at; read_only).

- [ ] **Step 4: pagination** — `NotificationCursorPagination(DefaultCursorPagination)` ordering `("-created_at", "-id")`.

- [ ] **Step 5: views + urls** — `NotificationListView` (GET, IsAuthenticated, paginated `user_notifications`), `UnreadCountView` (GET → `{"unread": unread_count(...)}`), `MarkReadView` (POST `notifications/<int:pk>/read`: `get_object_or_404(Notification, pk=pk, user=request.user)`, set read_at=now if null, return serialized), `MarkAllReadView` (POST `notifications/read-all`: update own unread → read_at=now, return `{"updated": n}`), `StreamStatusView` (GET `stream/status`, AllowAny → `StreamStatus.load()`). urls explicit paths.

- [ ] **Step 6: run + commit** `feat(notifications): REST list/unread/read endpoints and stream status (B7b)`.

---

### Task 4: Consumers + notify()/broadcast services + routing

**Files:** `notifications/services.py` (add notify + broadcast + _push), `notifications/consumers.py`, `notifications/routing.py`, `notifications/tests/test_consumers.py`.

- [ ] **Step 1: failing consumer tests** (`channels.testing.WebsocketCommunicator`, `@pytest.mark.django_db(transaction=True)`, async): authed NotificationConsumer connects (token in query) → accepted; after `notify(user=...)` → communicator receives JSON with the title; no-token connect → rejected (not connected); StatusConsumer connects (public) → accepted + first frame is current status; after `broadcast_stream_status` → receives update. Also a `notify()` persists a Notification row.

- [ ] **Step 2: services:**
```python
from django.db import transaction


@transaction.atomic
def notify(*, user, kind, title, body="", url="", payload=None):
    from notifications.models import Notification
    from notifications.serializers import NotificationSerializer

    n = Notification.objects.create(
        user=user, kind=kind, title=title, body=body, url=url, payload=payload or {}
    )
    _push(f"notif.user.{user.id}", "notify.message", NotificationSerializer(n).data)
    return n


def broadcast_stream_status(status):
    from notifications.serializers import StreamStatusSerializer

    _push("stream_status", "status.message", StreamStatusSerializer(status).data)


def _push(group, msg_type, data):
    """Best-effort push do channel layer; brak warstwy/Redis nie wywala operacji."""
    from asgiref.sync import async_to_sync
    from channels.layers import get_channel_layer

    layer = get_channel_layer()
    if layer is None:
        return
    try:
        async_to_sync(layer.group_send)(group, {"type": msg_type, "data": data})
    except Exception:  # noqa: BLE001 — push jest pomocniczy; notyfikacja jest w bazie
        pass
```

- [ ] **Step 3: consumers:**
```python
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if user is None or not user.is_authenticated:
            await self.close(code=4401)
            return
        self.group = f"notif.user.{user.id}"
        await self.channel_layer.group_add(self.group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "group"):
            await self.channel_layer.group_discard(self.group, self.channel_name)

    async def notify_message(self, event):
        await self.send(text_data=json.dumps(event["data"], default=str))


class StatusConsumer(AsyncWebsocketConsumer):
    GROUP = "stream_status"

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP, self.channel_name)
        await self.accept()
        from notifications.models import StreamStatus
        from notifications.serializers import StreamStatusSerializer

        status = await database_sync_to_async(StreamStatus.load)()
        await self.send(text_data=json.dumps(StreamStatusSerializer(status).data, default=str))

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.GROUP, self.channel_name)

    async def status_message(self, event):
        await self.send(text_data=json.dumps(event["data"], default=str))
```

- [ ] **Step 4: routing** — replace `websocket_urlpatterns = []` with:
```python
from django.urls import re_path

from notifications.consumers import NotificationConsumer, StatusConsumer

websocket_urlpatterns = [
    re_path(r"^ws/notifications$", NotificationConsumer.as_asgi()),
    re_path(r"^ws/stream$", StatusConsumer.as_asgi()),
]
```

- [ ] **Step 5: run + commit** `feat(notifications): WS consumers, notify() push and stream broadcast (B7b)`.

> Test note: consumer tests need a real Knox token; build the WS URL as `f"/ws/notifications?token={token}"` and pass it to `WebsocketCommunicator(application, path)` where `application = obskura.asgi.application`. Use `@pytest.mark.django_db(transaction=True)` so the async token lookup sees committed rows; always `await communicator.disconnect()`.

---

### Task 5: Triggers + StreamStatus broadcast signal

**Files:** Modify `community/services.py`, `events/services.py`, `membership/services.py`, `notifications/signals.py`; `notifications/tests/test_triggers.py`.

- [ ] **Step 1: failing trigger tests** — create reply (published, different author) → thread author gets a Notification (kind reply); replying to own thread → no self-notification; events cancel that promotes waitlisted → promoted user gets a Notification (kind event); membership webhook activation (INCOMPLETE→ACTIVE) → sub user gets Notification (kind membership); saving StreamStatus → broadcast called (assert via a notification or that `broadcast_stream_status` runs without error). `notify()` must be no-throw even if push fails.

- [ ] **Step 2: community trigger.** In `community/services.py` `create_post`, after the post is created and is PUBLISHED and `thread.author_id != user.id`, call (lazy import):
```python
    if post.status == PostStatus.PUBLISHED and thread.author_id != user.id:
        from notifications.services import notify
        from notifications.models import NotificationKind

        notify(
            user=thread.author,
            kind=NotificationKind.REPLY,
            title="Nowa odpowiedź w Twoim wątku",
            url=f"/forum/{thread.slug}",
            payload={"thread_slug": thread.slug, "post_id": post.id},
        )
```

- [ ] **Step 3: events trigger.** In `events/services.py` `cancel_registration`, where a WAITLISTED registration is promoted to CONFIRMED, after `promote.save(...)`:
```python
        from notifications.models import NotificationKind
        from notifications.services import notify

        notify(
            user=promote.user,
            kind=NotificationKind.EVENT,
            title="Zwolniło się miejsce — masz potwierdzony zapis",
            url=f"/events/{event.slug}",
            payload={"event_slug": event.slug},
        )
```

- [ ] **Step 4: membership trigger.** In `membership/services.py` `handle_webhook_event`, in the subscription-activation branch (INCOMPLETE→ACTIVE), after `sub.save(...)`:
```python
                from notifications.models import NotificationKind
                from notifications.services import notify

                notify(
                    user=sub.user,
                    kind=NotificationKind.MEMBERSHIP,
                    title="Subskrypcja aktywna",
                    payload={"plan": sub.plan.code},
                )
```

- [ ] **Step 5: StreamStatus broadcast signal.** `notifications/signals.py`:
```python
from django.db.models.signals import post_save
from django.dispatch import receiver

from notifications.models import StreamStatus


@receiver(post_save, sender=StreamStatus)
def _broadcast_status(sender, instance, **kwargs):
    from notifications.services import broadcast_stream_status

    broadcast_stream_status(instance)
```
(NotificationsConfig.ready already imports signals.)

- [ ] **Step 6: run + commit** `feat(notifications): reply/waitlist/subscription triggers and stream-status broadcast (B7b)`.

---

### Task 6: Final gate
- [ ] **Step 1:** Full `docker compose run --rm web pytest -q` GREEN (REST + middleware + consumers + triggers + untouched suite under in-memory layer). `ruff check .` / `ruff format --check .` / `manage.py check` / `makemigrations --check --dry-run` clean.
- [ ] **Step 2 (post-rebuild, poza CI):** `docker compose build web && docker compose up -d` then a quick WS handshake check (e.g. `daphne` serves; `/ws/stream` accepts). If out of scope, note it.
- [ ] **Step 3:** commit any outstanding (e.g. README backend note on ASGI/daphne + ws endpoints) `docs(backend): note ASGI/daphne and ws endpoints (B7b)` (optional).

---

## Definition of Done (B7b)
- [ ] Pełny `pytest` zielony pod in-memory layer (REST + middleware + consumery + triggery + niezłamana reszta — 453+).
- [ ] `ruff check .` / `ruff format --check .` / `manage.py check` / `makemigrations --check --dry-run` czyste (migracja notifications zacommitowana).
- [ ] WS `/ws/notifications` (auth Knox) + `/ws/stream` (public) działają w testach; `notify()` push + REST odczyt spójne; 3 triggery notują; StreamStatus broadcast.
- [ ] `web`/Dockerfile na daphne; channels/channels-redis/daphne w requirements; obraz przebudowany.
- [ ] Commit per task, EN, bez Co-Authored-By.

**Następna faza:** B8 — Integracja frontu (`apiClient` → `/api/v1/`, klient WS `/ws/*`, CORS, `VITE_API_URL`, migracja `api/*` Vercel).
