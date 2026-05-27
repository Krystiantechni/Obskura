/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: { 0: "#050608", 1: "#0a0d12", 2: "#11151c", 3: "#181d26" },
        ink: { 0: "#f4f1ea", 1: "#c9c4b8", 2: "#6e6a60", 3: "#3a3a3a" },
        red: { DEFAULT: "#ff2a2a", dim: "#b81d1d", soft: "#ff3838" },
        blue: { DEFAULT: "#5fa8ff", dim: "#2c6ec9" },
        line: { DEFAULT: "rgba(255,255,255,0.08)", soft: "rgba(255,255,255,0.04)" },
      },
      fontFamily: {
        serif: ["'Cormorant Garamond'", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        brand: "0.4em",
        ui: "0.12em",
        mono: "0.2em",
        eyebrow: "0.3em",
      },
      animation: {
        "obskura-pulse": "obskura-pulse 2.4s ease-in-out infinite",
        "obskura-pulse-fast": "obskura-pulse 1.4s ease-in-out infinite",
        "red-breath": "red-breath 4s ease-in-out infinite",
        "fog-drift": "fog-drift 60s linear infinite",
        "scan-y": "scan-y 2.2s linear infinite",
        "sci-fi-glow-pulse": "sci-fi-glow-pulse 3s ease-in-out infinite",
        "meta-flicker": "meta-flicker 3s steps(1) infinite",
        "glitch-a": "glitch-a 6s steps(1) infinite",
        "glitch-b": "glitch-b 6s steps(1) infinite",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 6s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
        "marquee-reverse": "marquee 30s linear infinite reverse",
        "spin-slow": "spin 12s linear infinite",
        gradient: "gradient 8s ease infinite",
        "scale-pulse": "scale-pulse 3s ease-in-out infinite",
        blob: "blob 14s ease-in-out infinite",
      },
      keyframes: {
        "obskura-pulse": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(0.85)" },
        },
        "red-breath": {
          "0%, 100%": { opacity: 0.7 },
          "50%": { opacity: 1 },
        },
        "fog-drift": {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "1200px 200px" },
        },
        "scan-y": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(2100%)" },
        },
        "meta-flicker": {
          "0%, 97%, 100%": { opacity: 1 },
          "98%": { opacity: 0.35 },
          "99%": { opacity: 0.85 },
        },
        "glitch-a": {
          "0%, 82%, 100%": { transform: "translate(0, 0)", opacity: 0 },
          "83%": { transform: "translate(-5px, -1px)", opacity: 0.85 },
          "85%": { transform: "translate(4px, 1px)", opacity: 0.6 },
          "87%": { transform: "translate(-7px, 0)", opacity: 0.9 },
          "89%": { transform: "translate(3px, 1px)", opacity: 0.5 },
          "91%": { transform: "translate(-4px, 0)", opacity: 0.8 },
          "93%": { transform: "translate(0, 0)", opacity: 0 },
        },
        "glitch-b": {
          "0%, 82%, 100%": { transform: "translate(0, 0)", opacity: 0 },
          "83%": { transform: "translate(5px, 1px)", opacity: 0.7 },
          "85%": { transform: "translate(-4px, -1px)", opacity: 0.5 },
          "87%": { transform: "translate(6px, 0)", opacity: 0.8 },
          "89%": { transform: "translate(-3px, 1px)", opacity: 0.5 },
          "91%": { transform: "translate(4px, 0)", opacity: 0.7 },
          "93%": { transform: "translate(0, 0)", opacity: 0 },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(2deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "scale-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        blob: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
        },
        "sci-fi-glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      boxShadow: {
        "neon-red": "0 0 24px rgba(255,42,42,0.5), 0 0 60px rgba(255,42,42,0.25)",
        "neon-red-strong": "0 0 24px rgba(255,42,42,0.6), 0 0 60px rgba(255,42,42,0.3)",
        "neon-blue": "0 0 24px rgba(95,168,255,0.6), 0 0 60px rgba(95,168,255,0.3)",
        "cta-red": "0 0 0 1px rgba(255,42,42,0.4), 0 0 40px rgba(255,42,42,0.35), inset 0 0 0 1px rgba(255,255,255,0.1)",
        "cta-red-hover": "0 0 0 1px rgba(255,42,42,0.6), 0 0 60px rgba(255,42,42,0.55), inset 0 0 0 1px rgba(255,255,255,0.15)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-expo": "cubic-bezier(0.87, 0, 0.13, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
