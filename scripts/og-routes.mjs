#!/usr/bin/env node
/**
 * Per-route OG card generator → public/og/{routeKey}.png (1200×630).
 *
 * Każda karta = ciemne tło (dada.webp, mocno przyciemnione) + czerwony glow +
 * brand OBSKURA + eyebrow mono + wypalony tytuł i opis trasy (z src/seo.js).
 *
 * Użycie:  npm run og:routes
 *
 * Fonty: systemowe — sharp renderuje przez librsvg, więc trzymamy się
 * Didot/Georgia (serif) + Menlo (mono) + Helvetica (sans). Polskie znaki OK.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdir } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BG_SRC = join(ROOT, "public", "images", "dada.webp");
const OUT_DIR = join(ROOT, "public", "og");

const W = 1200;
const H = 630;
const SERIF = "Didot, 'Hoefler Text', Georgia, serif";
const MONO = "Menlo, 'Courier New', monospace";
const SANS = "Helvetica, Arial, sans-serif";

// Lustrzane odbicie ROUTES z src/seo.js (utrzymywane ręcznie — nie chcemy
// importować ESM source pliku, który używa `document`).
const DEFAULT = {
  title: "OBSKURA — oryginalny audio horror w binauralnym dźwięku 3D",
  description:
    "Oryginalne historie grozy w binauralnym dźwięku 3D. Schodzisz do tunelu, a coś już tam na Ciebie czeka.",
};

const ROUTES = [
  ["home", "OBSKURA", "Oryginalny audio horror w binauralnym dźwięku 3D. Schodzisz do tunelu, a coś już tam czeka."],
  ["archiwum", "Archiwum", "Pełny katalog historii grozy OBSKURY — filtruj po gatunku, czasie i narratorze."],
  ["klub", "Klub", "Dołącz do klubu OBSKURA — wczesny dostęp, bonusy i materiały zza kulis."],
  ["aplikacja", "Aplikacja", "Słuchaj OBSKURY na telefonie — pobieranie offline, binauralny dźwięk 3D, tryb nocny."],
  ["forum", "Forum", "Społeczność OBSKURY — teorie, znaleziska i rozmowy o odcinkach."],
  ["kariera", "Kariera", "Dołącz do ekipy OBSKURY — narratorzy, scenarzyści, reżyserzy dźwięku."],
  ["konto", "Twoje konto", "Historia odsłuchań, ulubione i ustawienia konta OBSKURA."],
  ["mailingi", "Mailingi", "Podglądy newsletterów i powiadomień OBSKURY."],
  ["newsletter", "Newsletter", "Zapisz się — nowe odcinki i historie prosto na skrzynkę."],
  ["onboarding", "Konfiguracja", "Skalibruj binauralny dźwięk 3D i dobierz gatunki na start."],
  ["patroni", "Patroni", "Wesprzyj OBSKURĘ i odblokuj materiały dla patronów."],
  ["player", "Odtwarzacz", "Immersyjny odtwarzacz z transkryptem, rozdziałami i notatkami."],
  ["prasa", "Prasa", "Materiały prasowe, fakty i kontakt dla mediów."],
  ["prawne", "Informacje prawne", "Regulamin, polityka prywatności i warunki korzystania z OBSKURY."],
  ["spotkania", "Spotkania", "Wydarzenia na żywo i odsłuchania OBSKURY."],
  ["stany", "Stany / Offline", "Pobrane odcinki i zarządzanie trybem offline."],
  ["tworcy", "Twórcy", "Ludzie, których głos zostaje po ostatnim wyrazie — twórcy OBSKURY."],
  ["wsparcie", "Wsparcie", "Pomoc i odpowiedzi na najczęstsze pytania o OBSKURĘ."],
  ["zaloguj", "Zaloguj się", "Wróć do swoich historii — zaloguj się do OBSKURY."],
  ["rejestracja", "Rejestracja", "Załóż konto OBSKURA i zacznij słuchać."],
];

// XML escape dla SVG <text>
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Podziel opis na max 2 linie po ok. 60 znaków (heurystyka, bez auto-measure).
function wrap(text, maxChars = 60, maxLines = 2) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (lines.length === maxLines - 1 && (line + " " + w).trim().length > maxChars) {
      // ostatnia dostępna linia — dopchnij i utnij wielokropkiem jeśli trzeba
      const remaining = words.slice(words.indexOf(w)).join(" ");
      const combined = (line ? line + " " : "") + remaining;
      if (combined.length > maxChars) {
        line = combined.slice(0, maxChars - 1).replace(/\s+\S*$/, "") + "…";
      } else {
        line = combined;
      }
      break;
    }
    if ((line + " " + w).trim().length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? line + " " + w : w;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

// Dobierz rozmiar fontu dla tytułu na podstawie długości (im dłuższy, tym mniejszy)
function titleSize(title) {
  const len = title.length;
  if (len <= 10) return 110;
  if (len <= 18) return 88;
  if (len <= 28) return 70;
  return 58;
}

function svgFor(title, description) {
  const ts = titleSize(title);
  const descLines = wrap(description, 64, 2);
  const descY1 = 470;
  const descY2 = 502;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lh" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050608" stop-opacity="0.97"/>
      <stop offset="0.5" stop-color="#050608" stop-opacity="0.88"/>
      <stop offset="1" stop-color="#050608" stop-opacity="0.72"/>
    </linearGradient>
    <linearGradient id="lv" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#050608" stop-opacity="0.92"/>
      <stop offset="0.6" stop-color="#050608" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#050608" stop-opacity="0.55"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.78" r="0.55">
      <stop offset="0" stop-color="#ff2a2a" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#ff2a2a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#lh)"/>
  <rect width="${W}" height="${H}" fill="url(#lv)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- brand mark -->
  <circle cx="84" cy="74" r="12" fill="none" stroke="#ff2a2a" stroke-width="2"/>
  <circle cx="84" cy="74" r="5" fill="#ff2a2a"/>
  <text x="110" y="83" font-family="${SANS}" font-size="25" font-weight="700" letter-spacing="9" fill="#f4f1ea">OBSKURA</text>

  <!-- corner brackets -->
  <path d="M 40 540 L 40 590 L 90 590" stroke="#ff2a2a" stroke-width="2" fill="none" opacity="0.5"/>
  <path d="M ${W - 40} 540 L ${W - 40} 590 L ${W - 90} 590" stroke="#ff2a2a" stroke-width="2" fill="none" opacity="0.5"/>

  <!-- eyebrow -->
  <text x="68" y="338" font-family="${MONO}" font-size="16" letter-spacing="4" fill="#ff2a2a">// AUDIO HORROR · BINAURAL 3D</text>

  <!-- headline -->
  <text x="68" y="${338 + 80}" font-family="${SERIF}" font-size="${ts}" font-style="italic" fill="#f4f1ea">${esc(title)}</text>

  <!-- description -->
  <text x="68" y="${descY1}" font-family="${SANS}" font-size="22" fill="#c9c4b8">${esc(descLines[0] || "")}</text>
  ${descLines[1] ? `<text x="68" y="${descY2}" font-family="${SANS}" font-size="22" fill="#c9c4b8">${esc(descLines[1])}</text>` : ""}

  <!-- footer meta -->
  <line x1="68" y1="566" x2="${W - 68}" y2="566" stroke="#ff2a2a" stroke-width="1" opacity="0.35"/>
  <text x="68" y="596" font-family="${MONO}" font-size="14" letter-spacing="3" fill="#c9c4b8">OBSKURA.STUDIO · WŁÓŻ SŁUCHAWKI</text>
  <text x="${W - 68}" y="596" font-family="${MONO}" font-size="14" letter-spacing="3" fill="#c9c4b8" text-anchor="end">147 HISTORII · 2.4M</text>
</svg>`;
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function generate() {
  await ensureDir(OUT_DIR);

  // Wspólne tło — wczytujemy raz, kompresujemy do bufora.
  const baseBg = await sharp(BG_SRC)
    .resize(W, H, { fit: "cover", position: "attention" })
    .modulate({ brightness: 0.62, saturation: 0.78 })
    .blur(2)
    .toBuffer();

  let count = 0;
  for (const [key, title, desc] of ROUTES) {
    const svg = svgFor(title, desc);
    const out = join(OUT_DIR, `${key}.png`);
    await sharp(baseBg)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(out);
    count++;
    console.log(`✓ ${key}.png`);
  }

  // Fallback "episode" — używany dla dynamicznych /episode/:slug
  const epSvg = svgFor("Odcinek", "Posłuchaj odcinka grozy w binauralnym dźwięku 3D na OBSKURZE.");
  await sharp(baseBg)
    .composite([{ input: Buffer.from(epSvg), top: 0, left: 0 }])
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(join(OUT_DIR, "episode.png"));
  count++;
  console.log(`✓ episode.png`);

  console.log(`\n✓ Wygenerowano ${count} kart OG → public/og/ (${W}×${H})`);
}

// Domyślne wartości eksportowane na wypadek użycia z innego skryptu
export { ROUTES, DEFAULT };

generate().catch((err) => {
  console.error("OG generation failed:", err);
  process.exit(1);
});
