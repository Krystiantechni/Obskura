#!/usr/bin/env node
/**
 * Generator narracji ElevenLabs → public/audio/ep-{id}.mp3
 *
 * BEZPIECZEŃSTWO: klucz API żyje TYLKO w .env (gitignore). Nigdy nie trafia
 * do frontendu/bundla. Skrypt uruchamiasz lokalnie, a player gra gotowe pliki.
 *
 * Użycie:
 *   1. cp .env.example .env  i wklej ELEVENLABS_API_KEY oraz ELEVENLABS_VOICE_ID
 *   2. (opcjonalnie) wpisz voiceId ról w scripts/narration/voices.mjs
 *   3. npm run narration              # generuje brakujące
 *      npm run narration -- 12 4      # tylko wskazane id
 *      npm run narration -- --force   # nadpisz istniejące
 *
 * Tryby głosu (scripts/narration/episodes.mjs):
 *   - jeden głos:  { id, title, text, voice }   (voice = nazwa roli / voiceId / pominięty)
 *   - dialog:      { id, title, segments: [{ voice, text }, ...] }  → sklejane ffmpegiem
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { EPISODES } from "./narration/episodes.mjs";
import { VOICES } from "./narration/voices.mjs";

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

const args = process.argv.slice(2);
const force = args.includes("--force");
const ids = args.filter((a) => !a.startsWith("--"));
const targets = ids.length ? EPISODES.filter((e) => ids.includes(e.id)) : EPISODES;

function die(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!API_KEY) die("Brak ELEVENLABS_API_KEY w .env (skopiuj .env.example → .env).");
if (!targets.length) die(`Nie znaleziono odcinków dla id: ${ids.join(", ")}`);
// ELEVENLABS_VOICE_ID jest opcjonalny — to tylko fallback dla ról bez wpisanego voiceId.

let hasFfmpeg = false;
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  hasFfmpeg = true;
} catch {
  hasFfmpeg = false;
}

// nazwa roli → voiceId; pusta rola lub brak → domyślny głos (.env); nieznana nazwa → surowy voiceId.
// Zwraca null gdy nie da się rozwiązać (pusta rola i brak fallbacku) — wołający rzuca czytelny błąd.
function resolveVoice(ref) {
  if (!ref) return DEFAULT_VOICE || null;
  if (ref in VOICES) return VOICES[ref] || DEFAULT_VOICE || null;
  return ref;
}

async function tts(text, voiceId) {
  const res = await fetch(`${API}/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

// Skleja segmenty mp3 z krótką ciszą między głosami (re-enkoduje dla pewności).
function concatSegments(files, outFile, tmp) {
  const silence = join(tmp, "silence.mp3");
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo", "-t", "0.4", "-acodec", "libmp3lame", silence]);
  const items = [];
  files.forEach((f, i) => {
    items.push(`file '${f.replace(/'/g, "'\\''")}'`);
    if (i < files.length - 1) items.push(`file '${silence.replace(/'/g, "'\\''")}'`);
  });
  const list = join(tmp, "list.txt");
  writeFileSync(list, items.join("\n"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-acodec", "libmp3lame", "-b:a", "128k", outFile]);
}

async function generate(ep) {
  const outFile = join(OUT_DIR, `ep-${ep.id}.mp3`);
  if (!force && existsSync(outFile)) {
    console.log(`• ep-${ep.id}  pominięto (istnieje — użyj --force)`);
    return { skipped: true };
  }

  // DIALOG — wiele głosów
  if (Array.isArray(ep.segments) && ep.segments.length) {
    if (!hasFfmpeg) throw new Error("dialog wymaga ffmpeg (brak w PATH) — zainstaluj ffmpeg lub użyj pojedynczego głosu");
    process.stdout.write(`• ep-${ep.id}  „${ep.title}" · ${ep.segments.length} głos(ów) → generuję… `);
    const tmp = mkdtempSync(join(tmpdir(), "obskura-narr-"));
    try {
      const files = [];
      for (let i = 0; i < ep.segments.length; i++) {
        const seg = ep.segments[i];
        const vid = resolveVoice(seg.voice);
        if (!vid) throw new Error(`brak voiceId dla roli "${seg.voice}" (wpisz w voices.mjs lub ustaw ELEVENLABS_VOICE_ID)`);
        const buf = await tts(seg.text, vid);
        const f = join(tmp, `seg-${i}.mp3`);
        writeFileSync(f, buf);
        files.push(f);
      }
      concatSegments(files, outFile, tmp);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
    console.log("ok");
    return {};
  }

  // POJEDYNCZY głos
  const vid = resolveVoice(ep.voice);
  if (!vid) throw new Error(`brak voiceId dla roli "${ep.voice || "(domyślna)"}" (wpisz w voices.mjs lub ustaw ELEVENLABS_VOICE_ID)`);
  process.stdout.write(`• ep-${ep.id}  „${ep.title}" → generuję… `);
  const buf = await tts(ep.text, vid);
  writeFileSync(outFile, buf);
  console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`);
  return {};
}

(async () => {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  console.log(`\nElevenLabs · ${MODEL} · ${targets.length} odcinek(ów)${hasFfmpeg ? "" : " · (brak ffmpeg → dialogi pominięte)"}\n`);

  let ok = 0;
  let skipped = 0;
  for (const ep of targets) {
    try {
      const r = await generate(ep);
      if (r.skipped) skipped++;
      else ok++;
    } catch (e) {
      console.log("");
      console.error(`  ✗ ep-${ep.id}: ${e.message}`);
      if (String(e.message).includes("401")) die("Klucz API odrzucony (401). Sprawdź ELEVENLABS_API_KEY.");
    }
  }
  console.log(`\n✓ Gotowe — wygenerowano ${ok}, pominięto ${skipped}. Pliki w public/audio/\n`);
})();
