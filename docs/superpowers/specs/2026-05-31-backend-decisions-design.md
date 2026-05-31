# Decision record — backend OBSKURA: 6 decyzji architektonicznych

> Data: 2026-05-31
> Status: **zaakceptowane**
> Kontekst: domknięcie „decyzji do potwierdzenia" z [BACKEND-PLAN.md](../../../BACKEND-PLAN.md) §2 (wiersz 41), przed startem fazy B0.

## Profil projektu

**Portfolio / pokazowy.** Cel: czysty, optymalny kod (zero N+1, indeksy, cache, paginacja) + żywe demo pod publicznym linkiem dla rekrutera. Koszt docelowy **$0/mc**. Funkcje komercyjne (płatności) prezentowane w trybie testowym — backend nie obsługuje realnych pieniędzy.

To zmienia priorytety względem wariantu komercyjnego: niezawodność/SLA schodzą na drugi plan, darmowy hosting jest w pełni uzasadniony (brak płacących użytkowników do utraty), a wymóg „bardzo optymalny" z planu **zostaje** — bo dobrze udokumentowana optymalizacja jest atutem portfolio.

## Decyzje

| # | Obszar | Rozstrzygnięcie | Uzasadnienie |
|---|---|---|---|
| a | Baza danych | **PostgreSQL 16** | Najlepszy z Django (JSONB, full-text PL), darmowy. Engine z env (`SQL_ENGINE`) jak imroi |
| b | Storage audio | **Cloudflare R2** | 10 GB free, zero opłat za transfer (kluczowe dla streamingu audio), S3-compatible (`boto3`) |
| c | Email | **Resend** | Już zintegrowany w `api/_shared.js`, free 100/dzień, spójność z frontem |
| d | Repozytorium | **Monorepo** — `obskura/` (front) + `obskura/backend/` (Django) | Jeden link dla rekrutera, full-stack w jednym miejscu. Odejście od sugestii planu (osobne repo `obskura-backend`) |
| e | Hosting | **Oracle Cloud Always Free** (VM ARM, docker-compose) | 24/7 (nie śpi), $0, pokazuje umiejętność deployu pełnego stacku web+Postgres+Redis+Celery |
| f | Auth | **Knox (Django)** | Rozstrzyga sprzeczność: plan mówił Knox, frontowe stuby `api/auth/*` sugerowały Supabase/Auth.js. Idziemy Knox — Django-native, spójne z `accounts.User` |

## Konsekwencje

1. **Vercel = tylko front** (statyczne `dist/`). Django żyje na Oracle VM. Front wskazuje na backend przez `VITE_API_URL`.
2. **Frontowe `api/*` migrują do Django `/api/v1/`:**
   - `api/auth/login.js` + `register.js` (stuby 501) → endpointy Knox.
   - `api/contact.js` + `api/newsletter.js` → Resend wołany z Django (w okresie przejściowym mogą zostać jako proxy na Vercel).
3. **Płatności (B4) = Stripe test mode** — pełny flow subskrypcji bez realnych transakcji.
4. **`src/lib/formSchemas.js` (Zod) = źródło prawdy walidacji** → lustrzane serializery DRF (te same reguły: email, min. 8 znaków hasła + wielka litera + cyfra, itd.).
5. **BACKEND-PLAN.md zaktualizowany:** tabela §2 z konkretami, skreślone §2/41 „decyzje do potwierdzenia", dopisana sekcja o hostingu (plan jej nie miał).

## Świadomie pominięte (YAGNI pod portfolio)

- Brak pgbouncer/connection pooling na starcie — `CONN_MAX_AGE` wystarczy przy małym ruchu na Oracle VM.
- Brak realnej integracji płatności (tylko Stripe test mode).
- Channels + Celery stawiamy w B7, ale „stream-live" i push nie blokują MVP.

## Ryzyka i mitygacje

| Ryzyko | Mitygacja |
|---|---|
| Oracle odbiera bezczynne VM (reclaim) | Cron/keep-alive utrzymujący minimalne obciążenie; backup konfiguracji w repo (docker-compose) |
| Dostępność ARM w regionie zmienna przy zakładaniu | Próba w innym regionie/AD; fallback: x86 micro instance (też w Always Free) |
| Limity free tierów zmienne (R2/Resend/Oracle) | Zweryfikować aktualne limity przy zakładaniu kont (stan tego dokumentu: ~początek 2026) |

## Następny krok

Faza **B0 — Szkielet** (BACKEND-PLAN.md §7): projekt `backend/`, settings env-based, app `core`, docker-compose (web+db+redis), CI. Plan wdrożenia B0 przez skill `writing-plans`.
