// Per-trasowe tytuły i opisy. Stosowane klientowo przy zmianie trasy (applySeo).
// Statyczny fallback (dla crawlerów bez JS) jest w index.html.

const SITE = "OBSKURA";

const DEFAULT = {
  title: "OBSKURA — platforma audio horror",
  description:
    "Oryginalne historie grozy w binauralnym 3D. Głosy, które zostają z Tobą długo po tym, jak zdejmiesz słuchawki.",
};

// Tytuł krótki (bez sufiksu) — sufiks „· OBSKURA" doklejany automatycznie poza stroną główną.
const ROUTES = {
  "/": DEFAULT,
  "/archiwum": { title: "Archiwum", description: "Pełny katalog historii grozy OBSKURY — filtruj po gatunku, czasie i narratorze." },
  "/klub": { title: "Klub", description: "Dołącz do klubu OBSKURA — wczesny dostęp, bonusy i materiały zza kulis." },
  "/aplikacja": { title: "Aplikacja", description: "Słuchaj OBSKURY na telefonie — pobieranie offline, binauralny dźwięk 3D, tryb nocny." },
  "/forum": { title: "Forum", description: "Społeczność OBSKURY — teorie, znaleziska i rozmowy o odcinkach." },
  "/kariera": { title: "Kariera", description: "Dołącz do ekipy OBSKURY — narratorzy, scenarzyści, reżyserzy dźwięku." },
  "/konto": { title: "Twoje konto", description: "Historia odsłuchań, ulubione i ustawienia konta OBSKURA." },
  "/mailingi": { title: "Mailingi", description: "Podglądy newsletterów i powiadomień OBSKURY." },
  "/newsletter": { title: "Newsletter", description: "Zapisz się — nowe odcinki i historie prosto na skrzynkę." },
  "/onboarding": { title: "Konfiguracja", description: "Skalibruj binauralny dźwięk 3D i dobierz gatunki na start." },
  "/patroni": { title: "Patroni", description: "Wesprzyj OBSKURĘ i odblokuj materiały dla patronów." },
  "/player": { title: "Odtwarzacz", description: "Immersyjny odtwarzacz z transkryptem, rozdziałami i notatkami." },
  "/prasa": { title: "Prasa", description: "Materiały prasowe, fakty i kontakt dla mediów." },
  "/prawne": { title: "Informacje prawne", description: "Regulamin, polityka prywatności i warunki korzystania z OBSKURY." },
  "/spotkania": { title: "Spotkania", description: "Wydarzenia na żywo i odsłuchania OBSKURY." },
  "/stany": { title: "Stany / Offline", description: "Pobrane odcinki i zarządzanie trybem offline." },
  "/tworcy": { title: "Twórcy", description: "Ludzie, których głos zostaje po ostatnim wyrazie — twórcy OBSKURY." },
  "/wsparcie": { title: "Wsparcie", description: "Pomoc i odpowiedzi na najczęstsze pytania o OBSKURĘ." },
  "/zaloguj": { title: "Zaloguj się", description: "Wróć do swoich historii — zaloguj się do OBSKURY." },
  "/rejestracja": { title: "Rejestracja", description: "Załóż konto OBSKURA i zacznij słuchać." },
};

function metaFor(pathname) {
  if (ROUTES[pathname]) return ROUTES[pathname];
  if (pathname.startsWith("/odcinek/")) {
    return { title: "Odcinek", description: "Posłuchaj odcinka grozy w binauralnym dźwięku 3D na OBSKURZE." };
  }
  return DEFAULT;
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
export function applySeo(pathname) {
  const { title, description } = metaFor(pathname);
  const fullTitle = pathname === "/" ? title : `${title} · ${SITE}`;

  document.title = fullTitle;
  setMeta("name", "description", description);
  setMeta("property", "og:title", fullTitle);
  setMeta("property", "og:description", description);
  setMeta("name", "twitter:title", fullTitle);
  setMeta("name", "twitter:description", description);
}
