#!/usr/bin/env node
/**
 * Konwersja zdjęć public/images/*.jpg → *.webp (sharp).
 * WebP jest ~25–30% lżejszy niż JPEG przy tej samej jakości.
 *
 * Użycie:  npm run images:webp
 * Po konwersji podmień referencje .jpg → .webp w src i usuń .jpg (robi to commit T-img).
 */
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "public", "images");

const jpgs = readdirSync(DIR).filter((f) => f.endsWith(".jpg"));
if (!jpgs.length) {
  console.log("Brak plików .jpg w public/images.");
  process.exit(0);
}

let before = 0;
let after = 0;
for (const f of jpgs) {
  const src = join(DIR, f);
  const out = join(DIR, f.replace(/\.jpg$/, ".webp"));
  await sharp(src).webp({ quality: 80, effort: 5 }).toFile(out);
  const a = statSync(src).size;
  const b = statSync(out).size;
  before += a;
  after += b;
  console.log(`${f.padEnd(22)} ${(a / 1024).toFixed(0).padStart(5)} KB → ${(b / 1024).toFixed(0).padStart(5)} KB`);
}
console.log(`\nŁącznie: ${(before / 1024 / 1024).toFixed(1)} MB → ${(after / 1024 / 1024).toFixed(1)} MB`);
