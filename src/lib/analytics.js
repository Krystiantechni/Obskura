// Plausible Analytics — cookieless, ładowany dopiero po zgodzie "analytics".
//
// Plausible sam w sobie NIE używa cookies ani fingerprintingu, więc prawnie nie wymaga zgody
// w większości jurysdykcji. Mimo to, zgodnie z UX cookie consent w tym projekcie,
// ładujemy skrypt dopiero gdy hasConsent("analytics") === true — żeby user miał pełną kontrolę.
//
// Użycie: wywołaj initAnalytics() raz w Layout (useEffect na mount).
// Funkcja:
//   - jeśli zgoda jest -> doda <script> do <head> (idempotentnie)
//   - jeśli zgody nie ma -> założy nasłuch na event "obskura:consent" i doczepi skrypt,
//     gdy user da zgodę później (bez konieczności reloadu strony).

import { hasConsent } from "./consent";

const SCRIPT_ID = "plausible-analytics";
const DOMAIN = "obskura.app"; // zmień jeśli używasz innej domeny
const SRC = "https://plausible.io/js/script.js";

function injectScript() {
  if (typeof document === "undefined") return;
  if (document.getElementById(SCRIPT_ID)) return; // już wstrzyknięty
  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.defer = true;
  s.setAttribute("data-domain", DOMAIN);
  s.src = SRC;
  document.head.appendChild(s);
}

let listenerBound = false;

export function initAnalytics() {
  if (typeof window === "undefined") return;

  if (hasConsent("analytics")) {
    injectScript();
    return;
  }

  // Brak zgody — nasłuchuj na zmianę. Bind raz, żeby unikać duplikatów przy re-mount.
  if (listenerBound) return;
  listenerBound = true;

  const onConsentChange = (e) => {
    const granted = e?.detail?.analytics === true;
    if (granted) {
      injectScript();
      window.removeEventListener("obskura:consent", onConsentChange);
    }
  };

  window.addEventListener("obskura:consent", onConsentChange);
}
