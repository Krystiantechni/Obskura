// Klient API do Vercel serverless functions (api/*).
// W dev (vite preview/dev) bez zdeployowanego API: wykryje 404 i zwróci mockowany success
// żeby UI flow działał bez backendu. W produkcji (Vercel) → realne POST.

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

async function postJSON(path, body) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404 && isDev) {
      // Brak backendu w dev (api/* działa tylko na Vercel). Mock success.
      console.info(`[apiClient] dev mock: ${path}`, body);
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true, mock: true };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message = data?.error || `Błąd serwera (${res.status}).`;
      throw new Error(message);
    }
    return { ok: true, ...data };
  } catch (err) {
    if (err.name === "TypeError" && isDev) {
      // network error w dev — mock success żeby UI działało
      console.info(`[apiClient] dev mock (network): ${path}`, body);
      await new Promise((r) => setTimeout(r, 600));
      return { ok: true, mock: true };
    }
    throw err;
  }
}

export const subscribeNewsletter = (data) => postJSON("/api/newsletter", data);
export const submitContact = (data) => postJSON("/api/contact", data);
export const login = (data) => postJSON("/api/auth/login", data);
export const register = (data) => postJSON("/api/auth/register", data);
