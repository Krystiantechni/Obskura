// Audyt responsywności — screenshoty + twarde metryki na 3 breakpointach dla route'ów.
// Wymaga działającego dev/preview serwera. Domyślnie :5188 (Obskura), wszystkie route, 3 viewporty.
//
//   node scripts/mobile-audit-shots.mjs
//   BASE_URL=http://localhost:5188 node scripts/mobile-audit-shots.mjs
//   ROUTES="/support,/login" VIEWPORTS="mobile,desktop" node scripts/mobile-audit-shots.mjs   # podzbiór (per-zakładka test)
//
import puppeteer from "puppeteer";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:5188";
const OUT = process.env.OUT_DIR || "/tmp/obskura-mobile-audit";

// pełna mapa route -> slug (po renamingu EN aktualizować tutaj)
const ALL_ROUTES = [
  ["/", "home"],
  ["/zaloguj", "login"],
  ["/rejestracja", "register"],
  ["/archiwum", "archiwum"],
  ["/klub", "klub"],
  ["/odcinek/1", "odcinek"],
  ["/aplikacja", "aplikacja"],
  ["/forum", "forum"],
  ["/kariera", "kariera"],
  ["/konto", "konto"],
  ["/mailingi", "mailingi"],
  ["/newsletter", "newsletter"],
  ["/onboarding", "onboarding"],
  ["/patroni", "patroni"],
  ["/player", "player"],
  ["/prasa", "prasa"],
  ["/prawne", "prawne"],
  ["/spotkania", "spotkania"],
  ["/stany", "stany"],
  ["/tworcy", "tworcy"],
  ["/wsparcie", "wsparcie"],
  ["/nie-istnieje-404", "notfound404"],
];

const ALL_VIEWPORTS = {
  mobile: { width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};

// filtry z env
const routeFilter = (process.env.ROUTES || "").split(",").map((s) => s.trim()).filter(Boolean);
const ROUTES = routeFilter.length ? ALL_ROUTES.filter(([r]) => routeFilter.includes(r)) : ALL_ROUTES;
const vpFilter = (process.env.VIEWPORTS || "").split(",").map((s) => s.trim()).filter(Boolean);
const VP_NAMES = vpFilter.length ? vpFilter : Object.keys(ALL_VIEWPORTS);

// Metryki responsywności wstrzykiwane do strony.
const COLLECT = () => {
  const vw = window.innerWidth;
  const docW = document.documentElement.scrollWidth;
  const bodyW = document.body ? document.body.scrollWidth : docW;
  const maxW = Math.max(docW, bodyW);
  const sel = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls = (el.className && typeof el.className === "string")
      ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".")
      : "";
    return `${el.tagName.toLowerCase()}${id}${cls}`;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
  };
  const overflow = [];
  for (const el of document.querySelectorAll("*")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1.5 || r.left < -1.5) overflow.push({ sel: sel(el), right: Math.round(r.right), left: Math.round(r.left), w: Math.round(r.width) });
  }
  overflow.sort((a, b) => (b.right - vw) - (a.right - vw));
  const seen = new Set(); const overflowTop = [];
  for (const o of overflow) { if (seen.has(o.sel)) continue; seen.add(o.sel); overflowTop.push(o); if (overflowTop.length >= 18) break; }

  const clickable = document.querySelectorAll('a, button, [role="button"], input:not([type="hidden"]), select, textarea, [onclick]');
  const small = [];
  for (const el of clickable) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 44 || r.height < 44) small.push({ sel: sel(el), w: Math.round(r.width), h: Math.round(r.height), txt: (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 24) });
  }

  const tiny = []; const seenTiny = new Set();
  for (const el of document.querySelectorAll("p, span, a, li, label, button, div, small, em, td, th")) {
    if (!el.childNodes.length) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasText || !visible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs && fs < 11.5) { const key = sel(el) + Math.round(fs); if (seenTiny.has(key)) continue; seenTiny.add(key); tiny.push({ sel: sel(el), fs: +fs.toFixed(1), txt: el.innerText.trim().slice(0, 30) }); }
  }

  return {
    viewportWidth: vw,
    documentScrollWidth: maxW,
    horizontalOverflow: maxW > vw + 1.5,
    overflowPx: Math.max(0, Math.round(maxW - vw)),
    pageHeight: document.documentElement.scrollHeight,
    overflowElements: overflowTop,
    overflowCount: overflow.length,
    smallTouchTargets: small.slice(0, 20),
    smallTouchCount: small.length,
    tinyText: tiny.slice(0, 15),
    tinyTextCount: tiny.length,
  };
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((res) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 600); y += 600; if (y >= document.documentElement.scrollHeight) { clearInterval(t); res(); } }, 60); });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 250));
}

(async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
  const results = {};

  for (const vpName of VP_NAMES) {
    const vp = ALL_VIEWPORTS[vpName];
    if (!vp) { console.log(`⚠ nieznany viewport: ${vpName}`); continue; }
    console.log(`\n── ${vpName.toUpperCase()} (${vp.width}px) ──`);
    for (const [route, slug] of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport(vp);
      await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
      const url = BASE + route;
      try { await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 }); }
      catch { try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 }); } catch { /* ignore */ } }
      await new Promise((r) => setTimeout(r, 700));
      await autoScroll(page);
      let metrics = {};
      try { metrics = await page.evaluate(COLLECT); } catch (e) { metrics = { error: String(e) }; }
      const file = `${OUT}/${slug}-${vp.width}.png`;
      try { await page.screenshot({ path: file, fullPage: true }); } catch { await page.screenshot({ path: file }); }
      results[`${route}@${vpName}`] = { slug, viewport: vpName, url, screenshot: file, ...metrics };
      console.log(`✓ ${route.padEnd(20)} overflow=${metrics.horizontalOverflow ? "+" + metrics.overflowPx + "px" : "ok"} touch<44=${metrics.smallTouchCount} tiny=${metrics.tinyTextCount} h=${metrics.pageHeight}`);
      await page.close();
    }
  }

  await writeFile(`${OUT}/metrics.json`, JSON.stringify(results, null, 2));
  console.log(`\nMetryki → ${OUT}/metrics.json\nScreenshoty → ${OUT}/`);
  await browser.close();
})();
