import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import { SearchIcon, GridIcon, ListViewIcon, Play } from "../components/ui/Icons";

const IMGS = {
  monster: "/images/monster.webp",
  hallway: "/images/img-hallway.webp",
  orbs: "/images/img-orbs.webp",
  smoke: "/images/img-smoke.webp",
  forest: "/images/img-forest.webp",
  tunnel: "/images/img-tunnel.webp",
  wolf: "/images/img-wolf.webp",
  creature: "/images/img-creature.webp",
};

const STORIES = [
  { id: 1, num: 12, season: 3, title: "Mgła nad", titleEm: "Wisłoujściem", genre: "cosmic", dur: 47, year: 2026, rating: 4.9, img: "monster", isNew: true, plays: "847K" },
  { id: 2, num: 11, season: 3, title: "Ostatnie", titleEm: "Światło", genre: "psy", dur: 52, year: 2026, rating: 4.9, img: "hallway", isNew: true, plays: "623K" },
  { id: 3, num: 10, season: 3, title: "Coś patrzy", titleEm: "z lasu", genre: "folk", dur: 74, year: 2026, rating: 4.8, img: "forest", isNew: false, plays: "512K" },
  { id: 4, num: 9, season: 3, title: "Dom przy", titleEm: "ul. Cisowej 7", genre: "true", dur: 38, year: 2026, rating: 4.9, img: "creature", isNew: false, plays: "798K" },
  { id: 5, num: 8, season: 3, title: "Sygnał z", titleEm: "orbity", genre: "cosmic", dur: 62, year: 2025, rating: 5.0, img: "orbs", isNew: false, plays: "1.2M" },
  { id: 6, num: 7, season: 3, title: "Pod", titleEm: "betonem", genre: "cyber", dur: 58, year: 2025, rating: 4.6, img: "tunnel", isNew: false, plays: "445K" },
  { id: 7, num: 6, season: 3, title: "Łańcuch", titleEm: "Fenrira", genre: "myth", dur: 82, year: 2025, rating: 5.0, img: "wolf", isNew: false, plays: "932K" },
  { id: 8, num: 5, season: 3, title: "Dym i", titleEm: "obietnice", genre: "noir", dur: 44, year: 2025, rating: 4.7, img: "smoke", isNew: false, plays: "388K" },
  { id: 9, num: 4, season: 3, title: "Pacjentka", titleEm: "numer 23", genre: "psy", dur: 56, year: 2025, rating: 4.8, img: "hallway", isNew: false, plays: "512K" },
  { id: 10, num: 3, season: 3, title: "Zimowy", titleEm: "wąwóz", genre: "folk", dur: 47, year: 2024, rating: 4.5, img: "forest", isNew: false, plays: "298K" },
  { id: 11, num: 2, season: 3, title: "Korelacja", titleEm: "lustra", genre: "cosmic", dur: 71, year: 2024, rating: 4.7, img: "orbs", isNew: false, plays: "402K" },
  { id: 12, num: 1, season: 3, title: "Maszynownia", titleEm: "", genre: "cyber", dur: 49, year: 2024, rating: 4.6, img: "tunnel", isNew: false, plays: "361K" },
  { id: 13, num: 12, season: 2, title: "Pierwsze", titleEm: "mleko", genre: "body", dur: 38, year: 2024, rating: 4.9, img: "creature", isNew: false, plays: "521K" },
  { id: 14, num: 11, season: 2, title: "Wilcza", titleEm: "godzina", genre: "myth", dur: 64, year: 2024, rating: 4.8, img: "wolf", isNew: false, plays: "478K" },
  { id: 15, num: 10, season: 2, title: "Pusty", titleEm: "pokój", genre: "psy", dur: 42, year: 2023, rating: 4.6, img: "hallway", isNew: false, plays: "329K" },
  { id: 16, num: 9, season: 2, title: "Lichwiarz", titleEm: "", genre: "noir", dur: 51, year: 2023, rating: 4.4, img: "smoke", isNew: false, plays: "212K" },
];

const GENRE_TAG = { psy: "red", true: "red", body: "red", folk: "blue", cosmic: "blue", cyber: "blue", noir: "", myth: "" };

function fmtDur(min) {
  if (min >= 60) return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
  return `${min}:00`;
}

export default function Archive() {
  const { t } = useTranslation();
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState("new");
  const [q, setQ] = useState("");
  const [view, setView] = useState("grid");

  const genres = [
    { id: "all", label: t("archive.filter_all") },
    { id: "psy", label: t("register.genres.psy_label") },
    { id: "folk", label: t("register.genres.folk_label") },
    { id: "cosmic", label: t("register.genres.cosmic_label") },
    { id: "true", label: t("register.genres.true_label") },
    { id: "noir", label: t("register.genres.noir_label") },
    { id: "cyber", label: t("register.genres.cyber_label") },
    { id: "myth", label: t("register.genres.myth_label") },
    { id: "body", label: t("register.genres.body_label") },
  ];
  const genreLabel = Object.fromEntries(genres.map((g) => [g.id, g.label]));

  const counts = useMemo(() => {
    const c = { all: STORIES.length };
    STORIES.forEach((s) => (c[s.genre] = (c[s.genre] || 0) + 1));
    return c;
  }, []);

  const filtered = useMemo(() => {
    let list = STORIES;
    if (genre !== "all") list = list.filter((s) => s.genre === genre);
    if (q.trim()) {
      const qq = q.toLowerCase();
      list = list.filter((s) => (s.title + " " + s.titleEm).toLowerCase().includes(qq));
    }
    list = [...list];
    if (sort === "new") list.sort((a, b) => b.year - a.year || b.season - a.season || b.num - a.num);
    if (sort === "old") list.sort((a, b) => a.year - b.year || a.season - b.season || a.num - b.num);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "duration") list.sort((a, b) => b.dur - a.dur);
    return list;
  }, [genre, sort, q]);

  const sortLabel = { new: t("archive.sort_new"), old: t("archive.sort_old"), rating: t("archive.sort_rating"), duration: t("archive.sort_duration") }[sort];

  return (
    <>
      {/* Header */}
      <header className="relative overflow-hidden border-b border-line px-5 pb-10 pt-[140px] lg:px-12">
        <div className="pointer-events-none absolute -right-52 top-24 h-[600px] w-[600px]" style={{ background: "radial-gradient(circle, rgba(255,42,42,0.08), transparent 60%)" }} />
        <div className="relative mx-auto max-w-[1400px]">
          <Eyebrow>{t("archive.eyebrow")}</Eyebrow>
          <h1 className="my-3 font-serif text-[clamp(48px,8vw,120px)] font-medium leading-[0.9] tracking-[-0.02em]">
            {t("archive.title_p1")} <em className="italic text-ink-1">{t("archive.title_em")}</em>
            <br />
            {t("archive.title_p2")}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-1">{t("archive.lead")}</p>
          <div className="mt-6 flex flex-wrap gap-9 border-t border-line pt-5">
            {[
              { num: "147", lab: t("archive.stat_episodes") },
              { num: "412h", lab: t("archive.stat_total") },
              { num: "38", lab: t("archive.stat_narrators") },
              { num: "12", lab: t("archive.stat_series") },
              { num: "4.8 ★", lab: t("archive.stat_avg") },
            ].map((s, i) => (
              <div key={i}>
                <div className="font-serif text-4xl font-medium leading-none">{s.num}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-mono text-ink-2">{s.lab}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="border-b border-line bg-bg-1/70 px-5 py-5 backdrop-blur-md lg:px-12">
        <div className="mx-auto grid max-w-[1400px] items-center gap-5 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2"><SearchIcon /></span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("archive.search_placeholder")}
              className="w-full border border-line bg-black/40 py-3 pl-11 pr-4 text-sm text-ink-0 transition-colors focus:border-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70"
            />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="cursor-pointer border border-line bg-black/40 px-4 py-3 text-[13px] text-ink-0 transition-colors focus:border-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70">
            <option value="new">{t("archive.sort_new")}</option>
            <option value="old">{t("archive.sort_old")}</option>
            <option value="rating">{t("archive.sort_rating")}</option>
            <option value="duration">{t("archive.sort_duration")}</option>
          </select>
          <div className="flex border border-line justify-self-start">
            <button onClick={() => setView("grid")} className={`grid h-[42px] w-[42px] place-items-center transition-colors ${view === "grid" ? "bg-red text-white" : "text-ink-2 hover:text-ink-0"}`}><GridIcon /></button>
            <button onClick={() => setView("list")} className={`grid h-[42px] w-[42px] place-items-center transition-colors ${view === "list" ? "bg-red text-white" : "text-ink-2 hover:text-ink-0"}`}><ListViewIcon /></button>
          </div>
        </div>
      </div>

      {/* Genre chips */}
      <div className="mx-auto flex max-w-[1400px] flex-wrap gap-2 px-5 py-6 lg:px-12">
        {genres.map((g) => (
          <button
            key={g.id}
            onClick={() => setGenre(g.id)}
            className={[
              "flex items-center gap-2 border px-4 py-2 font-mono text-[11px] uppercase tracking-ui transition-colors",
              genre === g.id ? "border-red bg-red text-white" : "border-line text-ink-1 hover:border-red/40",
            ].join(" ")}
          >
            <span>{g.label}</span>
            <span className={genre === g.id ? "text-white/70 text-[10px]" : "text-ink-3 text-[10px]"}>{counts[g.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mx-auto mt-5 max-w-[1400px] px-5 pb-32 lg:px-12">
        <div className="mb-7 flex items-center justify-between border-b border-line pb-4 font-mono text-[11px] uppercase tracking-ui text-ink-2">
          <div>
            <span className="text-ink-0">{filtered.length}</span> {filtered.length === 1 ? t("archive.result_one") : t("archive.result_many")}
            {genre !== "all" && ` · ${genreLabel[genre].toUpperCase()}`}
            {q && ` · "${q}"`}
          </div>
          <div>{t("archive.sort_label")} · {sortLabel.toUpperCase()}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-ink-2">
            <h3 className="mb-3 font-serif text-3xl font-medium text-ink-0">{t("archive.no_results_h1")} <em className="italic text-ink-1">{t("archive.no_results_em")}</em>.</h3>
            <p>{t("archive.no_results_sub")}</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {filtered.map((s) => {
              const tag = GENRE_TAG[s.genre];
              const tagCls = tag === "red" ? "text-red border-red/40" : tag === "blue" ? "text-blue border-blue/40" : "text-ink-1 border-white/20";
              return (
                <Link key={s.id} to={`/odcinek/${s.id}`} className="group relative block aspect-[3/4] overflow-hidden bg-bg-1">
                  <div className="absolute inset-0 bg-cover bg-[center_30%] brightness-[0.85] grayscale-[0.4] transition-all duration-500 group-hover:scale-105 group-hover:brightness-100 group-hover:grayscale-0" style={{ backgroundImage: `url(${IMGS[s.img]})` }} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-0/95" />
                  <div className="absolute left-3.5 top-3.5 z-[2] bg-black/50 px-2 py-1 font-mono text-[10px] tracking-mono text-ink-1 backdrop-blur-sm">S{String(s.season).padStart(2, "0")}·E{String(s.num).padStart(2, "0")}</div>
                  {s.isNew && <div className="absolute right-3.5 top-3.5 z-[2] bg-red px-2 py-1 font-mono text-[9px] tracking-mono text-white shadow-[0_0_12px_rgba(255,42,42,0.5)]">{t("archive.new_badge")}</div>}
                  <span className="absolute bottom-[90px] right-4 z-[3] grid h-9 w-9 translate-y-2 place-items-center border border-white/15 bg-black/70 text-ink-0 opacity-0 backdrop-blur-sm transition-all group-hover:translate-y-0 group-hover:opacity-100 group-hover:border-red group-hover:bg-red"><Play size={10} /></span>
                  <div className="absolute inset-x-0 bottom-0 z-[2] p-5">
                    <span className={`mb-2.5 inline-block border bg-black/40 px-2 py-[3px] font-mono text-[9px] uppercase tracking-mono ${tagCls}`}>{genreLabel[s.genre]}</span>
                    <h3 className="mb-1.5 font-serif text-[22px] font-medium leading-tight">{s.title} {s.titleEm && <em className="italic text-ink-1">{s.titleEm}</em>}</h3>
                    <div className="flex justify-between font-mono text-[9px] uppercase tracking-ui text-ink-2">
                      <span>{fmtDur(s.dur)} · {s.plays}</span>
                      <span className="text-red">★ {s.rating}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => {
              const tag = GENRE_TAG[s.genre];
              const tagCls = tag === "red" ? "text-red border-red/40" : tag === "blue" ? "text-blue border-blue/40" : "text-ink-1 border-white/20";
              return (
                <Link key={s.id} to={`/odcinek/${s.id}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-3 border border-line bg-bg-1/40 p-3 transition-colors hover:border-red/30 hover:bg-bg-1/70 sm:grid-cols-[100px_1fr_auto_auto] sm:gap-5">
                  <div className="h-[50px] w-16 bg-cover bg-[center_30%] sm:h-20 sm:w-[100px]" style={{ backgroundImage: `url(${IMGS[s.img]})` }} />
                  <div>
                    <span className={`mb-1.5 inline-block border bg-black/40 px-2 py-[3px] font-mono text-[9px] uppercase tracking-mono ${tagCls}`}>{genreLabel[s.genre]}</span>
                    <h3 className="font-serif text-lg font-medium leading-tight">{s.title} {s.titleEm && <em className="italic text-ink-1">{s.titleEm}</em>}</h3>
                  </div>
                  <div className="hidden font-mono text-[10px] uppercase tracking-ui text-ink-2 sm:block">{fmtDur(s.dur)} · {s.plays}</div>
                  <div className="font-mono text-[10px] uppercase tracking-ui text-red">★ {s.rating}</div>
                </Link>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && filtered.length < STORIES.length && (
          <div className="mt-14 text-center font-mono text-[11px] uppercase tracking-mono text-ink-2">
            {t("archive.showing")} {filtered.length} {t("archive.of_total")} {STORIES.length}
          </div>
        )}
      </div>
    </>
  );
}
