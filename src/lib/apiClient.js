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
  // `detail` bywa nie-stringiem (custom exception handler / Knox) — nie gub komunikatu.
  if (data.detail != null) {
    return { message: typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail) };
  }
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
