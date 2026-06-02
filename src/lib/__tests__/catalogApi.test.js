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
