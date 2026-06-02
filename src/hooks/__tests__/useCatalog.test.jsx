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
    expect(fetchEpisode).not.toHaveBeenCalled();
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
