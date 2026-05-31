# Plan: refactor mobile-first + rename route'ów EN

> Branch roboczy: `mobile-first` → PR do `main` po ukończeniu.
> Commity: **każda zakładka osobno**, autor: użytkownik, **bez** `Co-Authored-By`.
> Po każdej zakładce: test na **3 breakpointach** (375 telefon / 768 tablet / 1440 desktop).

## Cel i zasady

1. **Mobile-first jako metoda** — klasy bazowe (bez prefiksu) = stan mobilny; desktop dobudowywany przez `sm:`/`lg:`. Odwrotnie niż obecny desktop-down.
2. **Desktop nie może się zepsuć** — refactor zachowuje obecny wygląd na 1440px (regresja wizualna = 0). Mobile-first to zmiana *kolejności klas*, nie *wyglądu desktopu*.
3. **Jedna baza kodu** — żadnej osobnej aplikacji mobilnej.
4. **Rename route'ów na angielski** — przekrojowo, w jednej fazie (Faza 0), z redirectami 301 ze starych ścieżek (brak 404, zachowane SEO).
5. **Równoległość** — w fazach 1-4 zakładki mają **rozłączne pliki**, więc kilku agentów pracuje jednocześnie bez kolizji. Strony zależne od własnych sekcji (Home, Forum, App) idą jako jeden agent ze swoimi sekcjami.

## Definicja „mobile-first done" (checklist per zakładka)

- [ ] Klasy bazowe mobilne, desktop w `sm:`/`lg:` (nie odwrotnie)
- [ ] 1 kolumna na 375px; siatki/tabele rozwijają się dopiero `sm:`/`lg:`
- [ ] Touch-targety akcji ≥ 44×44px
- [ ] Zero poziomego scrolla na 375 i 768
- [ ] Fluid typografia (`clamp`/breakpointy) — nic uciętego ani za małego
- [ ] Obrazy/media skalują się (`max-w-full`, aspekty responsywne)
- [ ] **Desktop 1440px wygląda jak przed refaktorem** (porównanie before/after)
- [ ] `npm run build` + `npm run lint` czyste
- [ ] Screenshoty 375/768/1440 zaakceptowane

Test zakładki: `ROUTES="/<route>" node scripts/mobile-audit-shots.mjs` → zrzuty + metryki dla 3 breakpointów.

---

## Mapa rename route'ów (PL → EN) — DO ZATWIERDZENIA

| # | Route PL | Route EN | Plik PL | Plik EN | Uwaga |
|---|----------|----------|---------|---------|-------|
| 1 | `/` | `/` | Home.jsx | Home.jsx | bez zmian |
| 2 | `/zaloguj` | `/login` | Login.jsx | Login.jsx | plik już EN |
| 3 | `/rejestracja` | `/register` | Register.jsx | Register.jsx | plik już EN |
| 4 | `/archiwum` | `/archive` | Archive.jsx | Archive.jsx | plik już EN |
| 5 | `/klub` | `/club` | Club.jsx | Club.jsx | plik już EN |
| 6 | `/odcinek/:id` | `/episode/:id` | Episode.jsx | Episode.jsx | plik już EN |
| 7 | `/aplikacja` | `/app` | Aplikacja.jsx | App.jsx | + IosFrame/AndroidFrame |
| 8 | `/forum` | `/forum` | Forum.jsx | Forum.jsx | bez zmian |
| 9 | `/kariera` | `/careers` | Kariera.jsx | Careers.jsx | |
| 10 | `/konto` | `/account` | Konto.jsx | Account.jsx | |
| 11 | `/mailingi` | `/mailings` | Mailingi.jsx | Mailings.jsx | |
| 12 | `/newsletter` | `/newsletter` | Newsletter.jsx | Newsletter.jsx | bez zmian |
| 13 | `/onboarding` | `/onboarding` | Onboarding.jsx | Onboarding.jsx | bez zmian |
| 14 | `/patroni` | `/patrons` | Patroni.jsx | Patrons.jsx | |
| 15 | `/player` | `/player` | Player.jsx | Player.jsx | bez zmian |
| 16 | `/prasa` | `/press` | Prasa.jsx | Press.jsx | |
| 17 | `/prawne` | `/legal` | Prawne.jsx | Legal.jsx | |
| 18 | `/spotkania` | `/events` | Spotkania.jsx | Events.jsx | |
| 19 | `/stany` | `/states` | Stany.jsx | States.jsx | strona „stany UI" (loading/error/empty) |
| 20 | `/tworcy` | `/creators` | Tworcy.jsx | Creators.jsx | |
| 21 | `/wsparcie` | `/support` | Wsparcie.jsx | Support.jsx | |

> **Decyzje do potwierdzenia:** (a) czy zmieniamy też nazwy **plików/komponentów** (kolumna „Plik EN"), czy tylko route'y? (b) `/stany` → `/states` czy `/ui-states`? (c) `/mailingi` → `/mailings` czy `/campaigns`? (d) `/aplikacja` → `/app` czy `/get-app`?

---

## FAZA 0 — Fundament (sekwencyjnie, JA, bez równoległości)

Przekrojowa — dotyka całej nawigacji, więc nie da się jej rozdzielić na agentów.

**0a. Rename route'ów** w `src/Router.jsx` na EN.
**0b. Redirecty 301** ze starych ścieżek PL:
- SPA: trasy `<Navigate to="/<en>" replace />` dla każdej starej PL ścieżki (UX + zakładki użytkowników).
- Server: `vercel.json` `redirects` (301, SEO) PL → EN.
**0c. Rename plików/komponentów** PL → EN (jeśli zatwierdzone) + aktualizacja importów w Router.
**0d. Aktualizacja wszystkich definicji route poza Routerem:**
- `vite.config.js` — lista route'ów SSG/prerender
- `scripts/og-routes.mjs` — generowanie OG per route
- `public/sitemap.xml` — adresy EN
- `public/robots.txt` (jeśli wymienia ścieżki)
- weryfikacja `public/locales/*/translation.json` (39 jęz.) — czy trzymają ścieżki (raczej tylko etykiety; potwierdzić)
**0e. Aktualizacja linków wewnętrznych:** `Nav.jsx` (LINKS), `Footer.jsx` (cols), `CookieConsent.jsx` (`/prawne`→`/legal`), oraz linki w stronach (`to="/..."`).
**0f. Mobile-first przegląd warstwy wspólnej:** `Nav`, `Footer`, `Layout`, `MiniPlayer`, `CookieConsent` + drobne `ui/` (`Eyebrow`, `HorrorButton`, `Icons`, `WaveformBar`, `FloatingMetaCard`, `FavoriteRow`).

**Test Fazy 0:** przeklikać całą nawigację (każdy link prowadzi do EN, stare PL robią 301), `build` + `lint`, smoke 375/768/1440.
**Commit:** `mobile-first(0): rename route'ów EN + redirecty 301 + warstwa wspólna`

---

## FAZA 1 — Auth + proste statyczne (równolegle, 6 zakładek)

`Login` · `Register` · `Legal` (Prawne) · `Support` (Wsparcie) · `Careers` (Kariera) · `NotFound` (ComingSoon/404)

Rozłączne pliki, każda = osobny agent. Proste formularze/treść — szybki cykl, walidacja wzorca.

## FAZA 2 — Konto + email + onboarding (równolegle, 6)

`Account` (Konto) · `Newsletter` · `Mailings` (Mailingi) · `Onboarding` · `Patrons` (Patroni) · `Press` (Prasa)

## FAZA 3 — Listy i treść (równolegle, 6)

`Archive` · `Club` · `Creators` (Tworcy) · `Events` (Spotkania) · `States` (Stany) · `App` (Aplikacja + `IosFrame` + `AndroidFrame`)

## FAZA 4 — Core audio / złożone (równolegle, 4)

`Home` (+ `Hero`, `AudioPlayerSection`, `FeaturedBanner`, `StoriesGrid`, `StoryCard`) · `Episode` · `Player` · `Forum` (+ `ForumCategory`)

> Najcięższe i z własnymi sekcjami — każdy agent bierze stronę razem z jej sekcjami (zero współdzielenia plików między tymi zakładkami).

---

## Workflow per zakładka (w fazach 1-4)

1. **Agent refaktoruje** zakładkę mobile-first (1 zakładka = 1 agent, rozłączne pliki).
2. **Test 3 breakpointów:** `ROUTES="/<route>" node scripts/mobile-audit-shots.mjs` → ocena zrzutów 375/768/1440 + metryki (overflow, touch). Desktop porównany before/after.
3. **Build + lint** (globalnie po zebraniu fazy).
4. **JA weryfikuję** wynik (anty-halucynacja + regresja desktopu) i **commituję każdą zakładkę osobno**: `mobile-first: <Zakładka>` — autor użytkownik, bez `Co-Authored-By`.

Po każdej fazie: zbiorczy build/lint + przegląd, potem przejście do kolejnej.

---

## Kolejność realizacji

`Faza 0` → `Faza 1` → `Faza 2` → `Faza 3` → `Faza 4` → PR `mobile-first` → `main`.

Łącznie: 21 zakładek + warstwa wspólna, 5 faz, ~22 commity (1 na zakładkę + faza 0).
