// Per-trasowe tytuły i opisy. Stosowane klientowo przy zmianie trasy (applySeo).
// Statyczny fallback (dla crawlerów bez JS) jest w index.html.

const SITE = "OBSKURA";

const DEFAULT = {
  title: "OBSKURA — oryginalny audio horror w binauralnym dźwięku 3D",
  description:
    "Oryginalne historie grozy w binauralnym dźwięku 3D. Schodzisz do tunelu, a coś już tam na Ciebie czeka — i zostaje z Tobą długo po tym, jak zdejmiesz słuchawki.",
};

// Tytuł krótki (bez sufiksu) — sufiks „· OBSKURA" doklejany automatycznie poza stroną główną.
const ROUTES = {
  "/": DEFAULT,
  "/archive": { title: "Archiwum", description: "Pełny katalog historii grozy OBSKURY — filtruj po gatunku, czasie i narratorze." },
  "/club": { title: "Klub", description: "Dołącz do klubu OBSKURA — wczesny dostęp, bonusy i materiały zza kulis." },
  "/app": { title: "Aplikacja", description: "Słuchaj OBSKURY na telefonie — pobieranie offline, binauralny dźwięk 3D, tryb nocny." },
  "/forum": { title: "Forum", description: "Społeczność OBSKURY — teorie, znaleziska i rozmowy o odcinkach." },
  "/careers": { title: "Kariera", description: "Dołącz do ekipy OBSKURY — narratorzy, scenarzyści, reżyserzy dźwięku." },
  "/account": { title: "Twoje konto", description: "Historia odsłuchań, ulubione i ustawienia konta OBSKURA." },
  "/mailings": { title: "Mailingi", description: "Podglądy newsletterów i powiadomień OBSKURY." },
  "/newsletter": { title: "Newsletter", description: "Zapisz się — nowe odcinki i historie prosto na skrzynkę." },
  "/onboarding": { title: "Konfiguracja", description: "Skalibruj binauralny dźwięk 3D i dobierz gatunki na start." },
  "/patrons": { title: "Patroni", description: "Wesprzyj OBSKURĘ i odblokuj materiały dla patronów." },
  "/player": { title: "Odtwarzacz", description: "Immersyjny odtwarzacz z transkryptem, rozdziałami i notatkami." },
  "/press": { title: "Prasa", description: "Materiały prasowe, fakty i kontakt dla mediów." },
  "/legal": { title: "Informacje prawne", description: "Regulamin, polityka prywatności i warunki korzystania z OBSKURY." },
  "/events": { title: "Spotkania", description: "Wydarzenia na żywo i odsłuchania OBSKURY." },
  "/states": { title: "Stany / Offline", description: "Pobrane odcinki i zarządzanie trybem offline." },
  "/creators": { title: "Twórcy", description: "Ludzie, których głos zostaje po ostatnim wyrazie — twórcy OBSKURY." },
  "/support": { title: "Wsparcie", description: "Pomoc i odpowiedzi na najczęstsze pytania o OBSKURĘ." },
  "/login": { title: "Zaloguj się", description: "Wróć do swoich historii — zaloguj się do OBSKURY." },
  "/register": { title: "Rejestracja", description: "Załóż konto OBSKURA i zacznij słuchać." },
};

function routeKey(pathname) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/episode/")) return "episode";
  return pathname.slice(1).replace(/\//g, "_");
}

function metaFor(pathname) {
  if (ROUTES[pathname]) return { ...ROUTES[pathname], key: routeKey(pathname) };
  if (pathname.startsWith("/episode/")) {
    return { title: "Odcinek", description: "Posłuchaj odcinka grozy w binauralnym dźwięku 3D na OBSKURZE.", key: "episode" };
  }
  return { ...DEFAULT, key: "home" };
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Ustawia <title> i meta (description + OG/Twitter) dla danej ścieżki.
// Opcjonalne `t` z react-i18next — jeśli przekazany, tytuły/opisy tłumaczone przez
// klucze seo.{routeKey}_title / seo.{routeKey}_desc. Bez `t` — fallback PL.
// <html lang> jest aktualizowane przez i18n module osobno (src/i18n/index.js).
export function applySeo(pathname, t = null) {
  const { title, description, key } = metaFor(pathname);
  const trTitle = t ? t(`seo.${key}_title`, title) : title;
  const trDesc = t ? t(`seo.${key}_desc`, description) : description;
  const fullTitle = pathname === "/" ? trTitle : `${trTitle} · ${SITE}`;

  document.title = fullTitle;
  setMeta("name", "description", trDesc);
  setMeta("property", "og:title", fullTitle);
  setMeta("property", "og:description", trDesc);
  setMeta("name", "twitter:title", fullTitle);
  setMeta("name", "twitter:description", trDesc);

  // Per-route OG image — generowane przez scripts/og-routes.mjs do public/og/{key}.png.
  // Fallback do statycznego og-cover.jpg jeśli plik nie istnieje (crawler dostanie 404,
  // ale meta i tak zostanie odczytane — nasz fallback w index.html łapie taki przypadek).
  const ogPath = `/og/${key}.png`;
  const absOg = new URL(ogPath, window.location.origin).href;
  setMeta("property", "og:image", absOg);
  setMeta("property", "og:image:width", "1200");
  setMeta("property", "og:image:height", "630");
  setMeta("name", "twitter:image", absOg);
  setMeta("name", "twitter:card", "summary_large_image");
}
