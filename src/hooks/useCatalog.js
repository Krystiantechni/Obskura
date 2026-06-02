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
