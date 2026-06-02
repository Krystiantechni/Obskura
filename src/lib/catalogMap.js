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
