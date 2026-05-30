/* eslint-env node */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Vite z aliasem "@" → src oraz manualChunks dla Three.js (lazy chunk).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_DEV_PORT) || 5175;

  return {
    plugins: [react()],
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
            }
            return undefined;
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },
  };
});
