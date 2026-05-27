# OBSKURA — Roadmap / Backlog

Living-doc z zadaniami i pomysłami. **Ty wybierasz** co robimy (po ID, np. „zrób T3").
Claude **aktualizuje** ten plik na bieżąco: przenosi do „Zrobione", dopisuje nowe pomysły.

**Legenda statusu:** ⬜ do zrobienia · 🟡 w toku · ✅ zrobione · 💡 pomysł (niezweryfikowany)
**Nakład:** S (mały) · M (średni) · L (duży) — **Wartość:** ⭐–⭐⭐⭐

_Ostatnia aktualizacja: 2026-05-27_

---

## 🔝 Priorytet (rekomendowana kolejność)

| ID | Zadanie | Wartość | Nakład | Status |
|----|---------|:------:|:-----:|:-----:|
| **T1** | Optymalizacja obrazów → WebP/AVIF + `srcset` (public/images ~36 MB PNG) | ⭐⭐⭐ | S | ⬜ |
| **T2** | SEO / meta per trasa + Open Graph (miniaturka z key-artem na social) | ⭐⭐⭐ | S–M | ⬜ |
| **T3** | ErrorBoundary dla lazy-chunków (retry, gdy chunk się nie pobierze) | ⭐⭐ | S | ⬜ |
| **T4** | Mini-player nie zasłania stopki (padding-bottom gdy gra) | ⭐ | S | ⬜ |
| **T5** | Strona `/player` spięta z realnym audio (dziś symuluje oś czasu) | ⭐⭐ | M | ⬜ |
| **T6** | „Moja biblioteka" / widok ulubionych (mamy favorites w localStorage) | ⭐⭐ | M | ⬜ |
| **T7** | Realny backend pod formularze (newsletter/rejestracja/kontakt) | ⭐⭐ | M | ⬜ |
| **T8** | SFX + muzyka pod narrację (mix warstw ffmpegiem) | ⭐⭐ | M | ⬜ |
| **T9** | Dokończyć i18n stron prawnych (Prawne/Stany/Mailingi hardcoded PL) | ⭐⭐ | M | ⬜ |
| **T10** | Testy (Vitest + RTL): PlayerContext + smoke-testy tras | ⭐⭐ | M | ⬜ |

### Szczegóły zadań

- **T1** — Konwersja PNG→WebP/AVIF, responsywne rozmiary, `loading="lazy"` poza foldem. Największy zysk LCP/Lighthouse (code-splitting już zrobiony).
- **T2** — Per-route `<title>`/`<meta>`/OG (np. lekki helmet albo własny hook). Wymaga obrazka OG (key-art).
- **T3** — `Suspense` ma fallback, ale brak obsługi błędu pobrania chunku (typowe po redeployu przy starej karcie). Granica błędu z „spróbuj ponownie".
- **T4** — Player to fixed overlay zakrywający dół `Footer`. Dodać dolny padding do treści, gdy `current` aktywny. (zgłoszone w pass-ie polish)
- **T5** — Zsynchronizować transkrypt/rozdziały w `pages/Player.jsx` z prawdziwym `currentTime` z `PlayerContext`.
- **T6** — Ekran ulubionych spięty z `Konto`; render z `favorites` + `getTrack`.
- **T7** — Serverless na Vercelu (`api/*`) + walidacja; dziś formularze są UI-only.
- **T8** — Generator SFX/muzyki (wzorzec jak narracja) + krok mixujący ffmpegiem. Wymaga scope'ów Sound Effects/Music na kluczu.
- **T9** — Wyciągnąć teksty do `public/locales/*/translation.json`. Dług z notatek (i18n_gap_legal_pages).
- **T10** — Najpierw krytyczna logika `PlayerContext` (kolejka, resume, sleep), potem smoke-testy tras.

---

## 💡 Pomysły / parking (do oceny)

- Footer social to `href="#"` — podłączyć realne URL-e przed produkcją.
- Waveform w `pages/Player.jsx` bleeduje ~5 px na 375 — `overflow-hidden` na kontenerze.
- Po upgradzie planu ElevenLabs: odkomentować polskie library voices w `scripts/narration/voices.mjs` + `npm run narration -- --force`.
- Głos per postać w pełnych odcinkach (rozbudowa dialogów w `episodes.mjs`).
- Skip-link „przejdź do treści" dla dostępności klawiaturowej.
- Consent/analytics (jeśli wejdzie produkcyjnie).
- Scena 3D w hero (R3F) — mocny efekt „0–3s", ale L i ryzyko perf.
- Resume „kontynuuj słuchanie" jako widoczny baner na Home (mamy stan w localStorage).

---

## ✅ Zrobione

- Naprawa holograficznego nagłówka (`SciFiText`) — czysty neon + chromatic aberration, złagodzony glitch.
- Cinematic page transitions (AnimatePresence + frozen outlet) w `Layout`.
- Pass polish-reviewer na 22 stronach — focus states, kontrast WCAG, mobile breakpointy.
- Globalny player audio — trwały mini-player, kolejka, resume, sleep timer, ulubione (localStorage).
- Performance — code-splitting per trasa (React.lazy + Suspense shimmer); główny chunk 724→398 KB.
- ElevenLabs — pre-generacja narracji (skrypt + role/dialog), 7 odcinków, ep-12 wielogłosowy.
