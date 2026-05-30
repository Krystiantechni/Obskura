# OBSKURA — Roadmap / Backlog

Living-doc z zadaniami i pomysłami. **Ty wybierasz** co robimy (po ID, np. „zrób T3").
Claude **aktualizuje** ten plik na bieżąco: przenosi do „Zrobione", dopisuje nowe pomysły.

Przy każdym zadaniu jest **„Co to da"** napisane po ludzku — żebyś wiedział, co zmiana
realnie wniesie, zanim ją wybierzesz.

**Status:** ⬜ do zrobienia · 🟡 w toku · ✅ zrobione · 💡 pomysł
**Nakład:** S (szybkie) · M (średnie) · L (duże) — **Wartość:** ⭐–⭐⭐⭐

_Ostatnia aktualizacja: 2026-05-31 (T3, T4 zrobione; performance scroll 60fps, hero ghul, git-crypt, cookie i18n, SEO basics)_

---

## 🔝 Priorytet (rekomendowana kolejność)

### T11 · StoryCard `bg-image` → `<img loading="lazy">` ⭐⭐ · S · 🟡
**Co to da:** karty historii ładują obrazy tła nawet poza ekranem (CSS `background-image` nie
respektuje natywnego lazy-loadingu). Po zmianie obrazy wczytują się dopiero gdy karta zbliża
się do viewportu — mobile Performance z 63 powinien skoczyć do 85+. Wynik Lighthouse desktop:
P 94, A 95, BP 100, SEO 100; mobile: P 63 (to do), A 95, BP 100, SEO 100.
<sub>Tech: zamienić `style={{ backgroundImage }}` na `<img>` z `loading="lazy"` + `decoding="async"`, position absolute z obj-cover.</sub>

### T10 (part 1) · Vitest + RTL setup ⭐⭐ · M · 🟡
**Co to da:** fundament pod testy automatyczne — zanim zaczniemy pisać testy, musi działać
runner. Dodajemy devDeps (vitest, @testing-library/react, jsdom), `vite.config.js` z `test`
blokiem, pierwszy smoke test na `PlayerContext` (czy się montuje, czy `play()` nie crashuje).
Reszta T10 (testy tras, kolejki, sleep timer) — w kolejnych krokach.
<sub>Tech: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom`; `npm run test`.</sub>

### T5 · Pełny odtwarzacz pokazuje prawdziwy postęp nagrania ⭐⭐ · M · ⬜
**Co to da:** strona `/player` (ta duża, immersyjna z transkryptem) działa teraz „na niby" —
oś czasu i przesuwające się napisy są symulowane. Po zmianie będą zgrane z realnym dźwiękiem:
napisy lecą w rytm tego, co faktycznie słychać, suwak działa naprawdę.
<sub>Tech: spiąć transkrypt/rozdziały z `currentTime` z PlayerContext.</sub>

### T6 · „Moja biblioteka" — ulubione w jednym miejscu ⭐⭐ · M · ⬜
**Co to da:** serduszka, które user klika, już są zapamiętywane — ale nie ma ekranu, gdzie by
je zobaczył. Po zmianie w „Koncie" pojawi się lista zapisanych odcinków, gotowa do odtworzenia
jednym kliknięciem. Daje poczucie, że to realna platforma, nie makieta.
<sub>Tech: widok z `favorites` (localStorage) + `getTrack`, spięty z Konto.</sub>

### T7 · Formularze, które naprawdę działają ⭐⭐ · M · ⬜
**Co to da:** zapis do newslettera, rejestracja, kontakt są dziś tylko „na pokaz" — nic się nie
wysyła. Po zmianie dane faktycznie gdzieś trafiają (mail/baza), z walidacją i potwierdzeniem.
Niezbędne, jeśli strona ma kiedyś ruszyć na żywo.
<sub>Tech: funkcje serverless na Vercelu (`api/*`) + walidacja.</sub>

### T8 · Dźwięki tła i muzyka pod narrację ⭐⭐ · M · ⬜
**Co to da:** zamiast samego głosu lektora — pełna atmosfera: cichy ambient w tle, efekty
(mgła, plusk, oddech, infradźwięk) w konkretnych momentach. To właśnie to, co robi „ciarki"
na platformie audio-horror. Generowane i miksowane automatycznie w jeden plik.
<sub>Tech: generator SFX/muzyki (jak narracja) + mix warstw ffmpegiem; wymaga scope'ów na kluczu ElevenLabs.</sub>

### T9 · Strony prawne tłumaczą się na inne języki ⭐⭐ · M · ⬜
**Co to da:** masz 40 języków, ale Regulamin / Stany / Mailingi są zapisane na sztywno po
polsku i nie przełączają się. Obcojęzyczny user widzi tam polski tekst. Po zmianie tłumaczą się
jak reszta strony.
<sub>Tech: wyciągnąć teksty do `public/locales/*/translation.json`.</sub>

### T10 · Zabezpieczenie przed psuciem tego, co działa ⭐⭐ · M · ⬜
**Co to da:** automatyczne testy pilnują, że logika playera (kolejka, wznawianie, sleep timer)
i strony nie popsują się przy kolejnych zmianach. Mniej „działało wczoraj, dziś nie wiadomo
czemu". Spokój przy dalszym rozwoju.
<sub>Tech: Vitest + RTL — najpierw PlayerContext, potem smoke-testy tras.</sub>

---

## 💡 Pomysły / parking (do oceny)

- **Linki social w stopce** prowadzą donikąd (`#`) — podpiąć realne profile przed startem.
- **Drobny błąd na telefonie (375 px):** waveform na stronie `/player` wystaje ~5 px poza ekran.
- **Lepsze polskie głosy narracji** — po wykupieniu planu ElevenLabs wracamy do głosów z Library (mam je zapisane). Teraz głosy darmowe mają lekki angielski akcent.
- **Różne głosy postaci w pełnych odcinkach** — rozbudowa dialogów (mamy już mechanizm).
- **Skrót „przejdź do treści"** dla osób korzystających z klawiatury (dostępność).
- **Cookies / zgoda — następne kroki** (mechanizm `hasConsent(...)` już gotowy):
  - **Analityka** — najlepiej cookieless (Plausible / Umami / Fathom — bez ciasteczek, mniej formalności); ewentualnie GA4 (`_ga`, `_ga_*`). Ładować dopiero po `hasConsent("analytics")`.
  - **Marketing** — tylko jeśli ruszą kampanie: Meta Pixel (`_fbp`, `_fbc`), Google Ads (`_gcl_au`), TikTok (`_ttp`). Za `hasConsent("marketing")`.
  - **Niezbędne** (gdy dojdzie logowanie/backend) — cookie sesji (`httpOnly`, `Secure`, `SameSite`) + token CSRF.
  - **Dopasowanie** — dorzucić zapamiętywanie głośności, prędkości odtwarzania, motywu.
  - **Polityka prywatności** — wpisać realne nazwy używanych cookies, gdy któreś dodamy.
  - **Link „zmień zgodę"** w stopce + **i18n banera** (dziś po polsku).
- **Animowana scena 3D w hero** — efektowne pierwsze 3 sekundy, ale duży nakład i ryzyko spowolnienia.
- **Baner „słuchaj dalej"** na stronie głównej — wraca do miejsca, w którym user przerwał (dane już zapisujemy).
- **Per-trasowe karty OG dla crawlerów** — dziś każdy udostępniony link pokazuje główną kartę OBSKURY (bo crawlery nie wykonują JS, a strona jest SPA). Osobne miniaturki per odcinek wymagałyby prerenderu/SSR (np. vite prerender) — większy nakład.
- **SEO w wielu językach** — tytuły/opisy są po polsku; lokalizacja per język to dodatek.

---

## ✅ Zrobione

- **Naprawiony „holograficzny" nagłówek hero** — czysty czerwony neon zamiast rozmazanej plamy, spokojniejszy glitch.
- **Filmowe przejścia między stronami** — płynne fade zamiast przeskoku.
- **Przegląd jakości 22 stron** — widoczny focus klawiatury, czytelny kontrast, poprawki na telefonie.
- **Globalny odtwarzacz** — pasek na dole grający bez przerwy przy zmianie stron, kolejka, wznawianie po odświeżeniu, sleep timer, ulubione.
- **Przyspieszenie ładowania** — strona wczytuje tylko to, co potrzebne (główna paczka 724→398 KB).
- **Narracja głosowa (ElevenLabs)** — 7 odcinków, finał (ep-12) z kilkoma głosami w dialogu.
- **T1 · Lżejsze obrazy** — PNG→JPEG (q82, max 2400 px): **36 MB → 6 MB** (6× mniej), bez widocznej utraty jakości. Szybsze ładowanie, lepszy Lighthouse.
- **T2 · SEO + podgląd przy udostępnianiu** — statyczne OG/Twitter w index.html + obrazek OG 1200×630 (key-art), per-trasowe tytuły/opisy, nowy favicon (czerwona kropka marki), theme-color.
- **Favicon** — zmieniony z resztki szablonu na markę OBSKURY (czerwona kropka w obrysie).
- **Karta OG z nagłówkiem + CTA** — `npm run og` (sharp) wypala na key-arcie nagłówek „Słuchaj, czego inni nie słyszą" + przycisk „Słuchaj teraz"; dłuższy tytuł (58) i opis (160) pod zalecenia walidatorów.
- **Obrazy → WebP** — `npm run images:webp` (sharp). Po JPEG (6 MB) WebP zbił do **1.4 MB** — łącznie od oryginału **36 MB → 1.4 MB** (25×).
- **Cookie consent** — baner zgody w schemacie collapsed→szczegóły z 4 kategoriami (Niezbędne / Dopasowanie / Analiza / Reklamy), „Akceptuj/Odrzuć/Zapisz preferencje", pływająca ikona do zmiany zgody. Zapis preferencji (ulubione/resume/wariant hero) gated na zgodę; analityka/marketing przez `hasConsent()`.
- **T3 · ErrorBoundary wokół lazy-tras** — łapie `ChunkLoadError` (stary tab + nowy deploy) i zwykłe render errors. Zamiast białej strony pokazuje „Nowa wersja dostępna — odśwież stronę" z przyciskiem reloadu. `src/components/ui/ErrorBoundary.jsx` + zawijka w `Layout`.
- **T4 · Player nie zasłania stopki** — spacer 78 px (mobile) / 88 px (desktop) pod Footerem, gdy ścieżka aktywna. Już nic nie jest przykryte paskiem gracza.
- **Performance scroll 60 fps** — `content-visibility: auto` na sekcjach poza hero, Lenis wyłączony na mobile (≤1023 px, native scroll), `preload="none"` na 6 lazy wideo, `contain: layout style paint` na StoryCard, mocniejszy color grading hero. Realnie: scroll FPS 30 → 60 (vsync floor), max stall 965 ms → 17.7 ms, mobile dostaje `monster.webp` zamiast wideo.
- **Hero ghul + cinematic polish** — nowe wideo `hero-ghul.mp4` (2560×1440 lanczos, crf 26, 6.1 MB, 0.7× playbackRate, loop), mocniejszy color grading (contrast 1.2, saturate 0.65, brightness 0.82, hue-rotate −8 deg, blur 0.3 px), wzmocniony vignette, ken-burns slow zoom (14 s alternate), pulsujący red glow (4.5 s), `monster.webp` fallback na mobile.
- **Git-crypt** — szyfrowanie `scripts/narration/episodes.mjs` (autorskie IP), klucze w `.git-crypt-key` (gitignored) + backup `~/Desktop/obskura-media/`. Historia przepisana przez `git-filter-repo` + force-push (orphan commits ~90 dni do GC). Dokumentacja w `CLAUDE.md`.
- **Cookie banner i18n** — 16 kluczy `cookie.*` w PL master (`public/locales/pl/translation.json`), `CookieConsent.jsx` przeszedł na `t(klucz, polski default)`. Pozostałe 38 języków dostają PL fallback (do batch translation translator agentem).
- **SEO basics** — `public/robots.txt` (z blokadą AI scraperów: GPTBot, ClaudeBot, CCBot, PerplexityBot, Google-Extended) + `public/sitemap.xml` (17 ścieżek). Lighthouse SEO 91 → 100.
- **Lighthouse desktop** — Performance 94, Accessibility 95, Best Practices 100, SEO 100. Mobile: P 63 (do naprawy w T11), A 95, BP 100, SEO 100.
- **TweaksPanel removed** — usunięty wraz z localStorage hero variant switcher. Decyzja: hero zawsze wide z monsterem na mobile.
