// Zgoda na cookies / przechowywanie danych — kategorie.
//
// necessary  — zawsze aktywne (zapamiętanie zgody, podstawy serwisu; w przyszłości sesja/CSRF).
// preferences — funkcjonalne: język, ulubione, postęp odsłuchu, wariant hero (gated, patrz hasConsent).
// analytics  — opcjonalne, obecnie NIEUŻYWANE (grunt pod przyszłą anonimową analitykę).
// marketing  — opcjonalne, obecnie NIEUŻYWANE (grunt pod przyszłe piksele reklamowe).
//
// Przed uruchomieniem czegokolwiek opcjonalnego sprawdź hasConsent("analytics"/"marketing"),
// a przed zapisem preferencji — hasConsent("preferences").

const KEY = "obskura_cookie_consent";
const VERSION = 2;

export function getConsent() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (raw && raw.v === VERSION) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function setConsent({ preferences = false, analytics = false, marketing = false }) {
  const payload = {
    v: VERSION,
    necessary: true,
    preferences: !!preferences,
    analytics: !!analytics,
    marketing: !!marketing,
    ts: Date.now(),
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent("obskura:consent", { detail: payload }));
  return payload;
}

// Czy dana kategoria jest dozwolona. "necessary" zawsze true.
// Przed pierwszym wyborem: necessary + preferences = true (funkcjonalne nie psują UX),
// analytics/marketing = false (nie ruszają bez wyraźnej zgody).
export function hasConsent(category) {
  if (category === "necessary") return true;
  const c = getConsent();
  if (!c) return category === "preferences";
  return c[category] === true;
}

export function hasAnalyticsConsent() {
  return hasConsent("analytics");
}
