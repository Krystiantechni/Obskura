# Faza B8b — Catalog read z `/api/v1/catalog/*` — Design Spec

> Status: **zatwierdzony do planu** (brainstorming → writing-plans).
> Data: 2026-06-02. Druga podfaza **B8 — Integracja frontu** (po B8a auth). Spina trzy zahardkodowane źródła danych frontu z katalogiem Django (read-only).
> Poprzednik: B8a (apiClient + Knox + AuthContext) — `docs/superpowers/specs/2026-06-02-frontend-b8a-integration-auth-design.md`.

---

## 1. Cel

Zastąpić **trzy zahardkodowane źródła danych** frontu danymi z katalogu Django (`/api/v1/catalog/*`, read-only, zseedowane w B2):
- `src/data/tracks.js` (7 tracków — player queue, StoryCard, Hero, AudioPlayerSection, Account),
- tablica `STORIES` w `src/pages/Archive.jsx` (16 — grid + filtr gatunku),
- tablica creators w `src/pages/Creators.jsx`.

Po B8b grid archiwum, Home, Creators, strona Episode i kolejka playera czerpią z API. Audio gra z `audio_url` (= lokalna ścieżka `/audio/ep-N.mp3` z seeda; R2 niepotrzebne). Premium-gating (ep-12) działa realnie na poziomie `audio_url=null` dla niezalogowanego — pełne UI subskrypcji to B8d.

## 2. Decyzje (rozstrzygnięte z userem)

1. **Pełny catalog read** — Archive grid + Home/StoriesGrid + Creators + strona Episode (chapters/transcript) + kolejka playera. Usuwamy `tracks.js`, `STORIES`, creators array.
2. **TanStack Query** (`@tanstack/react-query`) — wspólny cache, dedup, loading/error/stale-while-revalidate, `useInfiniteQuery` dla cursor-pagination. `QueryClientProvider` w `App.jsx`. Ustawia wzorzec dla B8d/B8e.
3. **`slug` jako identyfikator** — trasy `/episode/:slug`, linki i kolejka playera kluczowane slugiem (natywne dla API `lookup_field="slug"`, SEO-friendly). Strona nie jest live → złamanie starych `/episode/12` OK.
4. **Kolejka = summary + dociąganie detalu** — queue trzyma summary z listy; gdy track jest `current`, detal (`audio_url`/`chapters`/`transcript`) dociągany przez `useEpisode(slug)`.
5. **Hero = najnowszy odcinek** z listy (ordering `-published_at` w API), zamiast zahardkodowanego ep-12.
6. **Refactor PlayerContext w tym kroku** (usunięcie `getTrack`/`tracks.js`); persystencja localStorage zostaje (klucz=slug). Sync do API → B8c.

### Świadomie poza zakresem B8b (deferred)
- Sync ulubionych/kolejki/postępu do API + merge przy logowaniu → **B8c**.
- UI gatingu premium / subskrypcja / quota free → **B8d**.
- Migracja audio do R2 (teraz `audio_url` = lokalna ścieżka).
- Prawdziwy postęp/scrubbing/zsynchronizowany transkrypt w pełnym `/player` → ROADMAP **T5**.
- SSR/prerender per-odcinek OG (crawlery) — osobny pomysł w ROADMAP.
- Przepięcie `api/contact`/`api/newsletter` (Vercel) → **B8f**.

---

## 3. Kontrakt API (istnieje — B2)

```
GET /api/v1/catalog/episodes?genre=<slug>&season=<n>&kind=&premium=&search=&ordering=
    → cursor-paginated. EpisodeListSerializer:
      { slug, number, season(int), title, title_em, genre(slug), duration_s, poster,
        video_preview, rating_avg, plays_count, is_true_horror, kind, premium, published_at }
GET /api/v1/catalog/episodes/{slug}   (OptionalTokenAuth — public; premium audio gdy authed+uprawniony)
    → EpisodeDetailSerializer: + season(obj), genre(obj), creators[], audio_url (null gdy brak dostępu),
      chapters[{n,key,title,time_str,sec}], transcript[{key,order,sec,speaker,marker,text}]
GET /api/v1/catalog/seasons   → [{number,title,slug,cover,published_at}]   (bez paginacji, cached)
GET /api/v1/catalog/genres    → [{name,slug,accent}]                       (bez paginacji, cached)
GET /api/v1/catalog/creators  → [{name,slug,role,bio,avatar}]              (paginowane)
```
Filtry: `genre`(slug), `season`(number), `kind`, `is_true_horror`, `premium`. Ordering: `published_at|rating_avg|plays_count|number`. Search: `title,title_em`.

## 4. Architektura

### 4.1 Warstwa danych (nowe pliki)
- **`src/lib/catalogApi.js`** — funkcje nad `request()` (B8a), wszystkie `{auth:false}` (request i tak dokleja token gdy jest → premium audio dla zalogowanych): `fetchEpisodes(params)`, `fetchEpisode(slug)`, `fetchSeasons()`, `fetchGenres()`, `fetchCreators()`.
- **`src/lib/catalogMap.js`** — jedyne źródło prawdy mapowania. `toTrack(apiEpisode)`:
  - `id = slug`, plus `slug`, `title`, `em = title_em`, `cover = poster`, `src = audio_url`, `premium`, `number`, `season`, `genre`, `duration_s`, `rating_avg`, `plays_count`, `video_preview`.
  - `toTrack` zachowuje **strukturalne** pola (`genre` slug, `duration_s`, `season`, `number`) — NIE wstrzykuje gotowego stringa `meta` (lista API zwraca `genre` jako slug, nie nazwę).
  - Pomocniki kompozycji (osobno, bo zależą od mapy slug→nazwa gatunku): `composeCardMeta(track, genreLabels)` → `"${genreLabels[track.genre] ?? track.genre} · ${fmtDuration(duration_s)}"`; `composeEpisodeMeta(track)` → `"S${season:02} · E${number:02}"` (Hero/featured). `genreLabels` to mapa z `useGenres()` (slug→name); konsumenci listy (Archive/Home/StoryCard) i tak ją mają.
  - detal: `chapters = chapters.map(c => ({ n:c.n, key:c.key, t:c.title, time:c.time_str, sec:c.sec }))`, `transcript = transcript` (kształt zgodny: `{key,sec?,speaker?,marker?,text}`; `order` ignorowane na froncie, lista już posortowana przez API).
  - `fmtDuration(s)` → `M:SS`/`H:MM:SS`. Defensywnie: brak `audio_url`→`src:null`; brak `chapters`/`transcript`→`[]`.
- **`src/hooks/useCatalog.js`** — hooki Query (zwracają już zmapowane dane):
  - `useEpisodes(filters)` → `useInfiniteQuery` (klucz `["episodes", filters]`, `getNextPageParam` z `next` cursora), spłaszcza strony do `toTrack[]`.
  - `useEpisode(slug)` → `useQuery(["episode", slug])` → `toTrack(detail)` (z chapters/transcript/src).
  - `useSeasons()` / `useGenres()` / `useCreators()` → `useQuery` (cache długi).
  - Re-export `useEpisode` itp. z `src/hooks/index.js` (barrel).

### 4.2 QueryClient
- `src/lib/queryClient.js` — `new QueryClient({ defaultOptions:{ queries:{ staleTime: 5*60_000, gcTime: 10*60_000, retry: 1, refetchOnWindowFocus: false }}})`.
- `App.jsx`: `<QueryClientProvider>` opakowuje drzewo (nad `AuthProvider`/`PlayerProvider`).

### 4.3 Player / kolejka (refactor PlayerContext)
- Queue items = **summary** (`toTrack` z listy: slug,title,em,cover,meta,premium,duration_s; `src`/`chapters`/`transcript` puste/null).
- Gdy `currentId` (slug) ustawiony, komponent player (`Player.jsx` + globalny pasek/`AudioPlayerSection`) woła `useEpisode(currentSlug)` → dostaje `src` (audio_url), `chapters`, `transcript`. `<audio src>` ustawiane z detalu.
- **`audio_url === null`** (premium/gated) → player pokazuje stan „premium — zaloguj się / dołącz do Klubu" (placeholder, bez `play()`), nie crashuje. Hook gatingu UI = B8d; tu tylko graceful brak src.
- `getTrack(id)` usunięte. `playQueue(list, slug)` przyjmuje listę summary (np. z `useEpisodes`). `HERO_TRACK` zastąpione: Hero/AudioPlayerSection biorą `useEpisodes({})` → pierwszy element (najnowszy).
- localStorage (`obskura_favorites`, `obskura_player_state`) — bez zmian strukturalnych poza tym, że id = slug. Stare numeryczne id osierocone (pre-launch, OK). Sync do API = B8c.

### 4.4 Konsumenci (refactor, bez zmiany wyglądu)
| Plik | Zmiana |
|---|---|
| `src/pages/Archive.jsx` | `STORIES` → `useEpisodes({genre})`; filtr gatunku z `useGenres()`; „pokaż więcej" → `fetchNextPage`; liczniki z danych API |
| `src/components/sections/StoriesGrid.jsx` + `Home.jsx` | featured/lista z `useEpisodes` |
| `src/components/sections/Hero.jsx` + `AudioPlayerSection.jsx` | hero = `useEpisodes` [0] (najnowszy) |
| `src/components/ui/StoryCard.jsx` | props z zmapowanego episode; link `/episode/${slug}`; `playQueue(episodes, slug)` |
| `src/pages/Episode.jsx` | `useEpisode(slug)` (param trasy) |
| `src/pages/Creators.jsx` | `useCreators()` |
| `src/pages/Account.jsx` | ulubione: slug[] → mapowanie z cache/`useEpisodes` |
| `src/pages/Player.jsx` | dane z `current` + `useEpisode`; usunięcie zahardkodowanych fallbacków tytułu ep-12 |
| `src/Router.jsx` | `episode/:id`→`episode/:slug`; `odcinek/:id` redirect → `/archive` |

### 4.5 Loading / error
- Skeleton-shimmer spójny z lazy-route loaderem w `Layout` (karty: pulsujące bloki w siatce; detal: szkielet nagłówka+listy). Komponent `src/components/ui/CardSkeleton.jsx` (lekki).
- Błąd (`ApiError`/sieć) → cichy inline komunikat PL + przycisk „Spróbuj ponownie" (TanStack `refetch`). Nigdy biała strona.
- Pusty wynik filtra → istniejący stan „brak wyników" w Archive.

## 5. Usuwane pliki / kod
- `src/data/tracks.js` (cały) — po przepięciu wszystkich konsumentów.
- Tablica `STORIES` w `Archive.jsx`, tablica creators w `Creators.jsx` (zastąpione hookami).

## 6. Testy (Vitest + RTL)
- **`catalogMap`**: `toTrack` happy (pełny episode), edge (brak `audio_url`→src null, brak chapters/transcript→[]); `composeCardMeta` (z mapą gatunków i bez — fallback do slug), `composeEpisodeMeta` (`S03 · E12`), `fmtDuration` (M:SS i H:MM:SS).
- **`useCatalog`**: `useEpisode`/`useEpisodes` z mockowanym `request` + `QueryClientProvider` wrapper (test util `renderWithQuery`) — sukces zwraca zmapowane dane; `useInfiniteQuery` spłaszcza 2 strony.
- **`Archive`** smoke: loading → skeleton, data → karty, filtr gatunku zmienia query, error → komunikat+retry (hooki mockowane).
- **`Episode`** smoke: `useEpisode` data → tytuł/rozdziały; premium bez audio → stan zablokowany.
- **`StoryCard`** smoke: link `/episode/{slug}`, klik play woła `playQueue`.
- Brak regresji w 65 istniejących testach (auth/consent/analytics/player).

## 7. Zależności
- `@tanstack/react-query` (+ opcjonalnie devtools w dev). `package.json` += dependency; brak innych.

## 8. Weryfikacja ukończenia
- `npm run build` + `npm run lint` (0) + `npm run test:run` (zielone, nowe + 65 istniejących).
- Backend up (B8a docker), `curl /api/v1/catalog/episodes` zwraca dane.
- Ręcznie/Puppeteer: Archive ładuje z API + filtr gatunku działa; Home/Hero pokazują najnowszy; `/episode/{slug}` renderuje detal; klik play kolejkuje i gra free odcinek (audio_url lokalny); ep-12 (premium) → stan zablokowany bez crasha; Creators z API. `tracks.js` usunięty (brak martwych importów).
- post-change-audit (1440/768/375) na Archive / Episode / Home.
