# Faza B8a — Fundament integracji frontu + Auth — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-02. Pierwszy z podfaz **B8 — Integracja frontu**. B8 w [BACKEND-PLAN.md](../../../BACKEND-PLAN.md) okazało się meta-fazą spinającą ~9 podsystemów — rozbite na B8a…B8h. Tu: warstwa bazowa API + auth (Knox). Reszta podfaz dopisana do BACKEND-PLAN po B8a.
> Front dziś działa offline-first: katalog z `src/data/tracks.js`, ulubione/kolejka/postęp w localStorage, brak AuthContext, login/register to stuby Vercel zwracające `501`.

---

## 1. Cel

Spiąć front (Vite/React SPA) z działającym backendem Django po raz pierwszy: **warstwa fundamentu** (jeden klient `fetch` na `/api/v1/`, token Knox w nagłówku, env `VITE_API_URL`, CORS, uruchomienie backendu lokalnie) + **pełny auth** (`AuthContext`, realne login/register/logout/me, chronione trasy). Po B8a cała rura działa end-to-end: gość rejestruje się → dostaje token → `/accounts/me` hydratuje stan → wchodzi na chronione Konto. Bez sync danych playera i bez katalogu z API (kolejne podfazy).

## 2. Decyzje (rozstrzygnięte z userem)

1. **Dekompozycja B8** — B8 to meta-faza; robimy podfazy shippable. **B8a = Fundament + Auth** (ten spec). Reszta (katalog, playback-sync, membership, forum, eventy, support/newsletter, notyfikacje WS) → B8b…B8h, dopisane do BACKEND-PLAN po B8a.
2. **Token Knox w localStorage** + nagłówek `Authorization: Token <token>` (działa z Knox out-of-the-box, standard dla SPA). XSS łagodzimy CSP + brakiem `dangerouslySetInnerHTML`. Nie idziemy w cookie httpOnly (wymagałoby customizacji Knox + CSRF).
3. **Auth dodatkowy (guest-first)** — cała strona dostępna bez logowania; logowanie odblokowuje Konto, sync (B8c) i premium (później). Chronione w B8a: **Account** i **Onboarding**; reszta publiczna.
4. **Architektura API: cienki wrapper `fetch` + funkcje per-domena** (podejście A). Zero nowych zależności. Biblioteka data-fetching (TanStack Query) **odłożona do B8b** (katalog — tam cache realnie się opłaca).
5. **Zod (`formSchemas`) zostaje** do walidacji klienckiej (instant feedback); serwer = źródło prawdy, błędy `400` z DRF mapowane na pola formularza.
6. Konwencje 1:1 jak reszta frontu (Vitest + RTL — już skonfigurowane, są testy `PlayerContext`/`analytics`/`consent`).

### Świadomie poza zakresem B8a (deferred)
- **Sync playera** (favorites/queue/progress/history localStorage → API, merge przy logowaniu) → **B8c**.
- **Katalog z API** (`src/data/tracks.js` → `/catalog/*`) → **B8b**.
- **Premium-gating / membership** (Club/Patrons, subscribe, quota free) → późniejsza podfaza.
- **Forum, eventy, support/newsletter migracja, notyfikacje WS** → kolejne podfazy.
- **Przeprojektowanie nav/UI** — w B8a tylko minimalny wskaźnik zalogowania + akcja „Wyloguj".
- **Reset/zmiana hasła, email-verify, refresh token** — backend ich (jeszcze) nie ma; nie wymyślamy frontu bez endpointu.
- **Deploy** (Vercel `VITE_API_URL` prod, domena backendu, CORS prod) — osobno przy hostingu.

---

## 3. Architektura

### 3.1 Warstwa fundamentu

- **`src/lib/apiClient.js`** (przepisany) — rdzeń:
  ```
  request(method, path, { body, auth = false, signal }) :
    → fetch(`${BASE}${path}`, { method, headers, body: JSON, signal })
    → BASE = import.meta.env.VITE_API_URL  (bez końcowego "/"; path bez wiodącego "/")
    → headers: "Content-Type: application/json"; gdy auth && token → "Authorization: Token <token>"
    → 401 → clearToken() + emit "auth:logout" (window event) → throw ApiError(401)
    → 400  → throw ApiError(400, { fieldErrors })  // mapa { pole: "komunikat" } z DRF, lustro flattenErrors
    → !ok  → throw ApiError(status, { message })
    → network/TypeError → throw ApiError(0, { message: "Brak połączenia z serwerem." })
  ```
  Funkcje per-domena nad `request`: `auth.register/login/logout/logoutAll/me`. Eksport `ApiError` (klasa z `status`, `fieldErrors`, `message`).
- **`src/lib/authToken.js`** — `getToken()/setToken(t)/clearToken()` na localStorage, klucz `obskura_auth_token`. **Niezależny od zgody cookies**: token sesji = kategoria „Niezbędne" (logowanie to funkcja podstawowa), więc **nie** przez `hasConsent("preferences")`.
- **Env** — `.env.development`: `VITE_API_URL=http://localhost:8000/api/v1`. `.env.example` udokumentowany. (Prod URL odłożony do deployu.)
- **Backend CORS** — `CORS_ALLOWED_ORIGINS` w `backend/.env` + `.env.example` dostaje realny port Vite `http://localhost:5175` (dziś tylko `:5188` — rozjazd z `vite.config.js` `VITE_DEV_PORT||5175`). Bez zmian w kodzie settings (czyta z env).
- **Dev workflow** (README front + backend): `cd backend && docker compose up -d` → `docker compose exec web python manage.py migrate` → `createsuperuser` lub seed test-usera; front `npm run dev` (:5175). Sanity: `curl /api/v1/health/`.

### 3.2 AuthContext

- **`src/context/AuthContext.jsx`** — provider montowany w `App.jsx` (obok `PlayerProvider`).
  - Stan: `user` (obiekt z `UserReadSerializer` albo `null`), `status` ∈ `idle | loading | authed | guest`.
  - Akcje: `login({email,password})`, `register({email,password,name})`, `logout()`, `logoutAll()`.
  - **Hydratacja na mount**: jest token → `status=loading` → `auth.me()`; 200 → `authed`+`user`; 401/błąd → `clearToken()` → `guest`. Brak tokenu → od razu `guest`.
  - `login/register`: POST → zapis `token` (`setToken`) + `user`, `status=authed`. Oba endpointy zwracają identyczne `{ user, token }`.
  - `logout`: `POST /auth/logout` (best-effort) → **zawsze** `clearToken()` + `user=null` + `guest` (nawet gdy sieć padnie). `logoutAll`: `/auth/logoutall`.
  - Nasłuch na window event `auth:logout` (emitowany przez `apiClient` przy 401) → lokalne wyczyszczenie stanu.
- **`useAuth()`** — hook eksportowany z `src/hooks` (barrel).

### 3.3 Formularze i trasy

- **`src/pages/Login.jsx` / `Register.jsx`** — repinane z Vercel-stubów (`apiClient.login/register` → `/api/auth/*`) na `useAuth().login/register`. Zod walidacja kliencka zostaje; po sukcesie redirect na `returnTo` (z query) lub `/account`. Błędy `400` (np. „email zajęty", „błędne dane logowania") z `ApiError.fieldErrors`/`message` mapowane na pola/komunikat formularza.
- **`src/components/ui/RequireAuth.jsx`** — wrapper trasy: `status==="loading"` → lekki placeholder; `guest` → `<Navigate to="/login?returnTo=…">`; `authed` → `children`. Obejmuje **Account** i **Onboarding** w `src/Router.jsx` (router obiektowy `createBrowserRouter` — `element: <RequireAuth><Account/></RequireAuth>`). Ścieżki kanoniczne: `/login`, `/register`, `/account`, `/onboarding` (PL aliasy `/zaloguj`, `/konto`… zostają jako redirecty).
- **Nav** (`Navbar`/`Header`) — minimalny wskaźnik: `authed` → `user.display_name` + „Wyloguj"; `guest` → link „Zaloguj". Bez redesignu.

### 3.4 Sprzątanie Vercel

- Usunięte: `api/auth/login.js`, `api/auth/register.js` (zastąpione Django). Jeśli to ostatnie pliki w `api/auth/` — katalog znika.
- **Zostają**: `api/contact.js`, `api/newsletter.js`, `api/_shared.js` (domena B8f — przepięcie później). `apiClient.subscribeNewsletter/submitContact` bez zmian w B8a.

---

## 4. Kontrakt API (istnieje w backendzie — B1)

```
POST /api/v1/auth/register   {email,password,name?}      → 201 {user, token}
POST /api/v1/auth/login      {email,password}            → 200 {user, token} | 400 {non_field/błąd}
POST /api/v1/auth/logout     (Token)                     → 204
POST /api/v1/auth/logoutall  (Token)                     → 204
GET  /api/v1/accounts/me     (Token)                     → 200 user | 401
```
`user` = kształt `UserReadSerializer`. Walidacja serializerów register/login = lustro `formSchemas` (Zod). Uwaga implementacyjna: zweryfikować dokładny zestaw pól `register` w backendzie (`name`/`display_name`, `terms` po stronie frontu jest tylko UI-gate, nie musi iść do API) — dopiąć w planie.

## 5. Obsługa błędów (jednolita)

- **401** (token wygasł/cofnięty) → `apiClient` czyści token + emituje `auth:logout` → AuthContext przełącza na `guest`. Bez twardego redirectu globalnego (chronione trasy same przekierują przez `RequireAuth`).
- **400** → `ApiError.fieldErrors` (mapa pól) → formularz pokazuje pod polami; brak mapy → `message` ogólny.
- **0 / network** → komunikat „Brak połączenia z serwerem." (PL), bez crashy.
- **5xx** → komunikat ogólny „Błąd serwera ({status})."

## 6. Testy (Vitest + RTL)

- **`apiClient`**: wstrzykiwanie nagłówka tokenu (auth=true vs false), mapowanie `400→fieldErrors`, ścieżka `401` (czyści token + emituje event), network-error fallback. `fetch` + `localStorage` mockowane.
- **`AuthContext`**: hydratacja z tokenem (`me` 200 → authed; 401 → guest+token wyczyszczony), brak tokenu → guest, login sukces (zapis tokenu+user), login błąd (stan guest, błąd przekazany), logout (czyści stan nawet gdy `logout` rzuci).
- **`RequireAuth`**: guest → redirect na `/login?returnTo`, authed → render children, loading → placeholder.
- **Login/Register** (smoke RTL): submit z poprawnymi danymi woła `useAuth`, błąd `400` renderuje komunikat.

## 7. Pliki (touched)

**Front (nowe):** `src/lib/authToken.js`, `src/context/AuthContext.jsx`, `src/components/ui/RequireAuth.jsx`, + testy w `src/lib/__tests__/apiClient.test.js`, `src/context/__tests__/AuthContext.test.jsx`, `src/components/ui/__tests__/RequireAuth.test.jsx`.
**Front (zmiana):** `src/lib/apiClient.js` (przepis), `src/hooks/index.js` (export `useAuth`), `src/App.jsx` (`AuthProvider` obok `PlayerProvider`, ponad `RouterProvider`), `src/Router.jsx` (`RequireAuth` na trasach Account/Onboarding), `src/pages/Login.jsx`, `src/pages/Register.jsx`, nav (`Navbar`/`Header`), `.env.development` (new), `.env.example`, README.
**Front (usunięte):** `api/auth/login.js`, `api/auth/register.js`.
**Backend (zmiana):** `backend/.env` + `backend/.env.example` (`CORS_ALLOWED_ORIGINS` += `http://localhost:5175`). Bez zmian w kodzie Django (auth B1 gotowy) — chyba że weryfikacja kontraktu register (§4) wykaże rozjazd pól.

## 8. Weryfikacja ukończenia

- `npm run build` + `npm run lint` (0 błędów) + `npm run test:run` (zielone).
- Backend up (`docker compose up`), `curl /api/v1/health/` ok.
- Ręcznie (Puppeteer/manual): register → token w localStorage → odświeżenie strony utrzymuje sesję (`me` hydratuje) → wejście na `/account` działa → logout czyści → `/account` przekierowuje na `/login`. Gość bez tokenu nadal przegląda stronę.
- Post-change-audit (screenshoty 1440/768/375) na Login/Register/Account.
