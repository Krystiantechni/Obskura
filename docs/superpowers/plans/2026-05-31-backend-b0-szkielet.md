# Faza B0 — Szkielet backendu OBSKURA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Postawić działający szkielet backendu Django w `backend/` (monorepo), uruchamialny przez `docker compose up`, z bazową appką `core`, env-based settings, endpointem `/api/v1/health/` i CI.

**Architecture:** Monorepo — backend w katalogu `backend/` obok frontu. Konfiguracja projektu w `obskura/` (settings env-based: `SQL_ENGINE`, `REDIS_HOST`, `SECRET_KEY`). Bazowa app `core` dostarcza abstrakcyjne modele (`TimeStampedModel`, `SoftDeleteModel`), klasy paginacji i healthcheck. Cały stack (web + Postgres 16 + Redis 7) chodzi w `docker compose`. Testy uruchamiane wewnątrz kontenera `web` (ma dostęp do DB+Redis). CI replikuje to przez service containers.

**Tech Stack:** Django 5.2 (LTS) · DRF 3.15 · django-rest-knox 5 · PostgreSQL 16 (`psycopg[binary]`) · django-redis · django-cors-headers · django-filter · gunicorn · pytest + pytest-django + factory_boy · ruff · django-debug-toolbar + nplusone (dev guard).

> **Uwaga o wersjach:** numery poniżej są orientacyjne (stan ~początek 2026). Przy instalacji rozwiąż najnowsze kompatybilne patche; nie nadpinuj tak, żeby blokować bugfixy.

> **Profil projektu:** portfolio (zob. `docs/superpowers/specs/2026-05-31-backend-decisions-design.md`). Deploy na Oracle dopiero w B8 — B0 w całości lokalnie w Dockerze.

---

## File Structure

```
backend/
  manage.py
  pyproject.toml             # config ruff + pytest (NIE deps)
  requirements/
    base.txt                 # zależności produkcyjne
    dev.txt                  # base + narzędzia dev/test
  .env.example               # wzór zmiennych (bez wartości)
  .dockerignore
  Dockerfile                 # python:3.13-slim
  docker-compose.yml         # web + db(postgres16) + redis7
  obskura/                   # config projektu
    __init__.py
    settings.py              # env-based
    urls.py                  # /api/v1/ root
    wsgi.py
    asgi.py                  # placeholder pod Channels (B7)
  core/                      # bazowa app
    __init__.py
    apps.py
    models.py                # TimeStampedModel, SoftDeleteModel + manager
    pagination.py            # DefaultCursorPagination, DefaultPageNumberPagination
    views.py                 # HealthView
    urls.py                  # /health/
    migrations/__init__.py
    tests/
      __init__.py
      test_models.py
      test_health.py
.github/workflows/
  backend-ci.yml             # ruff + pytest (w repo root, NIE w backend/)
```

**Odpowiedzialności:**
- `obskura/settings.py` — jedyne źródło konfiguracji, wszystko z env (zero sekretów w kodzie).
- `core/models.py` — abstrakcyjne mixiny dziedziczone przez WSZYSTKIE modele domenowe (B1+).
- `core/pagination.py` — domyślne klasy paginacji wpięte w `REST_FRAMEWORK`.
- `core/views.py` — `HealthView`: jedyny endpoint w B0, sprawdza DB+cache (smoke test do deployu).

**Kanoniczny command testowy:** `docker compose run --rm web pytest` (kontener ma DB+Redis).

---

## Task 1: Bootstrap projektu + deps + env-based settings

**Files:**
- Create: `backend/manage.py`
- Create: `backend/requirements/base.txt`, `backend/requirements/dev.txt`
- Create: `backend/pyproject.toml`
- Create: `backend/.env.example`, `backend/.dockerignore`
- Create: `backend/obskura/__init__.py`, `settings.py`, `urls.py`, `wsgi.py`, `asgi.py`
- Create: `backend/core/__init__.py`, `apps.py`, `migrations/__init__.py` (pusta app — modele w Task 3)
- Modify: `.gitignore` (dodać `backend/.env`)

- [ ] **Step 1: requirements**

`backend/requirements/base.txt`:
```
Django~=5.2.0
djangorestframework~=3.15.2
django-rest-knox~=5.0.2
psycopg[binary]~=3.2.3
django-environ~=0.11.2
django-redis~=5.4.0
django-cors-headers~=4.6.0
django-filter~=24.3
gunicorn~=23.0.0
```

`backend/requirements/dev.txt`:
```
-r base.txt
pytest~=8.3.3
pytest-django~=4.9.0
factory-boy~=3.3.1
ruff~=0.8.0
django-debug-toolbar~=4.4.6
nplusone~=1.0.0
```

- [ ] **Step 2: pyproject.toml (ruff + pytest)**

`backend/pyproject.toml`:
```toml
[tool.ruff]
line-length = 100
target-version = "py313"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B", "DJ"]

[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "obskura.settings"
python_files = ["test_*.py", "tests.py"]
addopts = "-q --reuse-db"
```

- [ ] **Step 3: manage.py**

`backend/manage.py`:
```python
#!/usr/bin/env python
import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Nie można zaimportować Django. Czy aktywne jest środowisko z zależnościami?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: env-based settings**

`backend/obskura/__init__.py`: (pusty plik)

`backend/obskura/settings.py`:
```python
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    CORS_ALLOWED_ORIGINS=(list, ["http://localhost:5188"]),
    SQL_ENGINE=(str, "django.db.backends.postgresql"),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="dev-insecure-change-me")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # third-party
    "rest_framework",
    "knox",
    "corsheaders",
    "django_filters",
    # local
    "core",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "obskura.urls"
WSGI_APPLICATION = "obskura.wsgi.application"
ASGI_APPLICATION = "obskura.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        "ENGINE": env("SQL_ENGINE"),
        "NAME": env("SQL_DATABASE", default="database-obskura"),
        "USER": env("SQL_USER", default="obskura"),
        "PASSWORD": env("SQL_PASSWORD", default="obskura"),
        "HOST": env("SQL_HOST", default="db"),
        "PORT": env("SQL_PORT", default="5432"),
        "CONN_MAX_AGE": env.int("CONN_MAX_AGE", default=60),
    }
}

REDIS_URL = f"redis://{env('REDIS_HOST', default='redis')}:{env('REDIS_PORT', default='6379')}/0"
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {"CLIENT_CLASS": "django_redis.client.DefaultClient"},
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("knox.auth.TokenAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.DefaultCursorPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {"anon": "60/min", "user": "1000/day"},
}

CORS_ALLOWED_ORIGINS = env("CORS_ALLOWED_ORIGINS")

LANGUAGE_CODE = "pl"
TIME_ZONE = "Europe/Warsaw"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- dev guard: wykrywanie N+1 i debug toolbar (tylko DEBUG=True) ---
if DEBUG:
    INSTALLED_APPS += ["debug_toolbar"]
    MIDDLEWARE = [
        "nplusone.ext.django.NPlusOneMiddleware",
        "debug_toolbar.middleware.DebugToolbarMiddleware",
        *MIDDLEWARE,
    ]
    INTERNAL_IPS = ["127.0.0.1"]
    # W Dockerze IP klienta != 127.0.0.1 — pokazuj toolbar zawsze w DEBUG:
    DEBUG_TOOLBAR_CONFIG = {"SHOW_TOOLBAR_CALLBACK": lambda request: True}
    NPLUSONE_RAISE = False  # loguje N+1; ustaw True by twardo failować
```

- [ ] **Step 5: urls / wsgi / asgi**

`backend/obskura/urls.py`:
```python
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("core.urls")),
]
```

`backend/obskura/wsgi.py`:
```python
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")
application = get_wsgi_application()
```

`backend/obskura/asgi.py`:
```python
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "obskura.settings")
# Channels rozszerzy to w fazie B7 (ProtocolTypeRouter).
application = get_asgi_application()
```

- [ ] **Step 6: pusta app core (modele w Task 3)**

`backend/core/__init__.py`: (pusty)
`backend/core/migrations/__init__.py`: (pusty)

`backend/core/apps.py`:
```python
from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"
```

`backend/core/urls.py` (placeholder — `HealthView` w Task 5):
```python
from django.urls import path

urlpatterns: list = []
```

- [ ] **Step 7: .env.example + .dockerignore + .gitignore**

`backend/.env.example`:
```
# Django
SECRET_KEY=dev-insecure-change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5188

# PostgreSQL (engine z env — jak imroi)
SQL_ENGINE=django.db.backends.postgresql
SQL_DATABASE=database-obskura
SQL_USER=obskura
SQL_PASSWORD=obskura
SQL_HOST=db
SQL_PORT=5432
CONN_MAX_AGE=60

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
```

`backend/.dockerignore`:
```
__pycache__/
*.pyc
.env
.pytest_cache/
.ruff_cache/
*.sqlite3
.git/
```

Dopisz do `.gitignore` (root) linię: `backend/.env`

- [ ] **Step 8: Commit**

```bash
git add backend/ .gitignore
git commit -m "feat(backend): bootstrap Django project + env-based settings (B0)"
```

---

## Task 2: Docker — web + Postgres 16 + Redis 7

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/docker-compose.yml`

- [ ] **Step 1: Dockerfile**

`backend/Dockerfile`:
```dockerfile
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/dev.txt

COPY . .

EXPOSE 8000
CMD ["gunicorn", "obskura.wsgi:application", "--bind", "0.0.0.0:8000"]
```

> `psycopg[binary]` zawiera libpq — nie trzeba `apt-get install libpq-dev`.

- [ ] **Step 2: docker-compose.yml**

`backend/docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${SQL_DATABASE:-database-obskura}
      POSTGRES_USER: ${SQL_USER:-obskura}
      POSTGRES_PASSWORD: ${SQL_PASSWORD:-obskura}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${SQL_USER:-obskura}"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/app
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  pgdata:
```

- [ ] **Step 3: Utwórz .env i zbuduj obraz**

Run:
```bash
cd backend && cp .env.example .env && docker compose build
```
Expected: build kończy się `Successfully built` / `naming to ...web`, bez błędów pip.

- [ ] **Step 4: Weryfikacja — Django widzi konfigurację**

Run:
```bash
docker compose run --rm web python manage.py check
```
Expected: `System check identified no issues (0 silenced).`

- [ ] **Step 5: Commit**

```bash
git add backend/Dockerfile backend/docker-compose.yml
git commit -m "feat(backend): docker-compose web+postgres16+redis7 (B0)"
```

---

## Task 3: core — abstrakcyjne modele bazowe (TDD)

**Files:**
- Create: `backend/core/tests/__init__.py`
- Create: `backend/core/tests/test_models.py`
- Modify: `backend/core/models.py`

- [ ] **Step 1: Napisz failing test**

`backend/core/tests/__init__.py`: (pusty)

`backend/core/tests/test_models.py`:
```python
from core.models import SoftDeleteModel, TimeStampedModel


def test_timestamped_is_abstract():
    assert TimeStampedModel._meta.abstract is True
    field_names = {f.name for f in TimeStampedModel._meta.get_fields()}
    assert {"created_at", "updated_at"} <= field_names


def test_softdelete_is_abstract():
    assert SoftDeleteModel._meta.abstract is True
    field_names = {f.name for f in SoftDeleteModel._meta.get_fields()}
    assert {"is_deleted", "deleted_at"} <= field_names


def test_softdelete_has_manager_with_alive_filter():
    # Manager domyślny zwraca tylko żywe; all_objects zwraca wszystko.
    assert hasattr(SoftDeleteModel, "objects")
    assert hasattr(SoftDeleteModel, "all_objects")
```

- [ ] **Step 2: Uruchom test — ma FAILować**

Run: `docker compose run --rm web pytest core/tests/test_models.py -v`
Expected: FAIL — `ImportError: cannot import name 'SoftDeleteModel' from 'core.models'`

- [ ] **Step 3: Implementacja modeli**

`backend/core/models.py`:
```python
from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Bazowy mixin: znaczniki czasu z indeksem na created_at (sort/filtry)."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def delete(self):
        return self.update(is_deleted=True, deleted_at=timezone.now())


class SoftDeleteManager(models.Manager):
    """Domyślny manager — zwraca tylko nieusunięte rekordy."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class SoftDeleteModel(models.Model):
    """Soft-delete: `objects` = żywe, `all_objects` = wszystkie."""

    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])
```

- [ ] **Step 4: Uruchom test — ma PRZEJŚĆ**

Run: `docker compose run --rm web pytest core/tests/test_models.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/core/models.py backend/core/tests/
git commit -m "feat(core): TimeStampedModel + SoftDeleteModel z managerem (B0)"
```

---

## Task 4: core — domyślne klasy paginacji

**Files:**
- Create: `backend/core/pagination.py`
- Create: `backend/core/tests/test_pagination.py`

- [ ] **Step 1: Napisz failing test**

`backend/core/tests/test_pagination.py`:
```python
from rest_framework.pagination import CursorPagination, PageNumberPagination

from core.pagination import DefaultCursorPagination, DefaultPageNumberPagination


def test_cursor_pagination_defaults():
    p = DefaultCursorPagination()
    assert issubclass(DefaultCursorPagination, CursorPagination)
    assert p.page_size == 20
    assert p.ordering == "-created_at"
    assert p.max_page_size == 100


def test_pagenumber_pagination_defaults():
    p = DefaultPageNumberPagination()
    assert issubclass(DefaultPageNumberPagination, PageNumberPagination)
    assert p.page_size == 20
    assert p.page_size_query_param == "page_size"
    assert p.max_page_size == 100
```

- [ ] **Step 2: Uruchom test — ma FAILować**

Run: `docker compose run --rm web pytest core/tests/test_pagination.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'core.pagination'`

- [ ] **Step 3: Implementacja**

`backend/core/pagination.py`:
```python
from rest_framework.pagination import CursorPagination, PageNumberPagination


class DefaultCursorPagination(CursorPagination):
    """Dla rosnących list (odcinki, posty, historia) — stabilna przy dopisywaniu."""

    page_size = 20
    max_page_size = 100
    page_size_query_param = "page_size"
    ordering = "-created_at"


class DefaultPageNumberPagination(PageNumberPagination):
    """Dla list skończonych (gatunki, plany, kategorie)."""

    page_size = 20
    max_page_size = 100
    page_size_query_param = "page_size"
```

- [ ] **Step 4: Uruchom test — ma PRZEJŚĆ**

Run: `docker compose run --rm web pytest core/tests/test_pagination.py -v`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add backend/core/pagination.py backend/core/tests/test_pagination.py
git commit -m "feat(core): domyślne klasy paginacji Cursor/PageNumber (B0)"
```

---

## Task 5: Healthcheck `/api/v1/health/` (TDD)

**Files:**
- Create: `backend/core/tests/test_health.py`
- Modify: `backend/core/views.py`
- Modify: `backend/core/urls.py`

- [ ] **Step 1: Napisz failing test**

`backend/core/tests/test_health.py`:
```python
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_health_returns_ok():
    client = APIClient()
    res = client.get("/api/v1/health/")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert body["cache"] == "ok"


@pytest.mark.django_db
def test_health_is_public():
    # Health musi być dostępny bez tokenu (monitoring/deploy smoke test).
    client = APIClient()
    res = client.get("/api/v1/health/")
    assert res.status_code != 401
    assert res.status_code != 403
```

- [ ] **Step 2: Uruchom test — ma FAILować**

Run: `docker compose run --rm web pytest core/tests/test_health.py -v`
Expected: FAIL — 404 (route nie istnieje) → asercja `status_code == 200` nie przechodzi

- [ ] **Step 3: Implementacja widoku**

`backend/core/views.py`:
```python
from django.core.cache import cache
from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Publiczny smoke test: DB + cache. Używany przez monitoring i deploy."""

    permission_classes = [AllowAny]
    authentication_classes: list = []
    throttle_classes: list = []

    def get(self, request):
        db_ok = self._check_db()
        cache_ok = self._check_cache()
        healthy = db_ok and cache_ok
        return Response(
            {
                "status": "ok" if healthy else "degraded",
                "database": "ok" if db_ok else "error",
                "cache": "ok" if cache_ok else "error",
            },
            status=200 if healthy else 503,
        )

    @staticmethod
    def _check_db() -> bool:
        try:
            connection.ensure_connection()
            return True
        except Exception:
            return False

    @staticmethod
    def _check_cache() -> bool:
        try:
            cache.set("__health__", "1", 5)
            return cache.get("__health__") == "1"
        except Exception:
            return False
```

- [ ] **Step 4: Podłącz route**

`backend/core/urls.py`:
```python
from django.urls import path

from core.views import HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
]
```

- [ ] **Step 5: Uruchom test — ma PRZEJŚĆ**

Run: `docker compose run --rm web pytest core/tests/test_health.py -v`
Expected: PASS (2 passed)

- [ ] **Step 6: Smoke test ręczny (cały stack)**

Run:
```bash
docker compose up -d
docker compose exec web python manage.py migrate
curl -s http://localhost:8000/api/v1/health/
```
Expected: `{"status":"ok","database":"ok","cache":"ok"}`
Potem: `docker compose down`

- [ ] **Step 7: Commit**

```bash
git add backend/core/views.py backend/core/urls.py backend/core/tests/test_health.py
git commit -m "feat(core): endpoint /api/v1/health/ (DB+cache smoke test) (B0)"
```

---

## Task 6: CI — GitHub Actions (ruff + pytest)

**Files:**
- Create: `.github/workflows/backend-ci.yml`

- [ ] **Step 1: Workflow**

`.github/workflows/backend-ci.yml`:
```yaml
name: backend-ci

on:
  push:
    paths: ["backend/**", ".github/workflows/backend-ci.yml"]
  pull_request:
    paths: ["backend/**", ".github/workflows/backend-ci.yml"]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: database-obskura
          POSTGRES_USER: obskura
          POSTGRES_PASSWORD: obskura
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U obskura"
          --health-interval 5s --health-timeout 3s --health-retries 5
      redis:
        image: redis:7
        ports: ["6379:6379"]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 5s --health-timeout 3s --health-retries 5
    env:
      SECRET_KEY: ci-secret-not-for-prod
      DEBUG: "False"
      SQL_HOST: localhost
      SQL_PORT: "5432"
      REDIS_HOST: localhost
      REDIS_PORT: "6379"
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
          cache: pip
      - run: pip install -r requirements/dev.txt
      - run: ruff check .
      - run: ruff format --check .
      - run: pytest
```

- [ ] **Step 2: Weryfikacja lokalna (to co odpali CI)**

Run:
```bash
cd backend
docker compose run --rm web ruff check .
docker compose run --rm web ruff format --check .
docker compose run --rm web pytest
```
Expected: ruff bez błędów; `pytest` — wszystkie testy PASS (7 passed).

> Jeśli `ruff format --check` zgłasza różnice: `docker compose run --rm web ruff format .`, sprawdź diff, commit.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/backend-ci.yml
git commit -m "ci(backend): ruff + pytest na postgres/redis service containers (B0)"
```

---

## Definition of Done (B0)

- [ ] `docker compose up` startuje web + db + redis bez błędów.
- [ ] `docker compose run --rm web python manage.py check` — 0 issues.
- [ ] `docker compose run --rm web pytest` — wszystkie testy zielone (7).
- [ ] `curl http://localhost:8000/api/v1/health/` → `{"status":"ok","database":"ok","cache":"ok"}`.
- [ ] `ruff check .` + `ruff format --check .` czyste.
- [ ] CI `backend-ci.yml` przechodzi na GitHub po push.
- [ ] Zero sekretów w repo (`.env` w `.gitignore`, tylko `.env.example` commitowany).

**Następna faza:** B1 — Auth + accounts (`accounts.User` email-login, Knox register/login/me/prefs, throttling). Walidacja lustrzana do `src/lib/formSchemas.js`.
