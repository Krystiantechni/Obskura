import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs";
import prerender from "@prerenderer/rollup-plugin";

// Rolldown-vite (Vite 8) ma własną ścieżkę emitu dla index.html — przez to
// @prerenderer/rollup-plugin nie potrafi nadpisać dist/index.html (delete + emitFile
// w generateBundle nie dochodzi do skutku). Robimy małą łatkę: capture prerendered HTML
// dla "/" w postProcess, potem zapisujemy ręcznie w closeBundle.
function rootIndexFix(state) {
  return {
    name: "obskura-ssg-root-index-fix",
    apply: "build",
    enforce: "post",
    closeBundle: {
      sequential: true,
      handler() {
        if (!state.rootHtml || !state.outDir) return;
        const target = path.join(state.outDir, "index.html");
        if (fs.existsSync(target)) return;
        fs.writeFileSync(target, state.rootHtml, "utf8");
      },
    },
  };
}

// Vite z aliasem "@" → src oraz manualChunks dla Three.js (lazy chunk).
//
// SSG: w trybie `npm run build:ssg` (env VITE_SSG=true) dopinamy
// @prerenderer/rollup-plugin — po zwykłym Vite buildzie odpalamy headless Chrome,
// renderujemy każdą statyczną trasę i piszemy dist/<route>/index.html.
// Plugin dodawany warunkowo, żeby normalny `vite build` był szybki i bez Puppeteera.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_DEV_PORT) || 5175;
  const ssg = process.env.VITE_SSG === "true";

  // Statyczne trasy z Router.jsx (bez /episode/:id — dynamic).
  // Każda dostaje własny dist/<path>/index.html z gotowym HTML, meta i og:*.
  const prerenderRoutes = [
    "/",
    "/archive",
    "/club",
    "/app",
    "/forum",
    "/careers",
    "/account",
    "/mailings",
    "/newsletter",
    "/onboarding",
    "/patrons",
    "/player",
    "/press",
    "/legal",
    "/events",
    "/states",
    "/creators",
    "/support",
    "/login",
    "/register",
  ];

  // Stan przekazywany między plugin-prerender (postProcess) a rootIndexFix (closeBundle).
  const ssgState = { rootHtml: null, outDir: null };

  return {
    plugins: [
      react(),
      ssg && {
        name: "obskura-ssg-outdir-capture",
        apply: "build",
        configResolved(cfg) {
          ssgState.outDir = path.resolve(cfg.root, cfg.build.outDir);
        },
      },
      ssg &&
        prerender({
          routes: prerenderRoutes,
          renderer: "@prerenderer/renderer-puppeteer",
          rendererOptions: {
            // Headless Chrome — czeka aż React zamontuje treść (root#root nie jest pusty),
            // a applySeo() z Layout.jsx zdąży zaktualizować <title>/<meta>.
            renderAfterTime: 2500,
            maxConcurrentRoutes: 2,
            headless: true,
            launchOptions: {
              args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
          },
          postProcess(renderedRoute) {
            // Łapiemy HTML "/", bo emit przez rolldown-vite gubi się w bundlerze.
            if (renderedRoute.route === "/") {
              ssgState.rootHtml = renderedRoute.html;
            }
            return renderedRoute;
          },
        }),
      ssg && rootIndexFix(ssgState),
    ].filter(Boolean),
    server: {
      port,
      strictPort: true,
    },
    preview: {
      port,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("three") || id.includes("@react-three")) return "three";
              if (id.includes("framer-motion")) return "motion";
              if (id.includes("gsap")) return "gsap";
              if (id.includes("lenis")) return "lenis";
              if (id.includes("react-i18next") || id.includes("/i18next")) return "i18n";
              if (id.includes("react-router-dom") || id.includes("react-router") || id.includes("@remix-run/router")) return "router";
              if (id.includes("/zod/") || id.includes("node_modules/zod")) return "zod";
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});
