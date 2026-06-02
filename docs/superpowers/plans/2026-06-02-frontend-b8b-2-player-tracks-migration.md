# B8b-2 — Player + tracks.js → catalog API — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Przepiąć player i wszystkich konsumentów `src/data/tracks.js` na katalog API (hooki z B8b-1): kolejka trzyma summary, detal (audio_url/chapters/transcript) dociągany przez `useEpisode(slug)`; usunąć `tracks.js`.

**Architecture:** `PlayerContext` woła `useEpisode(currentId=slug)` i eksponuje `current = {...summary, ...detail}`; `<audio>` ładuje `current.src` (z detalu; `null`→premium-blocked, brak crasha). Konsumenci (Hero, AudioPlayerSection, StoryCard/StoriesGrid, Account) biorą summary z `useEpisodes()`. Trasy `/episode/:slug`.

**Tech Stack:** React 19.2, react-router-dom v7, TanStack Query v5 (z B8b-1: `useEpisodes`/`useEpisode`, `toTrack`, `composeCardMeta`/`composeEpisodeMeta`), Vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-06-02-frontend-b8b-catalog-design.md` §4.3 (player/queue), §4.4 (konsumenci: Hero/AudioPlayerSection/StoryCard/StoriesGrid/Account/Player), §4.5 (loading), §5 (usuwanie tracks.js).

**Zależność:** B8b-1 zmergowane (catalogApi/catalogMap/useCatalog/QueryClient). **Poza zakresem (→ B8b-3):** Archive (STORIES→API), Creators (array→API), Episode detail page (pełne wiązanie `useEpisode`). Sync favorites/queue/progress do API → B8c.

---

## File Structure

**Modyfikowane:**
- `src/context/PlayerContext.jsx` — kolejka=summary; `useEpisode(currentId)` → `current` wzbogacone o detal; audio src keyed on `current?.src`.
- `src/context/__tests__/PlayerContext.test.jsx` — mock `useEpisode` (zwraca `{episode:null}` → current=summary; istniejące asercje bez zmian).
- `src/components/sections/Hero.jsx` — `HERO_TRACK` → `useEpisodes()[0]` (hero=najnowszy).
- `src/components/sections/AudioPlayerSection.jsx` — `HERO_TRACK` → najnowszy; `track.meta` → `composeCardMeta`.
- `src/components/ui/StoryCard.jsx` — props z episode; `playQueue(episodes, slug)`; link `/episode/${slug}`.
- `src/components/sections/StoriesGrid.jsx` — lista z `useEpisodes()` + `useGenres()`; render `StoryCard` z episode + queue.
- `src/pages/Account.jsx` — favs: slug→track z `useEpisodes()`; `TRACKS.length` → liczba z API.
- `src/pages/Player.jsx` — tytuł/em z `current` (zamiast zahardkodowanego ep-12 fallbacku).
- `src/Router.jsx` — `episode/:id` → `episode/:slug`; `odcinek/:id` redirect → `/archive`.
- `src/pages/Episode.jsx` — `useParams().slug` zamiast `.id` (minimalnie; pełne wiązanie danych = B8b-3).

**Usuwane:** `src/data/tracks.js` (Task 7, gdy zero importerów).

---

## Task 1: PlayerContext — kolejka=summary + detal z useEpisode

**Files:**
- Modify: `src/context/PlayerContext.jsx`
- Modify: `src/context/__tests__/PlayerContext.test.jsx`

- [ ] **Step 1: Zaktualizuj test — dodaj mock `useEpisode` (na górze pliku, po importach)**

W `src/context/__tests__/PlayerContext.test.jsx` dodaj zaraz po linii `import { PlayerProvider, usePlayer } from '../PlayerContext';`:

```jsx
// PlayerProvider woła useEpisode(currentId) po detal. W testach mockujemy go →
// brak detalu (episode:null), więc current = summary z kolejki (mają własne `src`).
// Dzięki temu nie potrzeba QueryClientProvider ani sieci.
vi.mock('../../hooks/useCatalog.js', () => ({ useEpisode: () => ({ episode: null }) }));
```

- [ ] **Step 2: Run test to verify it still passes (przed implementacją — mock importu jeszcze nieużywanego modułu)**

Run: `npm run test:run -- src/context/__tests__/PlayerContext.test.jsx`
Expected: PASS (8 tests) — mock nieaktywny dopóki PlayerContext nie importuje useEpisode; vitest toleruje mock niezaimportowanego-jeszcze modułu (hook factory uruchomi się dopiero gdy provider zaimportuje).

- [ ] **Step 3: Refactor `src/context/PlayerContext.jsx`**

Dodaj import (po `import { hasConsent } from "../lib/consent";`):
```jsx
import { useEpisode } from "../hooks/useCatalog.js";
```

Zamień blok wyliczania `current`/`currentIndex` (obecnie linie ~55–62):
```jsx
  const current = useMemo(
    () => queue.find((t) => t.id === currentId) || null,
    [queue, currentId],
  );
  const currentIndex = useMemo(
    () => queue.findIndex((t) => t.id === currentId),
    [queue, currentId],
  );
```
na:
```jsx
  // Kolejka trzyma summary (z listy katalogu). Detal (audio_url/chapters/transcript)
  // dociągamy przez useEpisode(slug); `current` = summary wzbogacone o detal.
  const summary = useMemo(
    () => queue.find((t) => t.id === currentId) || null,
    [queue, currentId],
  );
  const { episode: detail } = useEpisode(currentId);
  const current = useMemo(
    () => (summary ? { ...summary, ...(detail || {}) } : null),
    [summary, detail],
  );
  const currentIndex = useMemo(
    () => queue.findIndex((t) => t.id === currentId),
    [queue, currentId],
  );
```

Zamień efekt ładujący źródło (obecnie linie ~71–80, keyed on `current?.id`):
```jsx
  // Załaduj nowe źródło gdy zmienia się ścieżka.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.src;
    audio.load();
    if (!pendingResume.current) setCurrentTime(0);
    if (playing) audio.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);
```
na (keyed on `current?.src` — detal dociąga `src` async, slug się nie zmienia):
```jsx
  // Załaduj źródło gdy zmienia się audio_url. Detal dociąga się async, więc
  // kluczujemy efekt na `current?.src` (slug/id jest stały podczas dociągania).
  // src === null/undefined (premium-gated lub jeszcze ładowane) → nie ładujemy.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.src) return;
    audio.src = current.src;
    audio.load();
    if (!pendingResume.current) setCurrentTime(0);
    if (playing) audio.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.src]);
```

Dodaj do eksponowanego `value` (w obiekcie `useMemo`, obok `current`) flagę premium-blocked — wstaw po linii `current,`:
```jsx
      premiumLocked: !!(current && current.premium && !current.src),
```
i dodaj `current` do tablicy zależności tego `useMemo` jest już obecne (current jest w deps). Pozostaw resztę value bez zmian.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/context/__tests__/PlayerContext.test.jsx`
Expected: PASS (8 tests). `current` = summary (detail mock = null), `current.id`/`current.src` z summary jak dotąd.

- [ ] **Step 5: Verify build + lint**

Run: `npm run build && npm run lint`
Expected: build OK, lint 0. (PlayerProvider jest wewnątrz QueryClientProvider w App — useEpisode/useQuery ma kontekst w realnej apce.)

- [ ] **Step 6: Commit**

```bash
git add src/context/PlayerContext.jsx src/context/__tests__/PlayerContext.test.jsx
git commit -m "feat(player): queue holds summary, fetch episode detail for audio/chapters (B8b-2)"
```

---

## Task 2: Hero → najnowszy odcinek z API

**Files:**
- Modify: `src/components/sections/Hero.jsx`

- [ ] **Step 1: Edytuj importy + źródło hero**

W `src/components/sections/Hero.jsx` zamień:
```jsx
import { usePlayer } from "../../context/PlayerContext";
import { HERO_TRACK } from "../../data/tracks";
```
na:
```jsx
import { usePlayer } from "../../context/PlayerContext";
import { useEpisodes } from "../../hooks/useCatalog";
```

Zamień (obecnie linie ~45–47):
```jsx
  const isHero = current?.id === HERO_TRACK.id;
  const playing = isHero && globalPlaying;
  const onToggle = () => (isHero ? toggle() : playTrack(HERO_TRACK));
```
na:
```jsx
  // Hero = najnowszy odcinek z katalogu (lista jest sortowana -published_at).
  const { episodes } = useEpisodes();
  const heroTrack = episodes[0] || null;
  const isHero = !!heroTrack && current?.id === heroTrack.id;
  const playing = isHero && globalPlaying;
  const onToggle = () => {
    if (!heroTrack) return;
    if (isHero) toggle();
    else playTrack(heroTrack);
  };
```

(Reszta Hero — copy z i18n, wideo, statystyki — bez zmian. Przycisk play działa po doładowaniu listy; przed doładowaniem `heroTrack` null → klik no-op.)

- [ ] **Step 2: Verify build + lint + testy**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone (Hero nie ma testu jednostkowego; brak regresji w istniejących).

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/Hero.jsx
git commit -m "feat(player): Hero plays newest catalog episode instead of hardcoded track (B8b-2)"
```

---

## Task 3: StoryCard + StoriesGrid → episodes z API

**Files:**
- Modify: `src/components/ui/StoryCard.jsx`
- Modify: `src/components/sections/StoriesGrid.jsx`

- [ ] **Step 1: Przepisz `src/components/ui/StoryCard.jsx`**

StoryCard dostaje `episode` (zmapowany track) + `queue` (lista summary tego widoku) + `genreLabels`. Play kolejkuje `queue` od `episode.slug`. Zamień import:
```jsx
import { TRACKS, getTrack } from "../../data/tracks";
```
usuń (StoryCard nie sięga już do tracks.js).

Zamień sygnaturę i logikę play (obecnie linie 9–24) na:
```jsx
export default function StoryCard({ episode, queue = [], genreLabels = {}, video }) {
  const videoRef = useRef(null);
  const { current, playing, playQueue, toggle } = usePlayer();

  const isCurrent = current?.id === episode.id;
  const isPlaying = isCurrent && playing;
  const to = `/episode/${episode.slug}`;
  const tagAccent = GENRE_ACCENT[episode.genre] || "red";
  const title = episode.title;
  const titleEm = episode.em;
  const tag = genreLabels[episode.genre] || episode.genre;
  const duration = composeCardMeta(episode, genreLabels);
  const rating = episode.rating != null ? `★ ${episode.rating.toFixed(1)}` : "";
  const image = episode.cover;

  const onPlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrent) toggle();
    else playQueue(queue.length ? queue : [episode], episode.slug);
  };
```

Dodaj na górze pliku (po importach) mapę akcentów + import helpera/usePlayer:
```jsx
import { usePlayer } from "../../context/PlayerContext";
import { composeCardMeta } from "../../lib/catalogMap";

const GENRE_ACCENT = { psy: "red", true: "red", body: "red", folk: "blue", cosmic: "blue", cyber: "blue", noir: "red", myth: "red" };
```

W JSX: `track &&` warunki przy przyciskach play zamień na bezwarunkowe (episode zawsze jest); `duration`/`rating`/`tag`/`title`/`titleEm`/`image`/`to` używane jak dotąd. Zaktualizuj `tagCls` by używał `tagAccent`. Na końcu zamień `StoryCard.propTypes`:
```jsx
StoryCard.propTypes = {
  episode: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    em: PropTypes.string,
    cover: PropTypes.string,
    genre: PropTypes.string,
    rating: PropTypes.number,
    durationS: PropTypes.number,
  }).isRequired,
  queue: PropTypes.arrayOf(PropTypes.object),
  genreLabels: PropTypes.object,
  video: PropTypes.string,
};
```

(Zachowaj istniejący markup karty: `<img src={image}>`, hover-video `{video && …}`, gradient, `// {num}` → zmień na `episode.number` jako `S..E..` lub usuń numerek; play-button onClick={onPlay}. Wideo na hover zostaje przez prop `video` — opcjonalne, bo API ma `episode.video` (video_preview) — można podać `video={episode.video}` z rodzica.)

- [ ] **Step 2: Przepisz `src/components/sections/StoriesGrid.jsx`**

```jsx
import { useTranslation } from "react-i18next";
import StoryCard from "../ui/StoryCard";
import CardSkeleton from "../ui/CardSkeleton";
import { useEpisodes, useGenres } from "../../hooks/useCatalog";

export default function StoriesGrid() {
  const { t } = useTranslation();
  const { episodes, isLoading } = useEpisodes();
  const { genreLabels } = useGenres();
  // Sekcja na Home pokazuje pierwszych 6 najnowszych.
  const items = episodes.slice(0, 6);

  return (
    <section className="cv-auto mx-auto mt-12 max-w-[1400px] px-5 pb-16 lg:mt-20 lg:pb-32 lg:px-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end lg:mb-12 lg:pb-6">
        <h2 className="font-serif text-[clamp(36px,5vw,52px)] font-medium leading-none tracking-[-0.02em] text-ink-0">
          {t("stories.section_title")} <em className="italic text-ink-2">{t("stories.section_title_em")}</em>
        </h2>
        <div className="text-right font-mono text-[10px] uppercase tracking-mono text-ink-2">
          <div className="inline-flex items-center gap-1.5 text-red">
            <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_6px_#ff2a2a]" />
            {t("stories.live")}
          </div>
          <div className="mt-1">{t("stories.archive")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {isLoading && items.length === 0 ? (
          <CardSkeleton count={6} />
        ) : (
          items.map((ep) => (
            <StoryCard key={ep.slug} episode={ep} queue={items} genreLabels={genreLabels} video={ep.video} />
          ))
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify build + lint + testy**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone. (StoryCard zmiana propsów — jeśli istnieje test StoryCard, dostosuj; sprawdź `src/components/ui/__tests__/`.)

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/StoryCard.jsx src/components/sections/StoriesGrid.jsx
git commit -m "feat(catalog): StoryCard + StoriesGrid render API episodes, play by slug (B8b-2)"
```

---

## Task 4: AudioPlayerSection → najnowszy + meta z helpera

**Files:**
- Modify: `src/components/sections/AudioPlayerSection.jsx`

- [ ] **Step 1: Edytuj importy + fallback track + meta**

Zamień:
```jsx
import { usePlayer } from "../../context/PlayerContext";
import { HERO_TRACK } from "../../data/tracks";
```
na:
```jsx
import { usePlayer } from "../../context/PlayerContext";
import { useEpisodes, useGenres } from "../../hooks/useCatalog";
import { composeCardMeta } from "../../lib/catalogMap";
```

Zamień (obecnie linia ~23):
```jsx
  const track = current ?? HERO_TRACK;
```
na:
```jsx
  const { episodes } = useEpisodes();
  const { genreLabels } = useGenres();
  const track = current ?? episodes[0] ?? null;
```

Owiń wczesnym returnem gdy brak tracka (przed `return (` głównego JSX), żeby uniknąć błędów przy pustej liście:
```jsx
  if (!track) return null;
```

Zamień render meta (obecnie linia ~44 `{track.meta}`):
```jsx
            <div className="text-[11px] text-ink-2">{track.meta}</div>
```
na:
```jsx
            <div className="text-[11px] text-ink-2">{track.meta ?? composeCardMeta(track, genreLabels)}</div>
```

(`track.meta` istnieje tylko dla starych obiektów; dla API summary używamy `composeCardMeta`. Reszta — cover/title/em, kontrolki — bez zmian.)

- [ ] **Step 2: Verify build + lint + testy**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/AudioPlayerSection.jsx
git commit -m "feat(player): AudioPlayerSection uses newest episode + composed meta (B8b-2)"
```

---

## Task 5: Ulubione przez slug→episode (FavoriteRow + Account)

**Files:**
- Modify: `src/components/ui/FavoriteRow.jsx`
- Modify: `src/components/ui/__tests__/FavoriteRow.test.jsx`
- Modify: `src/pages/Account.jsx`

> `FavoriteRow` używał `track.num` (string) + `track.meta` + zahardkodowanego `S03`. Zmapowany track (`toTrack`) ma `number`/`season`/`durationS`, nie `num`/`meta`. Najpierw migrujemy `FavoriteRow` na kształt API, potem Account dostarcza zmapowane tracki.

- [ ] **Step 1: Zaktualizuj test `FavoriteRow.test.jsx` (TRACK shape + meta assertion)**

Zamień stałą `TRACK` (linie 13–20):
```jsx
const TRACK = {
  id: 's03-e12-mgla',
  slug: 's03-e12-mgla',
  number: 12,
  season: 3,
  title: 'Mgła nad',
  em: 'Wisłoujściem',
  durationS: 2832,
  cover: '/images/monster.webp',
};
```
Zamień asercję meta (linia ~49) `expect(screen.getByText(TRACK.meta)).toBeInTheDocument();` na:
```jsx
    expect(screen.getByText('47:12')).toBeInTheDocument(); // fmtDuration(2832)
    expect(screen.getByText(/S03 · E12/)).toBeInTheDocument();
```
(Reszta testów: `playTrack(TRACK)`/`toggleFavorite(TRACK.id)` działają bez zmian — `TRACK.id` to teraz slug.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/ui/__tests__/FavoriteRow.test.jsx`
Expected: FAIL — `'47:12'`/`S03 · E12` nieobecne (FavoriteRow renderuje jeszcze `track.num`/`track.meta` = undefined).

- [ ] **Step 3: Migruj `src/components/ui/FavoriteRow.jsx`**

Dodaj import (po `import { usePlayer }`):
```jsx
import { composeEpisodeMeta, fmtDuration } from "../../lib/catalogMap";
```
Zamień linię numeru odcinka (~26):
```jsx
        <div className="mb-1 font-mono text-[10px] tracking-mono text-red">★ S03 · E{track.num}{isCurrent ? " · TERAZ" : ""}</div>
```
na:
```jsx
        <div className="mb-1 font-mono text-[10px] tracking-mono text-red">★ {composeEpisodeMeta(track)}{isCurrent ? " · TERAZ" : ""}</div>
```
Zamień kolumnę meta (~31):
```jsx
      <div className="hidden font-mono text-[11px] uppercase tracking-ui text-ink-2 lg:block">{track.meta}</div>
```
na:
```jsx
      <div className="hidden font-mono text-[11px] uppercase tracking-ui text-ink-2 lg:block">{fmtDuration(track.durationS)}</div>
```
Zamień PropTypes (~53–58):
```jsx
FavoriteRow.propTypes = {
  track: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    em: PropTypes.string,
    cover: PropTypes.string,
    number: PropTypes.number,
    season: PropTypes.number,
    durationS: PropTypes.number,
  }).isRequired,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/ui/__tests__/FavoriteRow.test.jsx`
Expected: PASS (6 tests).

- [ ] **Step 5: Edytuj importy + rozwiązanie favTracks (Account)**

Zamień:
```jsx
import { usePlayer } from "../context/PlayerContext";
import { getTrack, TRACKS } from "../data/tracks";
```
na:
```jsx
import { usePlayer } from "../context/PlayerContext";
import { useEpisodes } from "../hooks/useCatalog";
```

Zamień (obecnie linie ~133–134):
```jsx
  const { favorites } = usePlayer();
  const favTracks = favorites.map((id) => getTrack(id)).filter(Boolean);
```
na:
```jsx
  const { favorites } = usePlayer();
  const { episodes } = useEpisodes();
  // Mapa slug→episode z katalogu; ulubione (slug[]) rozwiązujemy do tracków.
  const bySlug = Object.fromEntries(episodes.map((e) => [e.slug, e]));
  const favTracks = favorites.map((slug) => bySlug[slug]).filter(Boolean);
  const totalEpisodes = episodes.length;
```

Zamień warunek „dostępne jeszcze" (obecnie linie ~363–367) `favTracks.length < TRACKS.length` → `favTracks.length < totalEpisodes`, a w treści `TRACKS.length - favTracks.length` → `totalEpisodes - favTracks.length`:
```jsx
                  {favTracks.length < totalEpisodes && (
                    <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-mono text-ink-3">
                      {t("konto.favs_more", `Dostępne jeszcze ${totalEpisodes - favTracks.length} odcinków w archiwum`)}
                    </p>
                  )}
```

(`FavoriteRow track={track}` przyjmuje zmapowany episode — ma `id/slug/title/em/cover/number/season/durationS`. Reszta Account — historia/plan/sesje — to mockup i18n, bez zmian.)

- [ ] **Step 6: Verify build + lint + pełne testy**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone (FavoriteRow 6 + reszta).

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/FavoriteRow.jsx src/components/ui/__tests__/FavoriteRow.test.jsx src/pages/Account.jsx
git commit -m "feat(catalog): favorites via catalog episodes — FavoriteRow + Account (B8b-2)"
```

---

## Task 6: Player tytuł z current + routing /episode/:slug

**Files:**
- Modify: `src/pages/Player.jsx`
- Modify: `src/Router.jsx`
- Modify: `src/pages/Episode.jsx`

- [ ] **Step 1: Player tytuł z `current`**

W `src/pages/Player.jsx` znajdź zahardkodowany tytuł (linia ~171):
```jsx
            {t("playerpage.title_p1", "Mgła nad")} <em className="italic text-ink-1">{t("playerpage.title_em", "Wisłoujściem")}</em>
```
zamień na (z bieżącej ścieżki, fallback gdy brak):
```jsx
            {current?.title || t("playerpage.title_p1", "Mgła nad")} {current?.em ? <em className="italic text-ink-1">{current.em}</em> : <em className="italic text-ink-1">{t("playerpage.title_em", "Wisłoujściem")}</em>}
```

(Rozdziały/transkrypt już idą z `current?.chapters`/`current?.transcript` — po Task 1 to detal z API. Symulowany progres/scrubbing zostaje — realny sync to ROADMAP T5.)

- [ ] **Step 2: Routing `/episode/:slug`**

W `src/Router.jsx` zamień trasę:
```jsx
      { path: "episode/:id", element: <Episode /> },
```
na:
```jsx
      { path: "episode/:slug", element: <Episode /> },
```
i legacy PL redirect — zamień `LegacyEpisodeRedirect` użycie (trasa `odcinek/:id`):
```jsx
      { path: "odcinek/:id", element: <LegacyEpisodeRedirect /> },
```
na (stare numeryczne linki pre-launch → archiwum):
```jsx
      { path: "odcinek/:id", element: <Navigate to="/archive" replace /> },
```
oraz USUŃ teraz nieużywaną funkcję `LegacyEpisodeRedirect` (i jej `useParams` import jeśli niepotrzebny gdzie indziej — `useParams` jest tylko w niej; usuń z importu `react-router-dom`, zostawiając `createBrowserRouter, Navigate`).

- [ ] **Step 3: Episode czyta `slug` z params**

W `src/pages/Episode.jsx` zamień:
```jsx
  const { id } = useParams();
```
na:
```jsx
  const { slug } = useParams();
```
i zamień jedyne użycie `id` (linia ~103, `// EPIZOD ${id}`):
```jsx
              { lab: `// EPIZOD ${id}` },
```
na:
```jsx
              { lab: `// ${slug}` },
```

(Pełne wiązanie Episode do `useEpisode(slug)` — B8b-3. Tu tylko param, żeby linki ze slugiem działały.)

- [ ] **Step 4: Verify build + lint + testy**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Player.jsx src/Router.jsx src/pages/Episode.jsx
git commit -m "feat(catalog): slug routes, Player title from current track (B8b-2)"
```

---

## Task 7: Usunięcie tracks.js + weryfikacja E2E

**Files:**
- Delete: `src/data/tracks.js`

- [ ] **Step 1: Potwierdź brak importerów**

Run: `grep -rn "data/tracks\|HERO_TRACK\|getTrack\|from \"\\.\\./data/tracks\"" src/ | grep -v node_modules`
Expected: brak wyników (poza ewentualnym komentarzem w `Player.jsx` linia ~74 — jeśli jest, zaktualizuj komentarz). Jeśli jakikolwiek IMPORT zostaje — najpierw go usuń (wróć do właściwego tasku), nie usuwaj tracks.js.

- [ ] **Step 2: Usuń plik**

```bash
git rm src/data/tracks.js
```

- [ ] **Step 3: Pełna weryfikacja**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK (brak martwych importów), lint 0, wszystkie testy zielone.

- [ ] **Step 4: E2E ręczny (backend B8a docker + `npm run dev` :5175)**

1. Home: Hero pokazuje przycisk play; klik → gra najnowszy odcinek (audio_url lokalny). AudioPlayerSection pokazuje bieżącą ścieżkę + meta.
2. StoriesGrid: 6 kart z API (poster/tytuł/gatunek/czas); klik play kolejkuje i gra; link karty → `/episode/{slug}`.
3. `/player`: rozdziały i transkrypt z API dla granego odcinka (ep-12 premium → `audio_url` null dla niezalogowanego → brak grania, bez crasha; po zalogowaniu jako uprawniony — gra).
4. `/konto` (zalogowany): polub odcinek (♥ w AudioPlayerSection) → pojawia się w „Ulubione" (slug→episode).
5. Brak błędów w konsoli (build prod: `npm run build && npm run preview`).

- [ ] **Step 5: post-change-audit (1440/768/375)** na Home i `/player`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(catalog): remove hardcoded tracks.js, fully API-backed player (B8b-2)"
```

---

## Self-Review Notes (autor planu)

- **Pokrycie spec:** §4.3 player/queue (Task 1: summary+detail, premiumLocked, audio keyed on src), §4.4 konsumenci Hero/AudioPlayerSection/StoryCard/StoriesGrid/Account/Player (Task 2–6), routing `/episode/:slug` (Task 6), §5 usunięcie tracks.js (Task 7). **Archive/Creators/Episode-detail → B8b-3** (zaznaczone).
- **Sekwencja/build-green:** Task 1 (PlayerContext) nie importuje tracks.js → build green; konsumenci migrują pojedynczo (każdy commit się buduje, bo tracks.js wciąż istnieje aż do Task 7). tracks.js usunięte dopiero gdy zero importerów (Task 7 step 1 to weryfikuje).
- **Intryga audio:** efekt ładujący keyed na `current?.src` (nie `id`) — detal dociąga `src` async przy stałym slugu; bez tego audio nie załadowałoby się po doładowaniu detalu. Udokumentowane w kodzie.
- **Spójność nazw:** `useEpisodes().episodes`, `useEpisode().episode`, `useGenres().genreLabels`, `composeCardMeta(track, genreLabels)`, `toTrack` pola (`id=slug`, `em`, `cover`, `src`, `durationS`, `rating`, `genre` slug) — z B8b-1, używane spójnie. `playQueue(list, slug)` / `playTrack(summary)` / `current.id===slug`.
- **Ryzyka dla wykonawcy:** (a) StoryCard ma test? sprawdzić `src/components/ui/__tests__/` i dostosować do nowych propsów (Task 3 step 3). (b) FavoriteRow oczekuje `track` z polami `toTrack` (Task 5). (c) `current` merge: detail (gdy jest) nadpisuje summary — `current.cover` z detalu = poster (ten sam), OK.
