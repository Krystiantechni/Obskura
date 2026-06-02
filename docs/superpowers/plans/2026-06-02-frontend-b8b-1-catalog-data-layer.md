# B8b-1 — Catalog data layer (TanStack Query) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Zbudować w pełni testowalną warstwę danych katalogu (fetch + mapowanie + hooki TanStack Query) — fundament, na którym B8b-2 przepnie konsumentów (Archive/Episode/Home/Player/Creators).

**Architecture:** Cienki `catalogApi.js` nad `request()` z B8a → czysty `catalogMap.js` (`toTrack` + formatery) → hooki `useCatalog.js` (TanStack Query: `useEpisodes` infinite, `useEpisode`, `useSeasons/Genres/Creators`) zwracające już zmapowane dane. `QueryClientProvider` najwyżej w `App.jsx`.

**Tech Stack:** React 19.2, react-router-dom v7, `@tanstack/react-query` v5 (nowość), Vitest + RTL (jsdom). Backend: DRF cursor-pagination (`{next,previous,results}`, 20/stronę), `next` = pełny URL z `?cursor=`.

**Spec:** `docs/superpowers/specs/2026-06-02-frontend-b8b-catalog-design.md` (§3 kontrakt API, §4.1–4.2 warstwa danych, §6 testy). Konsumenci (§4.3–4.4) → osobny plan B8b-2.

---

## File Structure

**Nowe:**
- `src/lib/queryClient.js` — singleton `QueryClient` (staleTime/retry/refetch defaults).
- `src/lib/catalogApi.js` — funkcje fetch nad `request()` (episodes/episode/seasons/genres/creators).
- `src/lib/catalogMap.js` — `toTrack(apiEpisode)`, `fmtDuration`, `composeCardMeta`, `composeEpisodeMeta` (czyste, bez zależności od Reacta).
- `src/hooks/useCatalog.js` — hooki TanStack zwracające zmapowane dane.
- `src/components/ui/CardSkeleton.jsx` — placeholder shimmer karty (użyją go konsumenci w B8b-2).
- `src/test/renderWithQuery.jsx` — util testowy: provider z izolowanym `QueryClient` (retry:false).
- Testy: `src/lib/__tests__/catalogMap.test.js`, `src/lib/__tests__/catalogApi.test.js`, `src/hooks/__tests__/useCatalog.test.jsx`.

**Modyfikowane:**
- `package.json` — dependency `@tanstack/react-query`.
- `src/App.jsx` — `QueryClientProvider` jako najbardziej zewnętrzny provider.
- `src/hooks/index.js` — re-export hooków katalogu.

**Poza zakresem B8b-1 (→ B8b-2):** `tracks.js`/STORIES/creators array removal, Archive/Episode/Home/StoriesGrid/Hero/AudioPlayerSection/StoryCard/Account/Player/PlayerContext refactor, routing `/episode/:slug`.

---

## Task 1: Zależność + QueryClient + Provider

**Files:**
- Modify: `package.json`
- Create: `src/lib/queryClient.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Zainstaluj @tanstack/react-query**

Run: `npm install @tanstack/react-query@^5`
Expected: dodane do `dependencies`, `node_modules` zaktualizowane, brak peer-warningów blokujących (React 19 jest wspierany przez v5).

- [ ] **Step 2: Utwórz `src/lib/queryClient.js`**

```js
import { QueryClient } from "@tanstack/react-query";

// Katalog jest read-heavy i rzadko się zmienia (backend cache'uje w Redis) —
// długi staleTime, brak refetch on focus, jedna próba retry.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 3: Owinąć aplikację `QueryClientProvider` (najbardziej zewnętrznie)**

W `src/App.jsx` zamień całą treść na:

```jsx
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./Router";
import { useLenisScroll } from "./hooks/useLenisScroll";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { queryClient } from "./lib/queryClient";

export default function App() {
  useLenisScroll();
  // QueryClient najwyżej (katalog), potem Auth (sesja) i Player (jeden <audio>) — wszystkie ponad routerem.
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <RouterProvider router={router} />
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Verify build + lint + testy (regresja)**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, 65 testów zielonych (provider nie zmienia zachowania istniejących).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/queryClient.js src/App.jsx
git commit -m "feat(catalog): add TanStack Query client and provider (B8b-1)"
```

---

## Task 2: `catalogApi.js` — funkcje fetch

**Files:**
- Create: `src/lib/catalogApi.js`
- Test: `src/lib/__tests__/catalogApi.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/lib/__tests__/catalogApi.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEpisodes, fetchEpisode, fetchGenres } from "../catalogApi.js";

vi.mock("../apiClient.js", () => ({ request: vi.fn().mockResolvedValue({ ok: true }) }));
import { request } from "../apiClient.js";

describe("catalogApi", () => {
  beforeEach(() => request.mockClear());

  it("fetchEpisodes bez filtrów → GET catalog/episodes (auth:false)", async () => {
    await fetchEpisodes();
    expect(request).toHaveBeenCalledWith("GET", "catalog/episodes", { auth: false });
  });

  it("fetchEpisodes z filtrami buduje query string, pomija puste", async () => {
    await fetchEpisodes({ genre: "psy", cursor: "abc", season: undefined, search: "" });
    const [, path] = request.mock.calls[0];
    expect(path).toBe("catalog/episodes?genre=psy&cursor=abc");
  });

  it("fetchEpisode dołącza slug i wysyła token (auth:true → premium audio)", async () => {
    await fetchEpisode("s03-e12-mgla");
    expect(request).toHaveBeenCalledWith("GET", "catalog/episodes/s03-e12-mgla", { auth: true });
  });

  it("fetchGenres → GET catalog/genres (auth:false)", async () => {
    await fetchGenres();
    expect(request).toHaveBeenCalledWith("GET", "catalog/genres", { auth: false });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/__tests__/catalogApi.test.js`
Expected: FAIL — `Failed to resolve import "../catalogApi.js"`.

- [ ] **Step 3: Write implementation**

```js
// src/lib/catalogApi.js
// Cienka warstwa nad request() (B8a). Listy/seasons/genres publiczne (auth:false);
// detal odcinka wysyła token (auth:true) — zalogowany+uprawniony dostaje audio_url premium.
// Endpoint detalu ma OptionalTokenAuth → zły/wygasły token NIE daje 401 (pozostaje publiczny).
import { request } from "./apiClient.js";

function qs(params = {}) {
  const usp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === "") continue;
    usp.append(key, String(val));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const fetchEpisodes = (params = {}) =>
  request("GET", `catalog/episodes${qs(params)}`, { auth: false });

export const fetchEpisode = (slug) =>
  request("GET", `catalog/episodes/${slug}`, { auth: true });

export const fetchSeasons = () => request("GET", "catalog/seasons", { auth: false });
export const fetchGenres = () => request("GET", "catalog/genres", { auth: false });
export const fetchCreators = (params = {}) =>
  request("GET", `catalog/creators${qs(params)}`, { auth: false });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/__tests__/catalogApi.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/catalogApi.js src/lib/__tests__/catalogApi.test.js
git commit -m "feat(catalog): catalog fetch functions over request (B8b-1)"
```

---

## Task 3: `catalogMap.js` — mapowanie API → kształt frontu

**Files:**
- Create: `src/lib/catalogMap.js`
- Test: `src/lib/__tests__/catalogMap.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/lib/__tests__/catalogMap.test.js
import { describe, it, expect } from "vitest";
import { toTrack, fmtDuration, composeCardMeta, composeEpisodeMeta } from "../catalogMap.js";

const LIST_EP = {
  slug: "s03-e12-mgla", number: 12, season: 3, title: "Mgła nad", title_em: "Wisłoujściem",
  genre: "cosmic", duration_s: 2820, poster: "/images/monster.webp", video_preview: "",
  rating_avg: "4.90", plays_count: 847000, is_true_horror: false, kind: "fiction",
  premium: true, published_at: "2026-01-01",
};

const DETAIL_EP = {
  ...LIST_EP,
  season: { number: 3, title: "Sezon 03", slug: "sezon-03" },
  genre: { name: "Cosmic dread", slug: "cosmic", accent: "blue" },
  audio_url: null, // premium, anon
  chapters: [{ n: 1, key: "ch1", title: "Powrót", time_str: "00:00", sec: 0 }],
  transcript: [{ key: "t1", order: 0, sec: 10, speaker: "narratorka", marker: "", text: "..." }],
};

describe("catalogMap", () => {
  it("toTrack mapuje listę (genre/season jako prymitywy)", () => {
    const t = toTrack(LIST_EP);
    expect(t.id).toBe("s03-e12-mgla");
    expect(t.slug).toBe("s03-e12-mgla");
    expect(t.em).toBe("Wisłoujściem");
    expect(t.cover).toBe("/images/monster.webp");
    expect(t.genre).toBe("cosmic");
    expect(t.season).toBe(3);
    expect(t.durationS).toBe(2820);
    expect(t.premium).toBe(true);
    expect(t.src).toBeNull();
    expect(t.chapters).toEqual([]);
    expect(t.transcript).toEqual([]);
  });

  it("toTrack mapuje detal (genre/season jako obiekty, chapters title→t, time_str→time)", () => {
    const t = toTrack(DETAIL_EP);
    expect(t.genre).toBe("cosmic");
    expect(t.season).toBe(3);
    expect(t.chapters).toEqual([{ n: 1, key: "ch1", t: "Powrót", time: "00:00", sec: 0 }]);
    expect(t.transcript).toHaveLength(1);
    expect(t.transcript[0].text).toBe("...");
  });

  it("toTrack: brak audio_url → src null; null wejście → null", () => {
    expect(toTrack({ ...LIST_EP, audio_url: "/audio/ep-12.mp3" }).src).toBe("/audio/ep-12.mp3");
    expect(toTrack(null)).toBeNull();
  });

  it("fmtDuration: M:SS i H:MM:SS", () => {
    expect(fmtDuration(125)).toBe("2:05");
    expect(fmtDuration(2820)).toBe("47:00");
    expect(fmtDuration(3725)).toBe("1:02:05");
    expect(fmtDuration(0)).toBe("0:00");
  });

  it("composeCardMeta: nazwa gatunku z mapy, fallback do slug", () => {
    const t = toTrack(LIST_EP);
    expect(composeCardMeta(t, { cosmic: "Cosmic dread" })).toBe("Cosmic dread · 47:00");
    expect(composeCardMeta(t, {})).toBe("cosmic · 47:00");
  });

  it("composeEpisodeMeta: S03 · E12", () => {
    expect(composeEpisodeMeta(toTrack(LIST_EP))).toBe("S03 · E12");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/__tests__/catalogMap.test.js`
Expected: FAIL — `Failed to resolve import "../catalogMap.js"`.

- [ ] **Step 3: Write implementation**

```js
// src/lib/catalogMap.js
// Jedyne źródło prawdy mapowania API katalogu → kształt używany na froncie.
// Czyste funkcje (bez Reacta) — łatwo testowalne.

export function fmtDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// Episode (list LUB detail) → track. season/genre bywają prymitywem (lista) lub obiektem (detal).
export function toTrack(ep) {
  if (!ep) return null;
  const season = ep.season && typeof ep.season === "object" ? ep.season.number : ep.season;
  const genre = ep.genre && typeof ep.genre === "object" ? ep.genre.slug : ep.genre;
  return {
    id: ep.slug,
    slug: ep.slug,
    number: ep.number,
    season,
    title: ep.title,
    em: ep.title_em || "",
    cover: ep.poster || "",
    src: ep.audio_url ?? null,
    premium: !!ep.premium,
    genre,
    durationS: ep.duration_s ?? 0,
    rating: ep.rating_avg != null ? Number(ep.rating_avg) : null,
    plays: ep.plays_count ?? 0,
    video: ep.video_preview || "",
    isTrueHorror: !!ep.is_true_horror,
    kind: ep.kind,
    publishedAt: ep.published_at,
    chapters: Array.isArray(ep.chapters)
      ? ep.chapters.map((c) => ({ n: c.n, key: c.key, t: c.title, time: c.time_str, sec: c.sec }))
      : [],
    transcript: Array.isArray(ep.transcript) ? ep.transcript : [],
  };
}

// Karty: "Gatunek · MM:SS". genreLabels = mapa slug→nazwa (z useGenres); fallback do slug.
export function composeCardMeta(track, genreLabels = {}) {
  const g = genreLabels[track.genre] || track.genre || "";
  return `${g} · ${fmtDuration(track.durationS)}`;
}

// Hero/featured: "S03 · E12".
export function composeEpisodeMeta(track) {
  const pad = (n) => String(n ?? 0).padStart(2, "0");
  return `S${pad(track.season)} · E${pad(track.number)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/__tests__/catalogMap.test.js`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/catalogMap.js src/lib/__tests__/catalogMap.test.js
git commit -m "feat(catalog): pure API→track mapping and formatters (B8b-1)"
```

---

## Task 4: Test util `renderWithQuery`

**Files:**
- Create: `src/test/renderWithQuery.jsx`

Util dla testów hooków/komponentów używających TanStack Query — izolowany `QueryClient` z `retry:false` (testy nie czekają na retry).

- [ ] **Step 1: Write the util**

```jsx
// src/test/renderWithQuery.jsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Świeży klient per użycie, retry wyłączony (błędy natychmiast widoczne w teście).
export function makeQueryWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  function Wrapper({ children }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}
```

- [ ] **Step 2: Verify lint (plik util, brak testu)**

Run: `npm run lint`
Expected: 0 błędów. (Jeśli ESLint zgłosi brak PropTypes na `Wrapper` — dodaj `Wrapper.propTypes = { children: PropTypes.node }` z importem `prop-types`, zgodnie z konwencją repo.)

- [ ] **Step 3: Commit**

```bash
git add src/test/renderWithQuery.jsx
git commit -m "test(catalog): query wrapper util for hook tests (B8b-1)"
```

---

## Task 5: `useCatalog.js` — hooki TanStack

**Files:**
- Create: `src/hooks/useCatalog.js`
- Modify: `src/hooks/index.js`
- Test: `src/hooks/__tests__/useCatalog.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
// src/hooks/__tests__/useCatalog.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { makeQueryWrapper } from "../../test/renderWithQuery.jsx";

vi.mock("../../lib/catalogApi.js", () => ({
  fetchEpisodes: vi.fn(),
  fetchEpisode: vi.fn(),
  fetchSeasons: vi.fn(),
  fetchGenres: vi.fn(),
  fetchCreators: vi.fn(),
}));
import { fetchEpisodes, fetchEpisode, fetchGenres } from "../../lib/catalogApi.js";
import { useEpisodes, useEpisode, useGenres } from "../useCatalog.js";

const EP = (slug) => ({ slug, number: 1, season: 3, title: "T", title_em: "", genre: "psy", duration_s: 60, poster: "", premium: false });

describe("useCatalog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("useEpisodes spłaszcza wyniki przez toTrack", async () => {
    fetchEpisodes.mockResolvedValue({ next: null, results: [EP("a"), EP("b")] });
    const { result } = renderHook(() => useEpisodes({ genre: "psy" }), { wrapper: makeQueryWrapper() });
    await waitFor(() => expect(result.current.episodes).toHaveLength(2));
    expect(result.current.episodes[0].id).toBe("a");
    expect(fetchEpisodes).toHaveBeenCalledWith({ genre: "psy", cursor: undefined });
  });

  it("useEpisode mapuje detal i jest disabled przy braku slug", async () => {
    fetchEpisode.mockResolvedValue(EP("s1"));
    const { result, rerender } = renderHook(({ slug }) => useEpisode(slug), {
      wrapper: makeQueryWrapper(), initialProps: { slug: null },
    });
    expect(fetchEpisode).not.toHaveBeenCalled(); // enabled:false dla null
    rerender({ slug: "s1" });
    await waitFor(() => expect(result.current.episode?.slug).toBe("s1"));
  });

  it("useGenres buduje mapę slug→name", async () => {
    fetchGenres.mockResolvedValue([{ slug: "psy", name: "Psychologiczny", accent: "red" }]);
    const { result } = renderHook(() => useGenres(), { wrapper: makeQueryWrapper() });
    await waitFor(() => expect(result.current.genres).toHaveLength(1));
    expect(result.current.genreLabels).toEqual({ psy: "Psychologiczny" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/hooks/__tests__/useCatalog.test.jsx`
Expected: FAIL — `Failed to resolve import "../useCatalog.js"`.

- [ ] **Step 3: Write implementation**

```js
// src/hooks/useCatalog.js
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchCreators,
  fetchEpisode,
  fetchEpisodes,
  fetchGenres,
  fetchSeasons,
} from "../lib/catalogApi.js";
import { toTrack } from "../lib/catalogMap.js";

// `next` to pełny URL z ?cursor=… — wyciągamy sam cursor, by lecieć przez request()/BASE.
function cursorOf(nextUrl) {
  if (!nextUrl) return undefined;
  try {
    return new URL(nextUrl).searchParams.get("cursor") || undefined;
  } catch {
    return undefined;
  }
}

export function useEpisodes(filters = {}) {
  const query = useInfiniteQuery({
    queryKey: ["episodes", filters],
    queryFn: ({ pageParam }) => fetchEpisodes({ ...filters, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => cursorOf(lastPage?.next),
  });
  const episodes = (query.data?.pages ?? []).flatMap((p) => (p?.results ?? []).map(toTrack));
  return { ...query, episodes };
}

export function useEpisode(slug) {
  const query = useQuery({
    queryKey: ["episode", slug],
    queryFn: () => fetchEpisode(slug),
    enabled: !!slug,
  });
  return { ...query, episode: query.data ? toTrack(query.data) : null };
}

export function useSeasons() {
  const query = useQuery({ queryKey: ["seasons"], queryFn: fetchSeasons, staleTime: 30 * 60_000 });
  return { ...query, seasons: query.data ?? [] };
}

export function useGenres() {
  const query = useQuery({ queryKey: ["genres"], queryFn: fetchGenres, staleTime: 30 * 60_000 });
  const genres = query.data ?? [];
  const genreLabels = Object.fromEntries(genres.map((g) => [g.slug, g.name]));
  return { ...query, genres, genreLabels };
}

export function useCreators(params = {}) {
  const query = useQuery({ queryKey: ["creators", params], queryFn: () => fetchCreators(params) });
  // endpoint creators bywa paginowany (PageNumber → {results}) lub płaski — obsłuż oba.
  const creators = query.data?.results ?? (Array.isArray(query.data) ? query.data : []);
  return { ...query, creators };
}
```

- [ ] **Step 4: Re-export z barrela**

Dopisz na końcu `src/hooks/index.js`:

```js
export { useEpisodes, useEpisode, useSeasons, useGenres, useCreators } from "./useCatalog";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- src/hooks/__tests__/useCatalog.test.jsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useCatalog.js src/hooks/index.js src/hooks/__tests__/useCatalog.test.jsx
git commit -m "feat(catalog): TanStack Query hooks for episodes/seasons/genres/creators (B8b-1)"
```

---

## Task 6: `CardSkeleton` + finalna weryfikacja

**Files:**
- Create: `src/components/ui/CardSkeleton.jsx`

Lekki placeholder 3:4 dla siatek (użyją go Archive/Home w B8b-2). Loop-shimmer przez Tailwind `animate-pulse`.

- [ ] **Step 1: Write the component**

```jsx
// src/components/ui/CardSkeleton.jsx
import PropTypes from "prop-types";

// Placeholder karty historii (3:4) na czas ładowania listy katalogu.
export default function CardSkeleton({ count = 1 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={i}
      aria-hidden="true"
      className="aspect-[3/4] animate-pulse bg-bg-1/60 [contain:layout_style_paint]"
    />
  ));
}

CardSkeleton.propTypes = { count: PropTypes.number };
```

- [ ] **Step 2: Verify build + lint + cały zestaw testów**

Run: `npm run build && npm run lint && npm run test:run`
Expected: build OK, lint 0, testy zielone (65 istniejących + nowe: catalogApi 4, catalogMap 6, useCatalog 3 = 78).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/CardSkeleton.jsx
git commit -m "feat(catalog): card skeleton placeholder for list loading (B8b-1)"
```

---

## Self-Review Notes (autor planu)

- **Pokrycie spec (część danych):** §4.1 `catalogApi`/`catalogMap`/`useCatalog` (Task 2,3,5), §4.2 QueryClient (Task 1), `CardSkeleton` z §4.5 (Task 6), test util + testy z §6 (Task 3,4,5). **Konsumenci §4.3–4.4, usuwanie §5, routing — świadomie w B8b-2** (osobny plan, ten fundament jest jego warunkiem).
- **Spójność nazw:** `toTrack`/`fmtDuration`/`composeCardMeta`/`composeEpisodeMeta` (Task 3) = używane w hookach (Task 5) i identyczne w testach. `useEpisodes`/`useEpisode`/`useSeasons`/`useGenres`/`useCreators` (Task 5) = barrel (Task 5 step 4). `fetchEpisodes(...,{cursor})` ↔ `getNextPageParam`→`cursorOf(next)`. Pola track (`durationS`, `genre` slug, `season` number, `chapters[].t/time`) spójne map↔test.
- **Kontrakt potwierdzony na żywym API:** response `{next(url),previous,results}`, slug `s03-e12-…`, genres/seasons płaskie, episodes/creators paginowane (`useCreators` obsługuje oba kształty).
- **Brak placeholderów:** każdy krok ma pełny kod/komendę/oczekiwany wynik.
