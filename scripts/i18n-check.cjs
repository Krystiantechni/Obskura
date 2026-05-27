#!/usr/bin/env node
/**
 * Sprawdza ile kluczy w każdym pliku translation.json jest placeholderem
 * (identycznym z odpowiadającym kluczem w en/translation.json).
 *
 * Uruchom: node scripts/i18n-check.cjs
 */

const fs = require("fs");
const path = require("path");

const LOCALES_DIR = path.join(__dirname, "..", "public", "locales");
const REFERENCE = "en";
const SOURCE_LANGS = ["en", "pl"]; // języki uważane za "źródło prawdy"

// Klucze które celowo zostają identyczne we wszystkich językach (brand/marka).
const BRAND_KEYS = new Set([
  "hero.title_line1",   // DESIGN
  "hero.title_line3",   // BEYOND
  "hero.scroll_hint",   // "scroll to dive" (po angielsku jako brand)
  "hero.typewriter",    // ["WOW", "MOTION", "CRAFT", "VIBES"] — brand words
]);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function flatten(obj, prefix = "") {
  const out = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = Array.isArray(v) ? JSON.stringify(v) : String(v);
    }
  }
  return out;
}

const refFile = path.join(LOCALES_DIR, REFERENCE, "translation.json");
const ref = flatten(loadJson(refFile));
const refKeys = Object.keys(ref);

const langs = fs
  .readdirSync(LOCALES_DIR)
  .filter((d) => fs.statSync(path.join(LOCALES_DIR, d)).isDirectory())
  .sort();

console.log(`\n📊 i18n status — ${langs.length} języków, ${refKeys.length} kluczy każdy\n`);
console.log("Język  | Status | Placeholder | Brakujące | Procent");
console.log("-------|--------|-------------|-----------|--------");

const summary = { ok: 0, partial: 0, placeholder: 0 };
const todo = [];

for (const lng of langs) {
  const file = path.join(LOCALES_DIR, lng, "translation.json");
  if (!fs.existsSync(file)) {
    console.log(`${lng.padEnd(6)} | ❌ BRAK  |             |           |`);
    continue;
  }
  const data = flatten(loadJson(file));
  let placeholders = 0;
  let missing = 0;
  for (const k of refKeys) {
    if (!(k in data)) missing++;
    else if (data[k] === ref[k] && !SOURCE_LANGS.includes(lng) && !BRAND_KEYS.has(k)) {
      placeholders++;
    }
  }
  const translated = refKeys.length - placeholders - missing;
  const pct = Math.round((translated / refKeys.length) * 100);

  let status = "✅";
  if (SOURCE_LANGS.includes(lng)) {
    status = "🔵 src";
    summary.ok++;
  } else if (placeholders === 0 && missing === 0) {
    status = "✅ ok ";
    summary.ok++;
  } else if (placeholders === refKeys.length || translated === 0) {
    status = "⬜ ph  ";
    summary.placeholder++;
    todo.push(lng);
  } else {
    status = "🟡 mix ";
    summary.partial++;
    todo.push(lng);
  }

  console.log(
    `${lng.padEnd(6)} | ${status} | ${String(placeholders).padStart(11)} | ${String(missing).padStart(9)} | ${pct}%`,
  );
}

console.log("\n📋 Podsumowanie:");
console.log(`  ✅ Pełne tłumaczenie: ${summary.ok}`);
console.log(`  🟡 Częściowe: ${summary.partial}`);
console.log(`  ⬜ Placeholder (kopia EN): ${summary.placeholder}`);

if (todo.length > 0) {
  console.log(`\n🎯 Do przetłumaczenia (${todo.length} języków):`);
  console.log(`  ${todo.join(", ")}`);
  console.log(`\nWywołaj agenta translator: "@translator przetłumacz brakujące języki"`);
}
