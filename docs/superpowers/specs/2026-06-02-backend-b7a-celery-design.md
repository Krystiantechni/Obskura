# Faza B7a — Celery + async — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-02. Pierwszy z dwóch podsystemów B7 (async). Drugi: **B7b — Channels** (WebSockety/notifications/live-status — osobny spec później).
> Wzorzec seam-zewnętrzny jak `core/email.py` (Resend). Reuse istniejących serwisów membership/events/playback.

---

## 1. Cel

Asynchroniczne przetwarzanie przez **Celery + beat** (broker Redis): maile wychodzą poza request (`core.tasks.send_email_task`), **bulk-wysyłka kampanii** newslettera (domyka odłożone z B6), oraz **periodyczne joby** (wygaszanie subskrypcji, sprzątanie porzuconych `pending`, self-heal statystyk). Bez Channels (to B7b).

## 2. Decyzje (rozstrzygnięte z userem)

1. **Split B7** — B7a Celery (ten spec) najpierw, B7b Channels później.
2. **Zakres Celery** — async maile + bulk newsletter + periodic expiry/cleanup/stats. Narracja (ElevenLabs) deferred (T8 zablokowane).
3. **Runtime** — docker-compose dostaje `worker`+`beat`; `requirements` += `celery[redis]`; rebuild obrazu do żywego runtime. Testy na **Celery eager** (zielone bez workerów).
4. **Statyczny `CELERY_BEAT_SCHEDULE`** (bez `django-celery-beat` — stały zestaw jobów, zero migracji). Broker = Redis **db 1** (cache zostaje na db 0). `task_ignore_result=True` (fire-and-forget).
5. Konwencje 1:1 jak reszta repo (pytest, ruff). Tasks autodiscover w `<app>/tasks.py`.

### Świadomie poza zakresem B7a (deferred)
- Channels/WebSockety/`notifications`/live-status/push → **B7b**.
- Generowanie narracji audio (ElevenLabs — zablokowane).
- `django-celery-beat` (admin-editowalny harmonogram), retry/backoff/dead-letter policies, Flower, result backend.

---

## 3. Architektura

- `backend/obskura/celery.py` — `app = Celery("obskura")`, `app.config_from_object("django.conf:settings", namespace="CELERY")`, `app.autodiscover_tasks()`. `backend/obskura/__init__.py` → `from .celery import app as celery_app` + `__all__`.
- Zadania w `<app>/tasks.py` (autodiscover): `core`, `newsletter`, `membership`, `events`, `playback`.
- Settings (`CELERY_*` namespace): `CELERY_BROKER_URL` (redis db1), `CELERY_TASK_IGNORE_RESULT=True`, `CELERY_TASK_ALWAYS_EAGER=env.bool(default False)`, `CELERY_TASK_EAGER_PROPAGATES=True`, `CELERY_TIMEZONE=TIME_ZONE`, `CELERY_BEAT_SCHEDULE` (statyczny).
- docker-compose: + `worker` (`celery -A obskura worker -l info`) + `beat` (`celery -A obskura beat -l info`), oba zależne od `db`+`redis`, ten sam obraz/env co `web`. `requirements/base.txt` += `celery[redis]~=5.4`.
- `web` bez zmian (Celery nie wymaga ASGI).

Touched: `obskura/__init__.py`, `obskura/celery.py` (new), `obskura/settings.py`, `docker-compose.yml`, `requirements/base.txt`, `core/tasks.py` (new), `newsletter/{tasks.py,services.py,admin.py,management/commands/send_campaign.py}`, `support/services.py`, `membership/tasks.py`, `events/tasks.py`, `playback/tasks.py`, `conftest.py`.

---

## 4. Zadania

### core.tasks.send_email_task
```python
@shared_task
def send_email_task(to, subject, html, reply_to=None):
    from core.email import send_email
    return send_email(to=to, subject=subject, html=html, reply_to=reply_to)
```
`support.services.create_ticket` i `newsletter.services.subscribe` przechodzą z synchronicznego `send_email(...)` na `send_email_task.delay(to=..., subject=..., html=..., reply_to=...)`. Treść maila jest argumentem taska (nie id z bazy) → brak race'a read-after-enqueue. W testach eager → wykonuje się inline, istniejące asercje (mock `core.email.send_email`) nadal przechodzą.

### newsletter.tasks.send_campaign_task(campaign_code, freq=None)
Iteruje aktywnych subskrybentów (`Subscriber.is_active=True`, opcjonalny filtr `freq`), dla każdego enqueue `send_email_task.delay(...)` z treścią z `Campaign` (label/purpose). Zwraca liczbę zakolejkowanych. Trigger: **management command `send_campaign <code> [--freq week]`** + akcja w `newsletter/admin.py` (CampaignAdmin action „Wyślij do subskrybentów"). Brak publicznego endpointu.

### Periodic (beat)
- `membership.tasks.expire_subscriptions()` — `Subscription` status∈{trialing,active} i `period_end < now` → `EXPIRED`. Codziennie (crontab 03:00).
- `membership.tasks.cleanup_stale_pending()` — `incomplete` subskrypcje + `pending` patronaty z `created_at < now-24h` → `EXPIRED`/`CANCELED`. Co godzinę.
- `events.tasks.cleanup_stale_registrations()` — `pending` rejestracje z `created_at < now-24h` → `CANCELED`. Co godzinę.
- `playback.tasks.recompute_all_ratings()` — self-heal: dla każdego odcinka przelicz `rating_avg` z `Rating` (Avg) na `Episode.all_objects` (defensywnie wobec driftu). Codziennie (crontab 04:00).

`CELERY_BEAT_SCHEDULE` w settings mapuje powyższe na crontaby.

---

## 5. Testy (Celery eager)

`backend/conftest.py` autouse fixture: ustawia `settings.CELERY_TASK_ALWAYS_EAGER=True`, `settings.CELERY_TASK_EAGER_PROPAGATES=True` ORAZ `celery_app.conf.task_always_eager=True`/`task_eager_propagates=True` (bo app czyta konfig przy imporcie). 

Pokrycie: `send_email_task` woła `core.email.send_email` (mock); po refaktorze `create_ticket`/`subscribe` dalej „wysyłają" (eager — istniejące testy support/newsletter zielone); `send_campaign_task` → N aktywnych subskrybentów = N wywołań `send_email` (+ filtr freq ogranicza); `expire_subscriptions` (przeterminowana active→expired, żywa zostaje); `cleanup_stale_pending`/`cleanup_stale_registrations` (stare pending → canceled/expired, świeże zostają — sterowanie czasem przez `created_at` ustawiany w teście / freezegun-free przez bezpośredni update created_at); `recompute_all_ratings` (przelicza avg, leczy ręcznie zepsuty rating_avg). Cały istniejący suite (432) zielony pod eager.

> Uwaga do testów czasowych: `created_at` ma `auto_now_add`; w testach ustawiamy „stary" timestamp przez `Model.objects.filter(pk=...).update(created_at=...)` (omija auto_now_add), żeby nie wprowadzać `freezegun`.

---

## 6. Zarys tasków (rozwinie writing-plans; commit per task, EN, bez Co-Authored-By)

1. **Celery scaffold**: `celery.py` + `obskura/__init__` + settings (`CELERY_*`, broker db1, eager) + `core/tasks.py` `send_email_task` + dep `celery[redis]` + conftest eager fixture + docker-compose `worker`/`beat`.
2. **Async maile**: refactor `support.create_ticket` + `newsletter.subscribe` → `send_email_task.delay`.
3. **Bulk newsletter**: `newsletter.tasks.send_campaign_task` + `send_campaign` command + akcja admin.
4. **Periodic membership**: `expire_subscriptions` + `cleanup_stale_pending`.
5. **Periodic events/playback**: `cleanup_stale_registrations` + `recompute_all_ratings` + `CELERY_BEAT_SCHEDULE` (wszystkie joby).
6. **Final**: pełny gate; docker-compose worker/beat dopięte; ewentualny admin polish.

**Definition of Done (B7a):** pełny `pytest` zielony pod eager (nowe taski + niezłamana reszta), `ruff`/`format`/`check`/`makemigrations --check` czyste, `send_email_task`/`send_campaign_task`/periodic-joby działają (eager), `CELERY_BEAT_SCHEDULE` kompletny, compose ma worker+beat, `celery -A obskura inspect` rozpoznaje taski (po rebuildzie — poza CI).

**Następna faza:** B7b — Channels (ASGI ProtocolTypeRouter, channels-redis, `notifications` app + per-user WS consumer, live-status broadcast).
