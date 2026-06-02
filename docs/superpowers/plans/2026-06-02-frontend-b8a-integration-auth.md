# B8a — Fundament integracji frontu + Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spiąć front (React SPA) z backendem Django po raz pierwszy — warstwa klienta `fetch` na `/api/v1/` z tokenem Knox + pełny auth (AuthContext, login/register/logout/me, chronione trasy Account/Onboarding).

**Architecture:** Cienki wrapper `request()` nad `fetch` (base URL z `VITE_API_URL`, nagłówek `Authorization: Token …`, jednolite mapowanie błędów DRF na `ApiError`). Token w localStorage (kategoria „Niezbędne", poza zgodą cookies). `AuthContext` trzyma `{user, status}` i hydratuje sesję po tokenie na mount. `RequireAuth` chroni trasy. Auth dodatkowy — gość przegląda całą stronę.

**Tech Stack:** Vite 7 + React 19 (JSX), React Router v6 (`createBrowserRouter`), Zod (`formSchemas`), Vitest + RTL (`jsdom`, setup `src/test/setup.js`). Backend: Django + DRF + Knox (endpointy auth gotowe z B1).

**Spec:** `docs/superpowers/specs/2026-06-02-frontend-b8a-integration-auth-design.md`

---

## File Structure

**Nowe pliki:**
- `src/lib/authToken.js` — get/set/clear tokenu Knox w localStorage.
- `src/context/AuthContext.jsx` — `AuthProvider` + `useAuth`.
- `src/components/ui/RequireAuth.jsx` — guard trasy.
- `.env.development` — `VITE_API_URL` dla dev.
- Testy: `src/lib/__tests__/authToken.test.js`, `src/lib/__tests__/apiClient.test.js`, `src/context/__tests__/AuthContext.test.jsx`, `src/components/ui/__tests__/RequireAuth.test.jsx`, `src/pages/__tests__/Login.test.jsx`, `src/pages/__tests__/Register.test.jsx`.

**Modyfikowane:**
- `src/lib/apiClient.js` — dopisany rdzeń `request`/`ApiError`/`auth.*`; zachowane `subscribeNewsletter`/`submitContact` (Vercel); usunięte `login`/`register`.
- `src/hooks/index.js` — re-export `useAuth`.
- `src/App.jsx` — `AuthProvider` ponad `RouterProvider`.
- `src/Router.jsx` — `RequireAuth` na trasach `account` i `onboarding`.
- `src/pages/Login.jsx` — repin na `useAuth().login` + nawigacja.
- `src/pages/Register.jsx` — repin kroku finalnego na `useAuth().register`.
- `src/components/layout/Nav.jsx` — warunkowy login/logout (desktop + mobile).
- `.env.example`, `backend/.env`, `backend/.env.example` — CORS/port.
- `backend/README.md` — sekcja dev front+backend.

**Usuwane:** `api/auth/login.js`, `api/auth/register.js`.

---

## Task 1: Token storage (`authToken.js`)

**Files:**
- Create: `src/lib/authToken.js`
- Test: `src/lib/__tests__/authToken.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/lib/__tests__/authToken.test.js
import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, clearToken } from "../authToken.js";

describe("src/lib/authToken.js", () => {
  beforeEach(() => localStorage.clear());

  it("zwraca null gdy brak tokenu", () => {
    expect(getToken()).toBeNull();
  });

  it("zapisuje i odczytuje token", () => {
    setToken("abc123");
    expect(getToken()).toBe("abc123");
    expect(localStorage.getItem("obskura_auth_token")).toBe("abc123");
  });

  it("czyści token", () => {
    setToken("abc123");
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("nie rzuca gdy localStorage niedostępny", () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("blocked"); };
    expect(() => setToken("x")).not.toThrow();
    Storage.prototype.setItem = orig;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/__tests__/authToken.test.js`
Expected: FAIL — `Failed to resolve import "../authToken.js"`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/lib/authToken.js
// Token Knox po zalogowaniu. Kategoria „Niezbędne" (logowanie = funkcja podstawowa) —
// celowo NIE bramkowany przez hasConsent("preferences"), inaczej niż ulubione/resume.
const TOKEN_KEY = "obskura_auth_token";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage niedostępny (tryb prywatny / wyłączony) — sesja tylko w pamięci */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/__tests__/authToken.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/authToken.js src/lib/__tests__/authToken.test.js
git commit -m "feat(auth): localStorage token store for Knox (B8a)"
```

---

## Task 2: API client core (`request`, `ApiError`, `auth.*`)

**Files:**
- Modify: `src/lib/apiClient.js`
- Test: `src/lib/__tests__/apiClient.test.js`

Kontrakt backendu (B1): `POST auth/register → 201 {user, token}`, `POST auth/login → 200 {user, token}` lub `401 {detail}`, `POST auth/logout|logoutall → 204`, `GET accounts/me → 200 user | 401`. DRF błędy walidacji: `{ pole: ["komunikat"] }` lub `{detail: "…"}` / `{non_field_errors: ["…"]}`. **Ważne:** `401` czyścimy token tylko dla żądań `auth:true` (wygaśnięcie sesji); `401` z `login` to złe dane — leci jako `ApiError` z komunikatem do formularza.

- [ ] **Step 1: Write the failing test**

```js
// src/lib/__tests__/apiClient.test.js
import { describe, it, expect, beforeEach, vi } from "vitest";
import { request, ApiError, auth } from "../apiClient.js";
import { setToken, getToken } from "../authToken.js";

function mockFetch(status, body, { ok } = {}) {
  return vi.fn().mockResolvedValue({
    status,
    ok: ok ?? (status >= 200 && status < 300),
    json: () => Promise.resolve(body),
  });
}

describe("src/lib/apiClient.js — request", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("dokleja nagłówek tokenu gdy auth:true i token jest", async () => {
    setToken("tok42");
    global.fetch = mockFetch(200, { ok: true });
    await request("GET", "accounts/me", { auth: true });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBe("Token tok42");
  });

  it("NIE dokleja tokenu gdy auth:false", async () => {
    setToken("tok42");
    global.fetch = mockFetch(200, { ok: true });
    await request("POST", "auth/login", { body: { email: "a@b.co" } });
    const [, opts] = global.fetch.mock.calls[0];
    expect(opts.headers.Authorization).toBeUndefined();
  });

  it("mapuje 400 DRF na fieldErrors", async () => {
    global.fetch = mockFetch(400, { email: ["Konto już istnieje."], password: ["Za krótkie."] });
    await expect(request("POST", "auth/register", { body: {} })).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: "Konto już istnieje.", password: "Za krótkie." },
    });
  });

  it("używa `detail` jako message (np. 401 z login)", async () => {
    global.fetch = mockFetch(401, { detail: "Nieprawidłowy e-mail lub hasło." });
    await expect(request("POST", "auth/login", { body: {} })).rejects.toMatchObject({
      status: 401,
      message: "Nieprawidłowy e-mail lub hasło.",
    });
    // auth:false → token nietknięty (nie było żadnego)
    expect(getToken()).toBeNull();
  });

  it("401 dla żądania auth:true czyści token i emituje auth:logout", async () => {
    setToken("tok42");
    const onLogout = vi.fn();
    window.addEventListener("auth:logout", onLogout);
    global.fetch = mockFetch(401, { detail: "Invalid token." });
    await expect(request("GET", "accounts/me", { auth: true })).rejects.toBeInstanceOf(ApiError);
    expect(getToken()).toBeNull();
    expect(onLogout).toHaveBeenCalledTimes(1);
    window.removeEventListener("auth:logout", onLogout);
  });

  it("network error → ApiError(0) z polskim komunikatem", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(request("GET", "accounts/me", {})).rejects.toMatchObject({
      status: 0,
      message: "Brak połączenia z serwerem.",
    });
  });

  it("204 zwraca null bez parsowania", async () => {
    global.fetch = vi.fn().mockResolvedValue({ status: 204, ok: true, json: () => Promise.reject(new Error("no body")) });
    await expect(request("POST", "auth/logout", { auth: true })).resolves.toBeNull();
  });

  it("auth.login woła POST auth/login bez tokenu", async () => {
    global.fetch = mockFetch(200, { user: { id: 1 }, token: "t" });
    const res = await auth.login({ email: "a@b.co", password: "x" });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/auth\/login$/);
    expect(opts.method).toBe("POST");
    expect(res.token).toBe("t");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/__tests__/apiClient.test.js`
Expected: FAIL — `request`/`ApiError`/`auth` nie są eksportowane.

- [ ] **Step 3: Write implementation**

Zastąp całą zawartość `src/lib/apiClient.js`:

```js
// src/lib/apiClient.js
// Dwie warstwy:
//  1) Django REST (/api/v1) — request()/ApiError/auth.* z tokenem Knox.
//  2) Vercel serverless (/api/*) — postVercel() dla newsletter/contact (przepięcie do Django w B8f).
import { getToken, clearToken } from "./authToken.js";

const BASE = import.meta.env?.VITE_API_URL || "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(status, { message, fieldErrors } = {}) {
    super(message || `Błąd serwera (${status}).`);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors || null;
  }
}

// DRF zwraca: {detail:"…"} | {non_field_errors:["…"]} | {pole:["…"] | "…"}.
function parseErrorBody(data) {
  if (!data || typeof data !== "object") return {};
  if (typeof data.detail === "string") return { message: data.detail };
  const fieldErrors = {};
  let firstMsg;
  for (const [key, val] of Object.entries(data)) {
    const msg = Array.isArray(val) ? String(val[0]) : typeof val === "string" ? val : null;
    if (!msg) continue;
    if (key === "non_field_errors") {
      firstMsg = firstMsg ?? msg;
      continue;
    }
    fieldErrors[key] = msg;
    firstMsg = firstMsg ?? msg;
  }
  return { fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : null, message: firstMsg };
}

export async function request(method, path, { body, auth = false, signal } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Token ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, { message: "Brak połączenia z serwerem." });
  }

  // Wygaśnięcie/cofnięcie sesji — tylko dla żądań uwierzytelnionych.
  // (401 z login = złe dane, leci do formularza bez czyszczenia.)
  if (res.status === 401 && auth) {
    clearToken();
    if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:logout"));
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, parseErrorBody(data));
  return data;
}

export const auth = {
  register: (data) => request("POST", "auth/register", { body: data }),
  login: (data) => request("POST", "auth/login", { body: data }),
  logout: () => request("POST", "auth/logout", { auth: true }),
  logoutAll: () => request("POST", "auth/logoutall", { auth: true }),
  me: () => request("GET", "accounts/me", { auth: true }),
};

// ── Vercel serverless (/api/*) — bez zmian w B8a (przepięcie do Django w B8f) ──
const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

async function postVercel(path, body) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404 && isDev) {
      console.info(`[apiClient] dev mock: ${path}`, body);
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true, mock: true };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Błąd serwera (${res.status}).`);
    return { ok: true, ...data };
  } catch (err) {
    if (err.name === "TypeError" && isDev) {
      console.info(`[apiClient] dev mock (network): ${path}`, body);
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true, mock: true };
    }
    throw err;
  }
}

export const subscribeNewsletter = (data) => postVercel("/api/newsletter", data);
export const submitContact = (data) => postVercel("/api/contact", data);

// TYMCZASOWE — Login.jsx wciąż importuje `login` (repin na useAuth w Task 6).
// `register` nieużywane już dziś, ale trzymamy parę razem. Oba usuwa Task 6.
export const login = (data) => postVercel("/api/auth/login", data);
export const register = (data) => postVercel("/api/auth/register", data);
```

> **Sekwencja:** NIE usuwamy `login`/`register` w tym tasku — `src/pages/Login.jsx` nadal je importuje, więc usunięcie teraz wywaliłoby build. Usunięcie przenosimy do Task 6 (repin Login). Reszta plików (Newsletter/Support) używa `subscribeNewsletter`/`submitContact` — bez zmian.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/__tests__/apiClient.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Verify build green (wszyscy konsumenci importują poprawnie)**

Run: `npm run build`
Expected: build OK — `subscribeNewsletter`/`submitContact` oraz tymczasowe `login`/`register` nadal eksportowane.

- [ ] **Step 6: Commit**

```bash
git add src/lib/apiClient.js src/lib/__tests__/apiClient.test.js
git commit -m "feat(api): fetch wrapper with Knox token, DRF error mapping and auth endpoints (B8a)"
```

---

## Task 3: AuthContext (`AuthProvider`, `useAuth`)

**Files:**
- Create: `src/context/AuthContext.jsx`
- Test: `src/context/__tests__/AuthContext.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/context/__tests__/AuthContext.test.jsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext.jsx";

vi.mock("../../lib/apiClient.js", () => ({
  auth: { me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), logoutAll: vi.fn() },
}));
vi.mock("../../lib/authToken.js", () => ({
  getToken: vi.fn(),
  setToken: vi.fn(),
  clearToken: vi.fn(),
}));

import { auth } from "../../lib/apiClient.js";
import { getToken, setToken, clearToken } from "../../lib/authToken.js";

function Probe() {
  const { status, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="user">{user?.display_name || "—"}</span>
      <button onClick={() => login({ email: "a@b.co", password: "Password1" })}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

const renderApp = () => render(<AuthProvider><Probe /></AuthProvider>);

describe("AuthContext", () => {
  beforeEach(() => vi.clearAllMocks());

  it("brak tokenu → status guest", async () => {
    getToken.mockReturnValue(null);
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(auth.me).not.toHaveBeenCalled();
  });

  it("token + me 200 → authed z userem", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockResolvedValue({ display_name: "Mara" });
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    expect(screen.getByTestId("user")).toHaveTextContent("Mara");
  });

  it("token + me 401 → guest, token wyczyszczony", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockRejectedValue(new Error("401"));
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(clearToken).toHaveBeenCalled();
  });

  it("login sukces → zapis tokenu + authed", async () => {
    getToken.mockReturnValue(null);
    auth.login.mockResolvedValue({ user: { display_name: "Mara" }, token: "newtok" });
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    await act(async () => { screen.getByText("login").click(); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    expect(setToken).toHaveBeenCalledWith("newtok");
    expect(screen.getByTestId("user")).toHaveTextContent("Mara");
  });

  it("logout czyści stan nawet gdy API rzuci", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockResolvedValue({ display_name: "Mara" });
    auth.logout.mockRejectedValue(new Error("network"));
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    await act(async () => { screen.getByText("logout").click(); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
    expect(clearToken).toHaveBeenCalled();
  });

  it("zdarzenie auth:logout przełącza na guest", async () => {
    getToken.mockReturnValue("tok");
    auth.me.mockResolvedValue({ display_name: "Mara" });
    renderApp();
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("authed"));
    await act(async () => { window.dispatchEvent(new Event("auth:logout")); });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("guest"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/context/__tests__/AuthContext.test.jsx`
Expected: FAIL — `Failed to resolve import "../AuthContext.jsx"`.

- [ ] **Step 3: Write implementation**

```jsx
// src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { auth as authApi } from "../lib/apiClient.js";
import { getToken, setToken, clearToken } from "../lib/authToken.js";

const AuthContext = createContext(null);

// status: "idle" | "loading" | "authed" | "guest"
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");

  // Hydratacja sesji po tokenie na mount.
  useEffect(() => {
    let cancelled = false;
    if (!getToken()) {
      setStatus("guest");
      return undefined;
    }
    setStatus("loading");
    authApi
      .me()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setStatus("authed");
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
        setStatus("guest");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 401 z dowolnego żądania auth:true → apiClient emituje "auth:logout".
  useEffect(() => {
    const onLogout = () => {
      setUser(null);
      setStatus("guest");
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = useCallback(async (creds) => {
    const { user: u, token } = await authApi.login(creds);
    setToken(token);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: u, token } = await authApi.register(payload);
    setToken(token);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* best-effort — i tak czyścimy lokalnie */
    }
    clearToken();
    setUser(null);
    setStatus("guest");
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch {
      /* best-effort */
    }
    clearToken();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, logoutAll }),
    [user, status, login, register, logout, logoutAll],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musi być użyty wewnątrz <AuthProvider>");
  return ctx;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/context/__tests__/AuthContext.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/context/AuthContext.jsx src/context/__tests__/AuthContext.test.jsx
git commit -m "feat(auth): AuthContext with token hydration, login/register/logout (B8a)"
```

---

## Task 4: Route guard (`RequireAuth`)

**Files:**
- Create: `src/components/ui/RequireAuth.jsx`
- Test: `src/components/ui/__tests__/RequireAuth.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/ui/__tests__/RequireAuth.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "../RequireAuth.jsx";

let mockStatus = "guest";
vi.mock("../../../context/AuthContext.jsx", () => ({
  useAuth: () => ({ status: mockStatus }),
}));

function renderAt(status) {
  mockStatus = status;
  return render(
    <MemoryRouter initialEntries={["/account"]}>
      <Routes>
        <Route path="/account" element={<RequireAuth><div>SEKRET</div></RequireAuth>} />
        <Route path="/login" element={<div>STRONA LOGOWANIA</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth", () => {
  it("authed → renderuje dzieci", () => {
    renderAt("authed");
    expect(screen.getByText("SEKRET")).toBeInTheDocument();
  });

  it("guest → przekierowuje na /login", () => {
    renderAt("guest");
    expect(screen.getByText("STRONA LOGOWANIA")).toBeInTheDocument();
    expect(screen.queryByText("SEKRET")).not.toBeInTheDocument();
  });

  it("loading → nie renderuje dzieci ani redirectu", () => {
    renderAt("loading");
    expect(screen.queryByText("SEKRET")).not.toBeInTheDocument();
    expect(screen.queryByText("STRONA LOGOWANIA")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/ui/__tests__/RequireAuth.test.jsx`
Expected: FAIL — `Failed to resolve import "../RequireAuth.jsx"`.

- [ ] **Step 3: Write implementation**

```jsx
// src/components/ui/RequireAuth.jsx
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "idle" || status === "loading") {
    // Placeholder na czas hydratacji — nie migamy redirectem do /login.
    return <div className="min-h-screen bg-bg-0" aria-busy="true" />;
  }

  if (status === "guest") {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return children;
}

RequireAuth.propTypes = { children: PropTypes.node };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/ui/__tests__/RequireAuth.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/RequireAuth.jsx src/components/ui/__tests__/RequireAuth.test.jsx
git commit -m "feat(auth): RequireAuth route guard with returnTo (B8a)"
```

---

## Task 5: Wire provider, hooks barrel and protected routes

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/hooks/index.js`
- Modify: `src/Router.jsx`

- [ ] **Step 1: Owinąć aplikację `AuthProvider`**

W `src/App.jsx` zamień całą treść na:

```jsx
import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { useLenisScroll } from "./hooks/useLenisScroll";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  useLenisScroll();
  // AuthProvider + PlayerProvider ponad routerem:
  // sesja i jeden <audio> przeżywają zmianę tras.
  return (
    <AuthProvider>
      <PlayerProvider>
        <RouterProvider router={router} />
      </PlayerProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Re-export `useAuth` z barrela hooków**

Dopisz na końcu `src/hooks/index.js`:

```js
export { useAuth } from "../context/AuthContext";
```

- [ ] **Step 3: Owinąć trasy chronione w `RequireAuth`**

W `src/Router.jsx` dodaj import (po linii `import Home from "./pages/Home";`):

```jsx
import RequireAuth from "./components/ui/RequireAuth";
```

Zamień dwie linie tras na wersję z guardem:

```jsx
      { path: "account", element: <RequireAuth><Account /></RequireAuth> },
```

```jsx
      { path: "onboarding", element: <RequireAuth><Onboarding /></RequireAuth> },
```

- [ ] **Step 4: Verify build + lint + cały zestaw testów**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0 błędów, testy zielone (authToken, apiClient, AuthContext, RequireAuth + istniejące).

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx src/hooks/index.js src/Router.jsx
git commit -m "feat(auth): mount AuthProvider and guard account/onboarding routes (B8a)"
```

---

## Task 6: Repin Login na `useAuth`

**Files:**
- Modify: `src/pages/Login.jsx`
- Test: `src/pages/__tests__/Login.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/__tests__/Login.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login.jsx";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k, d) => d || k }) }));
const loginSpy = vi.fn();
vi.mock("../../context/AuthContext.jsx", () => ({ useAuth: () => ({ login: loginSpy }) }));

function renderLogin() {
  return render(<MemoryRouter><Login /></MemoryRouter>);
}

describe("Login", () => {
  beforeEach(() => loginSpy.mockReset());

  it("submit z poprawnymi danymi woła useAuth().login", async () => {
    loginSpy.mockResolvedValue({ display_name: "Mara" });
    renderLogin();
    fireEvent.change(screen.getByLabelText("login.email_label"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("login.password_label"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /login\.submit/ }));
    await waitFor(() => expect(loginSpy).toHaveBeenCalledWith({ email: "a@b.co", password: "Password1" }));
  });

  it("błąd serwera renderuje komunikat (role=alert)", async () => {
    const err = new Error("Nieprawidłowy e-mail lub hasło.");
    err.fieldErrors = null;
    loginSpy.mockRejectedValue(err);
    renderLogin();
    fireEvent.change(screen.getByLabelText("login.email_label"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByLabelText("login.password_label"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /login\.submit/ }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Nieprawidłowy e-mail lub hasło."));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/pages/__tests__/Login.test.jsx`
Expected: FAIL — formularz nadal woła `login` z `apiClient` (stub), nie `useAuth().login`.

- [ ] **Step 3: Edit imports**

W `src/pages/Login.jsx` zamień linie 1–8:

```jsx
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Arrow } from "../components/ui/Icons";
import { useAuth } from "../context/AuthContext";
import { loginSchema, flattenErrors } from "../lib/formSchemas";
```

- [ ] **Step 4: Edit component head + onSubmit**

Zamień blok `export default function Login() { … }` od deklaracji stanu po `onSubmit` (linie 13–35) na:

```jsx
export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(flattenErrors(parsed.error));
      return;
    }
    setLoading(true);
    try {
      await login(parsed.data);
      navigate(params.get("returnTo") || "/account", { replace: true });
    } catch (err) {
      if (err.fieldErrors) setErrors(err.fieldErrors);
      setServerError(err.message || "Logowanie nieudane.");
    } finally {
      setLoading(false);
    }
  };
```

- [ ] **Step 5: Usunąć tymczasowe eksporty `login`/`register` z apiClient**

Login już nie importuje `login` z `apiClient` (używa `useAuth`), a `register` było nieużywane — usuń z `src/lib/apiClient.js` cztery linie dodane tymczasowo w Task 2:

```js
// TYMCZASOWE — Login.jsx wciąż importuje `login` (repin na useAuth w Task 6).
// `register` nieużywane już dziś, ale trzymamy parę razem. Oba usuwa Task 6.
export const login = (data) => postVercel("/api/auth/login", data);
export const register = (data) => postVercel("/api/auth/register", data);
```

- [ ] **Step 6: Run test + build to verify it passes**

Run: `npm run test:run -- src/pages/__tests__/Login.test.jsx && npm run build`
Expected: testy PASS (2), build OK (brak martwych importów `login`/`register`).

- [ ] **Step 7: Commit**

```bash
git add src/pages/Login.jsx src/pages/__tests__/Login.test.jsx src/lib/apiClient.js
git commit -m "feat(auth): wire Login to AuthContext with returnTo, drop Vercel auth shims (B8a)"
```

---

## Task 7: Repin Register na `useAuth`

**Files:**
- Modify: `src/pages/Register.jsx`
- Test: `src/pages/__tests__/Register.test.jsx`

Rejestracja jest 3-krokowym kreatorem. Do API leci tylko `{email, password, name, terms}` (pola `intensity`/`genres`/`time`/newsletter-optin zbierane w UI — sync prefs odłożony do późniejszej podfazy). Walidacja `registerSchema` (Zod) przed wysyłką = instant feedback i lustro reguł hasła backendu.

- [ ] **Step 1: Write the failing test**

```jsx
// src/pages/__tests__/Register.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register.jsx";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k, d) => d || k }) }));
const registerSpy = vi.fn();
vi.mock("../../context/AuthContext.jsx", () => ({ useAuth: () => ({ register: registerSpy }) }));

function renderRegister() {
  return render(<MemoryRouter><Register /></MemoryRouter>);
}

describe("Register", () => {
  beforeEach(() => registerSpy.mockReset());

  it("przejście kreatorem → finalny submit woła register z {email,password,name,terms}", async () => {
    registerSpy.mockResolvedValue({ display_name: "Mara" });
    renderRegister();

    // Krok 1
    fireEvent.change(screen.getByPlaceholderText("register.email_placeholder"), { target: { value: "a@b.co" } });
    fireEvent.change(screen.getByPlaceholderText("register.password_placeholder"), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /register\.next/ }));

    // Krok 2 (domyślne gatunki ["psy","folk"] spełniają canStep2)
    fireEvent.click(screen.getByRole("button", { name: /register\.next/ }));

    // Krok 3
    fireEvent.change(screen.getByPlaceholderText("register.name_placeholder"), { target: { value: "Mara" } });
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]); // terms
    fireEvent.click(screen.getByRole("button", { name: /register\.submit/ }));

    await waitFor(() =>
      expect(registerSpy).toHaveBeenCalledWith({
        email: "a@b.co",
        password: "Password1",
        name: "Mara",
        terms: true,
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/pages/__tests__/Register.test.jsx`
Expected: FAIL — obecny `submit` tylko `setStep(4)`, nie woła `register`.

- [ ] **Step 3: Edit imports**

W `src/pages/Register.jsx` zamień linie 1–5:

```jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { useAuth } from "../context/AuthContext";
import { registerSchema, flattenErrors } from "../lib/formSchemas";
```

- [ ] **Step 4: Edit component head + submit handler**

Zamień blok od `export default function Register() {` (linia 23) po koniec funkcji `submit` (linia 42) na:

```jsx
export default function Register() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ email: "", password: "", name: "", intensity: 7, genres: ["psy", "folk"], terms: false });
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const upd = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const toggleGenre = (id) =>
    setData((d) => ({ ...d, genres: d.genres.includes(id) ? d.genres.filter((g) => g !== id) : [...d.genres, id] }));

  const strength = useMemo(() => strengthOf(data.password), [data.password]);
  const strengthLabel = t(`register.pw_strengths_${Math.max(0, strength - 1)}`);

  const canStep1 = data.email.includes("@") && strength >= 2;
  const canStep2 = data.genres.length >= 1;
  const canStep3 = data.name.length >= 2 && data.terms;

  const submit = async (e) => {
    e.preventDefault();
    setServerError("");
    const payload = { email: data.email, password: data.password, name: data.name, terms: data.terms };
    const parsed = registerSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = flattenErrors(parsed.error);
      setServerError(errs.password || errs.email || errs.name || "Sprawdź wprowadzone dane.");
      return;
    }
    setSubmitting(true);
    try {
      await register(parsed.data);
      setStep(4);
    } catch (err) {
      setServerError(err.message || "Rejestracja nieudana.");
    } finally {
      setSubmitting(false);
    }
  };
```

- [ ] **Step 5: Pokazać błąd serwera i zablokować przycisk w trakcie**

W `src/pages/Register.jsx`, w bloku `step === 3`, znajdź przycisk submit:

```jsx
                <HorrorButton type="submit" className="flex-1" disabled={!canStep3}>{t("register.submit")}</HorrorButton>
```

i zamień na (dodaje `serverError` nad rzędem przycisków + blokadę `submitting`):

```jsx
                <HorrorButton type="submit" className="flex-1" disabled={!canStep3 || submitting}>
                  {submitting ? t("register.submit_loading", "Tworzenie…") : t("register.submit")}
                </HorrorButton>
```

Bezpośrednio nad blokiem `<div className="flex gap-3">` w `step === 3` dodaj:

```jsx
              {serverError && (
                <p className="mb-4 border border-red/40 bg-red/[0.06] p-2.5 font-mono text-[11px] text-red" role="alert">
                  {serverError}
                </p>
              )}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test:run -- src/pages/__tests__/Register.test.jsx`
Expected: PASS (1 test).

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: 0 błędów. (Sukces pokazuje ekran kroku 4 z własnym CTA „/", więc `useNavigate` świadomie nieimportowany.)

- [ ] **Step 8: Commit**

```bash
git add src/pages/Register.jsx src/pages/__tests__/Register.test.jsx
git commit -m "feat(auth): wire Register wizard final step to AuthContext (B8a)"
```

---

## Task 8: Warunkowy login/logout w Nav

**Files:**
- Modify: `src/components/layout/Nav.jsx`

Brak osobnego testu jednostkowego (czysty markup zależny od `useAuth`; pokrycie ręczne/Puppeteer w Task 10). Trzymamy zmianę minimalną — bez redesignu.

- [ ] **Step 1: Dodać import i odczyt stanu**

W `src/components/layout/Nav.jsx` dodaj import po linii `import HorrorButton from "../ui/HorrorButton";`:

```jsx
import { useAuth } from "../../context/AuthContext";
```

W `export default function Nav() {`, pod `const { t } = useTranslation();` dodaj:

```jsx
  const { status, user, logout } = useAuth();
```

- [ ] **Step 2: Desktop — warunkowy blok logowania**

Zamień (linie ~48–50):

```jsx
        <HorrorButton to="/login" variant="ghost" className="!px-[18px] !py-2.5">
          {t("nav.login")}
        </HorrorButton>
```

na:

```jsx
        {status === "authed" ? (
          <div className="flex items-center gap-3">
            <NavLink to="/account" className="font-mono text-[11px] uppercase tracking-ui text-ink-1 hover:text-ink-0">
              {user?.display_name || t("nav.account", "Konto")}
            </NavLink>
            <HorrorButton variant="ghost" className="!px-[18px] !py-2.5" onClick={logout}>
              {t("nav.logout", "Wyloguj")}
            </HorrorButton>
          </div>
        ) : (
          <HorrorButton to="/login" variant="ghost" className="!px-[18px] !py-2.5">
            {t("nav.login")}
          </HorrorButton>
        )}
```

- [ ] **Step 3: Mobile — warunkowy blok logowania**

Zamień (linie ~79–81):

```jsx
            <HorrorButton to="/login" variant="ghost" className="!px-5 !py-3" onClick={() => setMobileOpen(false)}>
              {t("nav.login")}
            </HorrorButton>
```

na:

```jsx
            {status === "authed" ? (
              <HorrorButton variant="ghost" className="!px-5 !py-3" onClick={() => { logout(); setMobileOpen(false); }}>
                {t("nav.logout", "Wyloguj")}
              </HorrorButton>
            ) : (
              <HorrorButton to="/login" variant="ghost" className="!px-5 !py-3" onClick={() => setMobileOpen(false)}>
                {t("nav.login")}
              </HorrorButton>
            )}
```

- [ ] **Step 4: Verify build + lint + testy**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Nav.jsx
git commit -m "feat(auth): conditional login/logout in Nav based on auth status (B8a)"
```

---

## Task 9: Env, CORS, usunięcie stubów Vercel, dev-doc

**Files:**
- Create: `.env.development`
- Modify: `.env.example`, `backend/.env`, `backend/.env.example`, `backend/README.md`
- Delete: `api/auth/login.js`, `api/auth/register.js`

- [ ] **Step 1: Utworzyć `.env.development`**

```
# Frontend dev → Django backend (B8a). Backend lokalnie: cd backend && docker compose up.
VITE_API_URL=http://localhost:8000/api/v1
```

- [ ] **Step 2: Udokumentować w `.env.example`**

Dopisz na końcu `.env.example` (jeśli plik nie istnieje — utwórz z tą treścią):

```
# URL backendu Django (REST /api/v1). Dev: http://localhost:8000/api/v1
VITE_API_URL=http://localhost:8000/api/v1
```

- [ ] **Step 3: Naprawić CORS w backendzie (port Vite 5175)**

W `backend/.env` zamień linię 5:

```
CORS_ALLOWED_ORIGINS=http://localhost:5188
```

na:

```
CORS_ALLOWED_ORIGINS=http://localhost:5175,http://localhost:5188
```

To samo w `backend/.env.example` (linia 5) — identyczna zamiana.

- [ ] **Step 4: Usunąć stuby auth Vercel**

```bash
git rm api/auth/login.js api/auth/register.js
```

(Jeśli katalog `api/auth/` zostanie pusty — `git rm` go usunie automatycznie.)

- [ ] **Step 5: Dopisać dev-doc front+backend w `backend/README.md`**

Po sekcji „Szybki start" dodaj:

```markdown
## Integracja z frontem (B8a)

Front (`/`) gada z backendem przez `/api/v1` (token Knox w nagłówku):

```bash
# 1) backend
cd backend && docker compose up -d
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser   # konto testowe
# 2) front (z katalogu repo)
npm run dev    # http://localhost:5175  (VITE_API_URL → :8000/api/v1)
```

CORS dla `:5175` jest w `CORS_ALLOWED_ORIGINS`. Sanity: `curl http://localhost:8000/api/v1/health/`.
```

- [ ] **Step 6: Verify build (env wczytany) + grep braku martwych importów**

Run: `npm run build`
Expected: build OK.

Run: `grep -rn "from \"../lib/apiClient\"" src/pages/Login.jsx src/pages/Register.jsx`
Expected: brak wyników (oba używają `useAuth`, nie `apiClient.login/register`).

- [ ] **Step 7: Commit**

```bash
git add .env.development .env.example backend/.env backend/.env.example backend/README.md
git rm api/auth/login.js api/auth/register.js
git commit -m "chore(b8a): VITE_API_URL env, CORS port 5175, drop Vercel auth stubs, dev docs"
```

---

## Task 10: Pełna weryfikacja end-to-end

**Files:** brak (weryfikacja).

- [ ] **Step 1: Build + lint + cały zestaw testów**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0 błędów, wszystkie testy zielone (authToken, apiClient, AuthContext, RequireAuth, Login, Register + istniejące PlayerContext/analytics/consent).

- [ ] **Step 2: Uruchomić backend i sprawdzić health**

```bash
cd backend && docker compose up -d
docker compose exec web python manage.py migrate
docker compose exec web python manage.py createsuperuser   # np. test@obskura.app / Test1234
curl -s http://localhost:8000/api/v1/health/
```
Expected: `{"status":"ok",...}`.

- [ ] **Step 3: Ręczny flow E2E (front `npm run dev` na :5175)**

1. `/register` → przejdź kreator (email/hasło z wielką literą i cyfrą, gatunek, nick, zgoda) → konto powstaje, ekran sukcesu.
2. W DevTools: `localStorage.obskura_auth_token` ustawiony.
3. Odśwież stronę → sesja utrzymana (Nav pokazuje nick + „Wyloguj"), bez migotania.
4. `/account` → renderuje (chronione, authed).
5. „Wyloguj" → token znika, Nav → „Zaloguj"; wejście na `/account` → redirect `/login?returnTo=%2Faccount`.
6. `/login` ze złym hasłem → komunikat „Nieprawidłowy e-mail lub hasło." (401 z backendu, bez crashy).
7. Gość (bez tokenu) → `/archive`, `/`, `/club` nadal dostępne.

Expected: wszystkie kroki jak opisano.

- [ ] **Step 4: post-change-audit (screenshoty 1440/768/375)**

Uruchom skill `post-change-audit` na trasach `/login`, `/register`, `/account`. Oceń wizualnie (Nav login/logout, formularze, brak regresji).

- [ ] **Step 5: Zaktualizować BACKEND-PLAN — odhaczyć B8a**

W `BACKEND-PLAN.md` zmień `- [ ] **B8a — Fundament + Auth:**` na `- [x] **B8a — Fundament + Auth:**`.

- [ ] **Step 6: Commit finalny**

```bash
git add BACKEND-PLAN.md
git commit -m "docs(b8a): mark B8a foundation+auth done, end-to-end verified"
```

---

## Self-Review Notes (autor planu)

- **Pokrycie spec:** §3.1 fundament (Task 1,2,9), §3.2 AuthContext (Task 3,5), §3.3 trasy/formularze/nav (Task 4,5,6,7,8), §3.4 sprzątanie Vercel (Task 9), §5 obsługa błędów (Task 2 — 401-tylko-auth, 400→fieldErrors, network, 5xx), §6 testy (Task 1–7,10), §8 weryfikacja (Task 10). Wszystko zmapowane.
- **Spójność nazw:** `request/ApiError/auth.{register,login,logout,logoutAll,me}` (Task 2) używane 1:1 w AuthContext (Task 3) i testach. `getToken/setToken/clearToken` (Task 1) tak samo. `status ∈ idle|loading|authed|guest`, klucz `obskura_auth_token`, event `auth:logout` — spójne wszędzie.
- **Świadome odstępstwo:** login zwraca 401 (nie 400) przy złych danych — apiClient czyści token tylko dla `auth:true`, więc 401 z login leci jako `ApiError` z `detail` do formularza (Task 2 test „używa detail jako message"). Doprecyzowuje §5 specu.
- **Poza zakresem (bez tasków, zgodnie ze specem):** sync prefs z kreatora rejestracji, katalog z API, playback-sync, membership/forum/eventy/WS, deploy.
