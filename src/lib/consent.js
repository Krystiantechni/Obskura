// Zgoda na cookies / przechowywanie danych.
// Kategoria "necessary" jest zawsze włączona (język, ulubione, stan playera — funkcjonalne,
// nie wymagają zgody wg RODO). "analytics" jest opcjonalne i domyślnie wyłączone — pod
// przyszłą analitykę: przed jej załadowaniem sprawdź hasAnalyticsConsent().

const KEY = "obskura_cookie_consent";
const VERSION = 1;

export function getConsent() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.v === VERSION) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function setConsent({ analytics }) {
  const payload = { v: VERSION, necessary: true, analytics: !!analytics, ts: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(payload));
  // powiadom resztę aplikacji (np. przyszły loader analityki) o zmianie
  window.dispatchEvent(new CustomEvent("obskura:consent", { detail: payload }));
  return payload;
}

export function hasAnalyticsConsent() {
  return getConsent()?.analytics === true;
}
