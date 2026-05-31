import { describe, it, expect, beforeEach, vi } from "vitest";

// initAnalytics ma stan modułowy (listenerBound), więc resetujemy moduły między testami,
// żeby każdy test dostał świeży binding eventu i licznik listenerów.
const CONSENT_KEY = "obskura_cookie_consent";
const SCRIPT_ID = "plausible-analytics";

function setConsentInStorage({ preferences = false, analytics = false, marketing = false } = {}) {
  const payload = {
    v: 2,
    necessary: true,
    preferences,
    analytics,
    marketing,
    ts: Date.now(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
}

async function loadInit() {
  // Świeży import — `listenerBound` modułu zaczyna od false.
  vi.resetModules();
  const mod = await import("../analytics.js");
  return mod.initAnalytics;
}

describe("initAnalytics", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("nie wstrzykuje script gdy brak zgody analytics", async () => {
    setConsentInStorage({ analytics: false });

    const initAnalytics = await loadInit();
    initAnalytics();

    const byId = document.getElementById(SCRIPT_ID);
    const byAttr = document.head.querySelector("script[data-domain]");

    expect(byId).toBeNull();
    expect(byAttr).toBeNull();
  });

  it("wstrzykuje skrypt do document.head gdy hasConsent('analytics') jest true", async () => {
    setConsentInStorage({ analytics: true });

    const initAnalytics = await loadInit();
    initAnalytics();

    const byId = document.getElementById(SCRIPT_ID);
    expect(byId).not.toBeNull();
    expect(byId?.tagName).toBe("SCRIPT");
    expect(byId?.parentNode).toBe(document.head);

    const byAttr = document.head.querySelector("script[data-domain]");
    expect(byAttr).not.toBeNull();
    expect(byAttr?.getAttribute("data-domain")).toBeTruthy();
  });

  it("drugie wywołanie initAnalytics nie dubluje skryptu (idempotency po id)", async () => {
    setConsentInStorage({ analytics: true });

    const initAnalytics = await loadInit();
    initAnalytics();
    initAnalytics();
    initAnalytics();

    const scripts = document.head.querySelectorAll(`script#${SCRIPT_ID}`);
    expect(scripts.length).toBe(1);

    const allWithDomain = document.head.querySelectorAll("script[data-domain]");
    expect(allWithDomain.length).toBe(1);
  });

  it("rejestruje listener na 'obskura:consent' gdy brak zgody i wstrzykuje skrypt po dispatchEvent z detail.analytics=true", async () => {
    setConsentInStorage({ analytics: false });

    const initAnalytics = await loadInit();
    initAnalytics();

    // Po starcie — bez skryptu.
    expect(document.getElementById(SCRIPT_ID)).toBeNull();

    // User daje zgodę — symulacja eventu z consent.js (setConsent dispatchuje taki sam event).
    window.dispatchEvent(
      new CustomEvent("obskura:consent", {
        detail: {
          v: 2,
          necessary: true,
          preferences: true,
          analytics: true,
          marketing: false,
          ts: Date.now(),
        },
      }),
    );

    const injected = document.getElementById(SCRIPT_ID);
    expect(injected).not.toBeNull();
    expect(injected?.tagName).toBe("SCRIPT");

    // Dodatkowo: kolejny event nie powinien nic zepsuć (listener się odpiął po pierwszej zgodzie).
    window.dispatchEvent(
      new CustomEvent("obskura:consent", {
        detail: { analytics: true },
      }),
    );
    const all = document.head.querySelectorAll(`script#${SCRIPT_ID}`);
    expect(all.length).toBe(1);
  });
});
