import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { SUPPORTED_CODES, FALLBACK_LOCALE, CJK_LOCALES } from "./locales";

// Lazy-loading translation.json per język z /public/locales/{lng}/translation.json.
// Auto-detect z navigator.language → localStorage cache.
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: SUPPORTED_CODES,
    fallbackLng: FALLBACK_LOCALE,
    load: "languageOnly", // "pl-PL" → "pl"
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

// Po zmianie języka: aktualizuj <html lang="..."> + CJK font klasa dla typografii.
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
    document.documentElement.classList.toggle("cjk-locale", CJK_LOCALES.includes(lng));
  }
});

export default i18n;
