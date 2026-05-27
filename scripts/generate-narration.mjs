#!/usr/bin/env node
/**
 * Generator narracji ElevenLabs → public/audio/ep-{id}.mp3
 *
 * BEZPIECZEŃSTWO: klucz API żyje TYLKO w .env (gitignore). Nigdy nie trafia
 * do frontendu/bundla. Ten skrypt uruchamiasz lokalnie, a player gra gotowe pliki.
 *
 * Użycie:
 *   1. cp .env.example .env  i wklej ELEVENLABS_API_KEY oraz ELEVENLABS_VOICE_ID
 *   2. npm run narration            # generuje brakujące
 *      npm run narration -- 12 4    # tylko wskazane id
 *      npm run narration -- --force # nadpisz istniejące
 *
 * Teksty edytujesz w scripts/narration/episodes.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { EPISODES } from "./narration/episodes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "audio");
const API = "https://api.elevenlabs.io/v1/text-to-speech";
const MODEL = "eleven_multilingual_v2"; // wspiera polski

// --- Minimalny parser .env (bez zależności) ---
function loadEnv() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const API_KEY = env.ELEVENLABS_API_KEY;
const DEFAULT_VOICE = env.ELEVENLABS_VOICE_ID;

// --- CLI args ---
const args = process.argv.slice(2);
const force = args.includes("--force");
const ids = args.filter((a) => !a.startsWith("--"));
const targets = ids.length ? EPISODES.filter((e) => ids.includes(e.id)) : EPISODES;

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!API_KEY) die("Brak ELEVENLABS_API_KEY w .env (skopiuj .env.example → .env).");
if (!DEFAULT_VOICE) die("Brak ELEVENLABS_VOICE_ID w .env (wklej id głosu z panelu ElevenLabs).");
if (!targets.length) die(`Nie znaleziono odcinków dla id: ${ids.join(", ")}`);

async function generate(ep) {
  const voiceId = ep.voiceId || DEFAULT_VOICE;
  const outFile = join(OUT_DIR, `ep-${ep.id}.mp3`);

  if (!force && existsSync(outFile)) {
    console.log(`• ep-${ep.id}  pominięto (istnieje — użyj --force by nadpisać)`);
    return { id: ep.id, skipped: true };
  }

  process.stdout.write(`• ep-${ep.id}  „${ep.title}" → generuję… `);
  const res = await fetch(`${API}/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text: ep.text,
      model_id: MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${detail.slice(0, 300)}`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outFile, buf);
  const kb = (buf.length / 1024).toFixed(0);
  console.log(`ok (${kb} KB)`);
  return { id: ep.id, bytes: buf.length };
}

(async () => {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  console.log(`\nElevenLabs · ${MODEL} · ${targets.length} odcinek(ów)\n`);

  let ok = 0;
  let skipped = 0;
  for (const ep of targets) {
    try {
      const r = await generate(ep);
      r.skipped ? skipped++ : ok++;
    } catch (e) {
      console.log("");
      console.error(`  ✗ ep-${ep.id}: ${e.message}`);
      if (String(e.message).includes("401")) die("Klucz API odrzucony (401). Sprawdź ELEVENLABS_API_KEY.");
    }
  }

  console.log(`\n✓ Gotowe — wygenerowano ${ok}, pominięto ${skipped}. Pliki w public/audio/\n`);
})();
