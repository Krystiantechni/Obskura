import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist + foldery narzędziowe Claude (bundle designu, skille) — nie kod aplikacji
  globalIgnores(['dist', '.claude/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Pliki konfiguracyjne Node (vite/postcss/tailwind) — globalne __dirname/process
  {
    files: ['*.config.js', 'scripts/**/*.{js,cjs}'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Hooki fundamentu (useReveal/useTypewriter) świadomie synchronizują stan w efekcie
  {
    files: ['src/hooks/**/*.js'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
])
