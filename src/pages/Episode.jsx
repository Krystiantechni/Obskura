import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import FloatingMetaCard from "../components/ui/FloatingMetaCard";
import WaveformBar from "../components/ui/WaveformBar";
import { Play, Pause, Heart, HeartFill, Share, List } from "../components/ui/Icons";

const TOTAL = 47 * 60 + 12;
function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Episode() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.12);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const i = setInterval(() => setProgress((p) => (p + 1 / TOTAL > 1 ? 0 : p + 1 / TOTAL)), 1000);
    return () => clearInterval(i);
  }, [playing]);

  return (
    <div className="px-5 pb-32 pt-[120px] lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <Link to="/archiwum" className="font-mono text-[11px] uppercase tracking-mono text-ink-2 hover:text-ink-0">{t("episode.back")}</Link>

        {/* Cinematic header */}
        <div className="relative mt-6 aspect-[21/9] overflow-hidden border border-white/6 bg-bg-0">
          <video className="absolute inset-0 h-full w-full object-cover" style={{ filter: "contrast(1.05) saturate(0.85)" }} src="/videos/vid-coolon.mp4" poster="/images/monster.png" autoPlay muted loop playsInline preload="metadata" />
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,6,8,0.9) 0%, rgba(5,6,8,0.5) 50%, rgba(5,6,8,0.6) 100%), linear-gradient(180deg, transparent 50%, rgba(5,6,8,0.85) 100%)" }} />
          {["top-4 left-4 border-r-0 border-b-0", "top-4 right-4 border-l-0 border-b-0", "bottom-4 left-4 border-r-0 border-t-0", "bottom-4 right-4 border-l-0 border-t-0"].map((b, i) => (
            <span key={i} className={`absolute z-[3] h-[18px] w-[18px] border border-red ${b}`} />
          ))}
          <FloatingMetaCard accent="blue" label={t("hero.meta_signal_label")} value={t("hero.meta_signal_val")} className="hidden lg:block" style={{ top: "14%", right: "6%" }} />
          <div className="absolute inset-0 z-[2] flex items-end p-8 lg:p-14">
            <div className="max-w-2xl">
              <Eyebrow className="mb-5">{t("episode.eyebrow")}</Eyebrow>
              <h1 className="font-serif text-[clamp(40px,6vw,88px)] font-medium leading-[0.92] tracking-[-0.02em]">
                {t("episode.title_p1")} <em className="italic text-ink-1">{t("episode.title_em")}</em>
              </h1>
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {/* Player bar */}
            <div className="relative border border-white/8 bg-[linear-gradient(180deg,rgba(15,18,24,0.95),rgba(10,13,18,0.98))] p-6">
              <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.5),transparent)]" />
              <div className="mb-5 flex items-center gap-4">
                <button onClick={() => setPlaying((p) => !p)} className="grid h-14 w-14 place-items-center rounded-full bg-ink-0 text-bg-0 transition-all hover:bg-red hover:text-white hover:shadow-[0_0_20px_rgba(255,42,42,0.5)]">
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div>
                  <div className="font-serif text-xl font-medium text-ink-0">{t("episode.title_p1")} {t("episode.title_em")}</div>
                  <div className="font-mono text-[11px] tracking-ui text-ink-2">{t("episode.narrator")} · {t("episode.director")}</div>
                </div>
                <div className="ml-auto flex gap-3">
                  <button onClick={() => setLiked((l) => !l)} className={`grid h-9 w-9 place-items-center border transition-colors ${liked ? "border-red text-red" : "border-white/10 text-ink-1 hover:border-red hover:text-red"}`}>{liked ? <HeartFill /> : <Heart />}</button>
                  <button className="grid h-9 w-9 place-items-center border border-white/10 text-ink-1 transition-colors hover:border-red hover:text-red"><Share /></button>
                  <button className="grid h-9 w-9 place-items-center border border-white/10 text-ink-1 transition-colors hover:border-red hover:text-red"><List /></button>
                </div>
              </div>
              <WaveformBar progress={progress} onSeek={setProgress} />
              <div className="mt-2 flex justify-between font-mono text-[10px] tracking-ui text-ink-2">
                <span className="text-red">{fmt(progress * TOTAL)}</span>
                <span>{t("episode.duration")}</span>
              </div>
            </div>

            <p className="mt-8 text-[17px] font-light leading-relaxed text-ink-1">{t("episode.desc")}</p>

            {/* Transcript lock */}
            <div className="mt-10">
              <Eyebrow className="mb-4">{t("episode.transcript_h")}</Eyebrow>
              <div className="relative overflow-hidden border border-line bg-bg-1/40 p-8">
                <div className="space-y-3 text-sm leading-relaxed text-ink-1 [mask-image:linear-gradient(180deg,black,transparent)]">
                  <p>00:00 — [szum hydrofonów, narastający]</p>
                  <p>00:14 — ELIZA: Nagrywam. Jest 23:47, schodzę pod molo.</p>
                  <p>00:31 — [metaliczny rezonans, 17.8 Hz]</p>
                  <p>00:52 — ELIZA: To nie jest fala. To... oddycha.</p>
                </div>
                <div className="mt-6 flex items-center gap-3 border-t border-line pt-6">
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-red text-red">🔒</span>
                  <span className="text-sm text-ink-1">{t("episode.transcript_lock")}</span>
                  <HorrorButton to="/klub" variant="ghost" className="ml-auto !px-4 !py-2.5">{t("nav.club")}</HorrorButton>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-3 font-mono text-[12px] uppercase tracking-ui">
            {[
              { lab: t("episode.premiere") },
              { lab: t("episode.duration"), pre: "⏱" },
              { lab: t("episode.rating"), accent: true },
              { lab: t("episode.plays") },
              { lab: `// EPIZOD ${id}` },
            ].map((row, i) => (
              <div key={i} className={`border border-line bg-bg-1/40 px-4 py-4 ${row.accent ? "text-red" : "text-ink-1"}`}>{row.lab}</div>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
