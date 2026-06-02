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
