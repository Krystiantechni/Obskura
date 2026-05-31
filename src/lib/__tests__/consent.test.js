import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getConsent,
  setConsent,
  hasConsent,
  hasAnalyticsConsent,
} from "../consent.js";

const STORAGE_KEY = "obskura_cookie_consent";
const CURRENT_VERSION = 2;

describe("src/lib/consent.js", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("getConsent", () => {
    it("zwraca null gdy localStorage jest pusty", () => {
      expect(getConsent()).toBeNull();
    });

    it("zwraca null gdy zapisany dokument ma starą wersję (v=1)", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          v: 1,
          necessary: true,
          preferences: true,
          analytics: true,
          marketing: true,
          ts: Date.now(),
        }),
      );
      expect(getConsent()).toBeNull();
    });

    it("zwraca obiekt gdy zapisana wersja zgadza się z aktualną", () => {
      const payload = {
        v: CURRENT_VERSION,
        necessary: true,
        preferences: true,
        analytics: false,
        marketing: false,
        ts: 123,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      expect(getConsent()).toEqual(payload);
    });
  });

  describe("setConsent", () => {
    it("zapisuje strukturę z polami v, necessary:true, preferences, analytics, marketing, ts do localStorage pod kluczem obskura_cookie_consent", () => {
      const before = Date.now();
      setConsent({ preferences: true, analytics: true, marketing: false });
      const after = Date.now();

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);

      expect(parsed.v).toBe(CURRENT_VERSION);
      expect(parsed.necessary).toBe(true);
      expect(parsed.preferences).toBe(true);
      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(false);
      expect(typeof parsed.ts).toBe("number");
      expect(parsed.ts).toBeGreaterThanOrEqual(before);
      expect(parsed.ts).toBeLessThanOrEqual(after);
    });

    it("dispatchuje window event 'obskura:consent' z detail równym payloadowi", () => {
      let receivedDetail = null;
      let receivedType = null;
      const listener = (event) => {
        receivedType = event.type;
        receivedDetail = event.detail;
      };
      window.addEventListener("obskura:consent", listener);

      try {
        const payload = setConsent({
          preferences: true,
          analytics: false,
          marketing: true,
        });

        expect(receivedType).toBe("obskura:consent");
        expect(receivedDetail).toEqual(payload);
        expect(receivedDetail.v).toBe(CURRENT_VERSION);
        expect(receivedDetail.necessary).toBe(true);
        expect(receivedDetail.preferences).toBe(true);
        expect(receivedDetail.analytics).toBe(false);
        expect(receivedDetail.marketing).toBe(true);
      } finally {
        window.removeEventListener("obskura:consent", listener);
      }
    });

    it("woła window.dispatchEvent dokładnie raz przy zapisie", () => {
      const dispatchSpy = vi.spyOn(window, "dispatchEvent");
      setConsent({ preferences: true });
      const consentCalls = dispatchSpy.mock.calls.filter(
        ([evt]) => evt && evt.type === "obskura:consent",
      );
      expect(consentCalls).toHaveLength(1);
    });
  });

  describe("hasConsent — defaults bez zapisanej zgody", () => {
    it("hasConsent('necessary') jest zawsze true (nawet bez zapisanej zgody)", () => {
      expect(hasConsent("necessary")).toBe(true);
    });

    it("hasConsent('preferences') true gdy brak zapisanej zgody (default user-friendly)", () => {
      expect(hasConsent("preferences")).toBe(true);
    });

    it("hasConsent('analytics') false gdy brak zapisanej zgody (require opt-in)", () => {
      expect(hasConsent("analytics")).toBe(false);
    });

    it("hasConsent('marketing') false gdy brak zapisanej zgody", () => {
      expect(hasConsent("marketing")).toBe(false);
    });
  });

  describe("hasConsent — po setConsent", () => {
    it("po setConsent({analytics:true}) hasConsent('analytics') = true", () => {
      setConsent({ analytics: true });
      expect(hasConsent("analytics")).toBe(true);
    });

    it("'necessary' pozostaje true nawet gdy user zapisał zgodę bez analytics/marketing", () => {
      setConsent({ preferences: false, analytics: false, marketing: false });
      expect(hasConsent("necessary")).toBe(true);
    });

    it("hasAnalyticsConsent jest aliasem na hasConsent('analytics')", () => {
      expect(hasAnalyticsConsent()).toBe(false);
      setConsent({ analytics: true });
      expect(hasAnalyticsConsent()).toBe(true);
    });
  });
});
