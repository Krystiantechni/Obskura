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
  audio_url: null,
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
