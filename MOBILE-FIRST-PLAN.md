# Plan: refactor mobile-first + rename route'ów EN

> Branch roboczy: `mobile-first` → PR do `main` po ukończeniu.
> Commity: **każda zakładka osobno**, autor: użytkownik, **bez** `Co-Authored-By`.
> Po każdej zakładce: test na **3 breakpointach** (375 telefon / 768 tablet / 1440 desktop).

## Postęp

- [x] **Faza 0** — Fundament: rename route'ów EN + redirecty 301 + routing/SSG _(commit `e7a435f`)_
- [x] **Faza 1** — Auth + proste statyczne (6/6 zakładek)
- [x] **Faza 2** — Konto + email + onboarding (6/6)
- [x] **Faza 3** — Listy i treść (6/6)
- [ ] **Faza 4** — Core audio / złożone (0/4)
- [ ] **PR** `mobile-first` → `main`

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

## Mapa rename route'ów (PL → EN) — ✅ ZATWIERDZONE (route + pliki + komponenty)

| # | Route PL | Route EN | Plik PL | Plik EN | Status |
|---|----------|----------|---------|---------|--------|
| 1 | `/` | `/` | Home.jsx | Home.jsx | bez zmian |
| 2 | `/zaloguj` | `/login` | Login.jsx | Login.jsx | [x] |
| 3 | `/rejestracja` | `/register` | Register.jsx | Register.jsx | [x] |
| 4 | `/archiwum` | `/archive` | Archive.jsx | Archive.jsx | [x] |
| 5 | `/klub` | `/club` | Club.jsx | Club.jsx | [x] |
| 6 | `/odcinek/:id` | `/episode/:id` | Episode.jsx | Episode.jsx | [x] |
| 7 | `/aplikacja` | `/app` | Aplikacja.jsx | App.jsx | [x] |
| 8 | `/forum` | `/forum` | Forum.jsx | Forum.jsx | bez zmian |
| 9 | `/kariera` | `/careers` | Kariera.jsx | Careers.jsx | [x] |
| 10 | `/konto` | `/account` | Konto.jsx | Account.jsx | [x] |
| 11 | `/mailingi` | `/mailings` | Mailingi.jsx | Mailings.jsx | [x] |
| 12 | `/newsletter` | `/newsletter` | Newsletter.jsx | Newsletter.jsx | bez zmian |
| 13 | `/onboarding` | `/onboarding` | Onboarding.jsx | Onboarding.jsx | bez zmian |
| 14 | `/patroni` | `/patrons` | Patroni.jsx | Patrons.jsx | [x] |
| 15 | `/player` | `/player` | Player.jsx | Player.jsx | bez zmian |
| 16 | `/prasa` | `/press` | Prasa.jsx | Press.jsx | [x] |
| 17 | `/prawne` | `/legal` | Prawne.jsx | Legal.jsx | [x] |
| 18 | `/spotkania` | `/events` | Spotkania.jsx | Events.jsx | [x] |
| 19 | `/stany` | `/states` | Stany.jsx | States.jsx | [x] |
| 20 | `/tworcy` | `/creators` | Tworcy.jsx | Creators.jsx | [x] |
| 21 | `/wsparcie` | `/support` | Wsparcie.jsx | Support.jsx | [x] |

> Rename (route + plik + komponent) wykonany w Fazie 0. Redirecty 301 PL→EN działają (SPA Navigate + `vercel.json`).

---

## FAZA 0 — Fundament (sekwencyjnie, JA, bez równoległości) ✅

Przekrojowa — dotyka całej nawigacji, więc nie da się jej rozdzielić na agentów.

- [x] **0a. Rename route'ów** w `src/Router.jsx` na EN
- [x] **0b. Redirecty 301** ze starych ścieżek PL (SPA `<Navigate replace>` + `vercel.json` redirects)
- [x] **0c. Rename plików/komponentów** PL→EN + aktualizacja importów w Router
- [x] **0d. Definicje route poza Routerem:** `vite.config.js` (SSG), `scripts/og-routes.mjs`, `public/sitemap.xml`, `robots.txt`, weryfikacja i18n (tylko etykiety — bez ścieżek)
- [x] **0e. Linki wewnętrzne:** `Nav.jsx`, `Footer.jsx`, `CookieConsent.jsx`, linki w stronach → EN
- [x] **0f. Mobile-first warstwy wspólnej:** `Nav`, `Footer`, `CookieConsent` (touch-targety 44px, drawer, FAB) — warstwa mobile-first
- [x] **Test:** 20/20 EN route renderuje, 5/5 redirectów PL→EN, build + lint czyste

---

## FAZA 1 — Auth + proste statyczne (równolegle, 6 zakładek) ✅

Rozłączne pliki, każda = osobny agent + osobny commit.

- [x] `Login` (`/login`) — fluid h1, mobilny padding, flex-wrap remember-row
- [x] `Register` (`/register`) — fluid nagłówki kroków, mobilny padding
- [x] `Legal` (`/legal`, ex-Prawne) — TOC grid na mobile, tabela edge-scroll, taby 44px
- [x] `Support` (`/support`, ex-Wsparcie) — mobilny akordeon FAQ, kontakt stacking
- [x] `Careers` (`/careers`, ex-Kariera) — role blok→grid `lg:`, gridy `sm:`/`lg:`
- [x] `NotFound` (ComingSoon/404) — fluid headline 404, mobilny rytm pionowy

---

## FAZA 2 — Konto + email + onboarding (równolegle, 6) ✅

- [x] `Account` (`/account`, ex-Konto) — SettingRow segmenty wrap, fluid h2, mobilny padding
- [x] `Newsletter` (`/newsletter`) — fluid h1, lead full-width, mobilny spacing
- [x] `Mailings` (`/mailings`, ex-Mailingi) — px-5 sm:px-9 body, subject 22→28, MailCta full-width
- [x] `Onboarding` (`/onboarding`) — fluid text kroków, audio answers grid-cols-1
- [x] `Patrons` (`/patrons`, ex-Patroni) — tiery 1→sm:2→lg:3, wall 1→sm:3→lg:6
- [x] `Press` (`/press`, ex-Prasa) — gridy sm:2-col, fluid typo, hero box sm:obok

## FAZA 3 — Listy i treść (równolegle, 6) ✅

- [x] `Archive` (`/archive`) — stats grid 3-col mobile, toolbar 2-row, karty fluid
- [x] `Club` (`/club`) — fluid hero/sekcje, billing toggle full-width, tier price fluid
- [x] `Creators` (`/creators`, ex-Tworcy) — featured 2-col od sm:, taby scroll mobile
- [x] `Events` (`/events`, ex-Spotkania) — wiersze stack+separatory mobile, featured image progresywna
- [x] `States` (`/states`, ex-Stany) — tab switcher min-h-44, panel meta flex-col, OfflineRow 3-col
- [x] `App` (`/app`, ex-Aplikacja) — hero CTA stack, ramki full-width (IosFrame/AndroidFrame już mobile-ready)

## FAZA 4 — Core audio / złożone (równolegle, 4)

- [ ] `Home` (`/`) — + `Hero`, `AudioPlayerSection`, `FeaturedBanner`, `StoriesGrid`, `StoryCard`
- [ ] `Episode` (`/episode/:id`)
- [ ] `Player` (`/player`)
- [ ] `Forum` (`/forum`) — + `ForumCategory`

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

`Faza 0` ✅ → `Faza 1` ✅ → `Faza 2` ✅ → `Faza 3` ✅ → `Faza 4` ⏳ → PR `mobile-first` → `main`.

Łącznie: 21 zakładek + warstwa wspólna, 5 faz. **Postęp: 19/21 zakładek (Faza 0 + 1 + 2 + 3). Zostaje Faza 4 (4 zakładki).**
