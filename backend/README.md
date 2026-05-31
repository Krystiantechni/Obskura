# OBSKURA — backend

Backend platformy audio-horror OBSKURA. **Django 5.2 + DRF + Knox + PostgreSQL 16 + Redis 7**, w pełni w Dockerze.

> Profil: projekt portfolio. Pełne decyzje architektoniczne: [`docs/superpowers/specs/2026-05-31-backend-decisions-design.md`](../docs/superpowers/specs/2026-05-31-backend-decisions-design.md). Plan i fazy: [`BACKEND-PLAN.md`](../BACKEND-PLAN.md).

## Szybki start

```bash
cd backend
cp .env.example .env          # zmienne dev (gitignored)
docker compose up -d          # web + postgres16 + redis7
docker compose exec web python manage.py migrate
curl -s http://localhost:8000/api/v1/health/
# → {"status":"ok","database":"ok","cache":"ok"}
```

Zatrzymanie: `docker compose down` (dodaj `-v`, by skasować wolumen bazy).

## Testy i lint

```bash
docker compose run --rm web pytest                 # testy (pytest + django)
docker compose run --rm web ruff check .           # lint
docker compose run --rm web ruff format --check .  # formatowanie
docker compose run --rm web python manage.py check # kontrola konfiguracji
```

## Struktura

```
backend/
  obskura/        # config projektu: settings (env-based), urls, wsgi, asgi
  core/           # bazowa app: TimeStampedModel, SoftDeleteModel, paginacja, /health/
  requirements/   # base.txt (prod) + dev.txt (testy/lint)
  Dockerfile · docker-compose.yml · pyproject.toml (ruff + pytest)
```

## Konfiguracja (env)

Wszystkie ustawienia z env (zob. `.env.example`): `SECRET_KEY`, `DEBUG`, `SQL_*` (engine z `SQL_ENGINE`), `REDIS_*`, `CORS_ALLOWED_ORIGINS`. W kontenerze `SQL_HOST=db`, `REDIS_HOST=redis` (nazwy serwisów compose).

## Faza

**B0 — Szkielet** (ukończona): projekt, env-based settings, `core` (modele bazowe + paginacja + healthcheck), Docker, CI. Następna: **B1 — Auth + accounts** (Knox, `accounts.User`).
