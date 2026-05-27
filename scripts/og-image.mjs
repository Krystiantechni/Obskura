#!/usr/bin/env node
/**
 * Generator obrazka Open Graph → public/og-cover.jpg (1200×630).
 * Key-art (dada.jpg) + gradient + nagłówek + CTA "wypalone" na grafice.
 *
 * Użycie:  npm run og
 *
 * Fonty: systemowe (macOS) z polskimi znakami — bez zależności od Google Fonts,
 * bo sharp/SVG renderuje tylko fonty zainstalowane w systemie.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "images", "dada.webp");
const OUT = join(ROOT, "public", "og-cover.jpg");

const W = 1200;
const H = 630;
const SERIF = "Didot, 'Hoefler Text', Georgia, serif";
const MONO = "Menlo, 'Courier New', monospace";
const SANS = "Helvetica, Arial, sans-serif";

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lh" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#050608" stop-opacity="0.96"/>
      <stop offset="0.4" stop-color="#050608" stop-opacity="0.8"/>
      <stop offset="0.72" stop-color="#050608" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#050608" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="lv" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#050608" stop-opacity="0.88"/>
      <stop offset="0.5" stop-color="#050608" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#lh)"/>
  <rect width="${W}" height="${H}" fill="url(#lv)"/>

  <!-- brand -->
  <circle cx="84" cy="74" r="12" fill="none" stroke="#ff2a2a" stroke-width="2"/>
  <circle cx="84" cy="74" r="5" fill="#ff2a2a"/>
  <text x="110" y="83" font-family="${SANS}" font-size="25" font-weight="700" letter-spacing="9" fill="#f4f1ea">OBSKURA</text>

  <!-- eyebrow -->
  <text x="72" y="382" font-family="${MONO}" font-size="16" letter-spacing="4" fill="#ff2a2a">// AUDIO HORROR · BINAURAL 3D</text>

  <!-- headline -->
  <text x="68" y="452" font-family="${SERIF}" font-size="80" fill="#f4f1ea">Słuchaj, <tspan font-style="italic" fill="#c9c4b8">czego inni</tspan></text>
  <text x="68" y="532" font-family="${SERIF}" font-size="80" font-style="italic" fill="#ff2a2a">nie słyszą</text>

  <!-- CTA -->
  <rect x="72" y="566" width="226" height="48" fill="#ff2a2a"/>
  <polygon points="96,580 96,600 113,590" fill="#ffffff"/>
  <text x="124" y="596" font-family="${SANS}" font-size="16" font-weight="700" letter-spacing="2" fill="#ffffff">SŁUCHAJ TERAZ</text>
  <text x="322" y="596" font-family="${MONO}" font-size="14" letter-spacing="2" fill="#c9c4b8">147 HISTORII · 2.4M</text>
</svg>`;

const base = await sharp(SRC)
  .resize(W, H, { fit: "cover", position: "attention" })
  .modulate({ saturation: 0.92 })
  .toBuffer();

await sharp(base)
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(OUT);

console.log(`✓ OG cover → public/og-cover.jpg (${W}×${H})`);
