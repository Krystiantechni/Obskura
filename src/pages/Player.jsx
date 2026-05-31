import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WaveformBar from "../components/ui/WaveformBar";
import { Play, Pause, Prev, Next, Heart, Share, List, Arrow } from "../components/ui/Icons";
import { usePlayer } from "../context/PlayerContext";

// Fallback długość, gdy żadna ścieżka nie jest jeszcze załadowana w PlayerContext
// (np. wejście na /player bez wcześniejszego playTrack). Pozwala UI nie pęknąć
// — i tak `seek` w kontekście wymaga realnego `duration`, więc bez ścieżki kliknięcia
// są no-opem (zgodnie z implementacją kontekstu).
const FALLBACK_TOTAL = 47 * 60 + 12;

function fmt(sec) {
  const s = Number.isFinite(sec) ? Math.max(0, sec) : 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function Visualizer({ playing, frame }) {
  const bars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 48; i++) {
      const phase = frame * 0.2 + i * 0.3;
      const a = Math.sin(phase) * 0.5 + 0.5;
      const b = Math.sin(phase * 1.7 + i) * 0.5 + 0.5;
      arr.push({ h: 0.15 + a * b * 0.85, cold: i % 7 === 0 || i % 11 === 0 });
    }
    return arr;
  }, [frame]);

  return (
    <div className="mb-7 flex h-[60px] items-end gap-[4px] px-1">
      {bars.map((b, i) => (
        <div
          key={i}
          className={`min-h-[4px] flex-1 transition-[height] duration-100 ${
            b.cold
              ? "bg-[linear-gradient(180deg,#5fa8ff,rgba(95,168,255,0.3))] shadow-[0_0_4px_rgba(95,168,255,0.3)]"
              : "bg-[linear-gradient(180deg,#ff2a2a,rgba(255,42,42,0.3))] shadow-[0_0_4px_rgba(255,42,42,0.4)]"
          }`}
          style={{ height: `${b.h * 100}%`, opacity: playing ? 1 : 0.3 }}
        />
      ))}
    </div>
  );
}

Visualizer.propTypes = {
  playing: PropTypes.bool.isRequired,
  frame: PropTypes.number.isRequired,
};

export default function Player() {
  const { t } = useTranslation();
  const {
    current,
    playing,
    toggle,
    currentTime,
    duration,
    seek,
  } = usePlayer();

  const [tab, setTab] = useState("transcript");
  const [speed, setSpeed] = useState(1);
  const [frame, setFrame] = useState(0);
  const panelRef = useRef(null);

  // Chapters i transcript pochodzą z metadata aktualnej ścieżki (src/data/tracks.js).
  // Tracki bez tych pól pokazują fallback "Transkrypt wkrótce" / brak listy rozdziałów.
  // useMemo żeby empty-array fallback miał stabilną referencję (deps innych useMemo).
  const CHAPTERS = useMemo(() => current?.chapters ?? [], [current]);
  const TRANSCRIPT = useMemo(() => current?.transcript ?? [], [current]);

  // Realna długość odcinka — jeśli kontekst zna duration (audio załadowane),
  // używamy go; w przeciwnym razie fallback dla layoutu.
  const total = duration > 0 ? duration : FALLBACK_TOTAL;
  const seconds = currentTime;
  const progress = total > 0 ? Math.min(1, Math.max(0, seconds / total)) : 0;

  // Pomocnik: skok do konkretnej sekundy przez seek(frac) z PlayerContext.
  // Działa tylko gdy duration > 0 (kontekst odrzuca seek bez załadowanego audio).
  const seekToSeconds = (sec) => {
    if (!total) return;
    seek(Math.min(1, Math.max(0, sec / total)));
  };

  // Visualizer frame loop — pozostaje lokalny (czysto dekoracyjny).
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => setFrame((f) => f + 1), 80);
    return () => clearInterval(id);
  }, [playing]);

  const currentLineIdx = useMemo(() => {
    let idx = -1;
    TRANSCRIPT.forEach((line, i) => {
      if (line.sec !== undefined && line.sec <= seconds) idx = i;
    });
    return idx;
  }, [seconds, TRANSCRIPT]);

  const currentCh = useMemo(() => {
    if (CHAPTERS.length === 0) return null;
    let c = CHAPTERS[0];
    CHAPTERS.forEach((ch) => {
      if (ch.sec <= seconds) c = ch;
    });
    return c;
  }, [seconds, CHAPTERS]);

  useEffect(() => {
    if (tab !== "transcript" || !panelRef.current) return;
    const el = panelRef.current.querySelector(`[data-idx="${currentLineIdx}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentLineIdx, tab]);

  const tabs = [
    { id: "transcript", label: t("playerpage.tab_transcript", "Transkrypt") },
    { id: "chapters", label: t("playerpage.tab_chapters", "Rozdziały") },
    { id: "notes", label: t("playerpage.tab_notes", "Notatki") },
  ];

  return (
    <div className="grid min-h-screen grid-cols-1 bg-bg-0 pt-[88px] lg:grid-cols-[1fr_460px] lg:pt-0">
      <div className="relative min-h-[56vh] overflow-hidden bg-bg-1 sm:min-h-[64vh] lg:min-h-screen">
        <div className="absolute inset-0">
          <img
            src="/images/monster.webp"
            alt=""
            decoding="async"
            className="h-full w-full animate-scale-pulse object-cover object-[center_35%] [filter:contrast(1.1)_saturate(0.9)_brightness(0.7)]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 60%, transparent, rgba(5,6,8,0.6) 80%, rgba(5,6,8,0.9)), linear-gradient(180deg, rgba(5,6,8,0.5) 0%, transparent 30%, rgba(5,6,8,0.6) 100%)",
            }}
          />
        </div>

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 lg:px-10 lg:py-7">
          <Link
            to="/episode/12"
            className="inline-flex min-h-[44px] items-center gap-2 border border-line bg-black/40 px-3 py-2.5 font-mono text-[11px] uppercase tracking-mono text-ink-1 backdrop-blur transition-colors hover:border-red hover:text-ink-0 sm:gap-3 sm:px-3.5"
          >
            <span className="rotate-180">
              <Arrow size={10} />
            </span>
            {t("playerpage.exit", "Wyjdź z playera")}
          </Link>
          <div className="hidden items-center gap-6 font-mono text-[10px] uppercase tracking-mono text-ink-2 lg:flex">
            <span className="flex items-center gap-2 before:h-1.5 before:w-1.5 before:animate-obskura-pulse before:rounded-full before:bg-[#00ff88] before:shadow-[0_0_8px_#00ff88] before:content-['']">
              {t("playerpage.session", "Sesja aktywna · 8 712 osób")}
            </span>
            <span>{t("playerpage.audio_meta", "Binaural 3D · 320 kbps")}</span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 z-[5] w-full -translate-x-1/2 -translate-y-1/2 px-4 text-center sm:px-5 lg:px-10">
          <div className="mb-3 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-mono text-red before:h-px before:w-5 before:bg-red before:shadow-[0_0_6px_#ff2a2a] before:content-[''] after:h-px after:w-5 after:bg-red after:shadow-[0_0_6px_#ff2a2a] after:content-[''] sm:mb-4 sm:gap-3 sm:text-[11px] sm:before:w-8 sm:after:w-8">
            {t("player.ep_num", "Sezon 03 · Odcinek 12 · Finał")}
          </div>
          <h1 className="mb-3 font-serif text-[clamp(28px,6vw,80px)] font-medium leading-[0.95] tracking-[-0.02em] sm:mb-4 sm:text-[clamp(36px,5vw,80px)]">
            {t("playerpage.title_p1", "Mgła nad")} <em className="italic text-ink-1">{t("playerpage.title_em", "Wisłoujściem")}</em>
          </h1>
          {currentCh && (
            <div className="mt-4 font-serif text-[16px] italic text-ink-1 sm:mt-8 sm:text-[22px]">
              <span className="mr-2 font-mono text-[10px] not-italic uppercase tracking-mono text-red sm:mr-3 sm:text-[11px]">
                {`// CHAPTER ${String(currentCh.n).padStart(2, "0")} ·`}
              </span>
              {t(`playerpage.${currentCh.key}`, currentCh.t)}
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(0deg,rgba(5,6,8,0.92),transparent)] px-4 pb-6 pt-16 sm:px-5 sm:pb-8 sm:pt-20 lg:px-10 lg:pb-10">
          <Visualizer playing={playing} frame={frame} />

          <div className="mb-5 flex items-center gap-2 sm:mb-6 sm:gap-4">
            <span className="min-w-[40px] font-mono text-[11px] tracking-ui text-red sm:min-w-[44px] sm:text-[12px] lg:min-w-[56px] lg:text-[13px]">{fmt(seconds)}</span>
            <WaveformBar progress={progress} onSeek={(p) => seek(p)} className="min-w-0 flex-1" />
            <span className="min-w-[40px] text-right font-mono text-[11px] tracking-ui text-ink-1 sm:min-w-[44px] sm:text-[12px] lg:min-w-[56px] lg:text-[13px]">
              {fmt(Math.max(0, total - seconds))}
            </span>
          </div>

          <div className="flex items-center justify-center gap-5 sm:gap-7">
            <button
              type="button"
              aria-label={t("playerpage.prev_chapter", "Poprzedni rozdział")}
              onClick={() => {
                const prevCh = [...CHAPTERS].reverse().find((c) => c.sec < seconds - 5);
                if (prevCh) seekToSeconds(prevCh.sec);
              }}
              className="grid min-h-[44px] min-w-[44px] place-items-center p-2 text-ink-1 transition-colors hover:text-ink-0"
            >
              <Prev size={20} />
            </button>
            <button
              type="button"
              aria-label={t("playerpage.back15", "Cofnij 15 sekund")}
              onClick={() => seekToSeconds(Math.max(0, seconds - 15))}
              className="grid min-h-[44px] min-w-[44px] place-items-center p-2 font-mono text-[11px] font-semibold tracking-ui text-ink-1 transition-colors hover:text-ink-0"
            >
              −15
            </button>
            <button
              type="button"
              aria-label={playing ? t("playerpage.pause", "Pauza") : t("playerpage.play", "Odtwórz")}
              onClick={() => toggle()}
              className="grid h-[60px] w-[60px] place-items-center rounded-full bg-ink-0 text-bg-0 shadow-[0_0_0_1px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:bg-red hover:text-white hover:shadow-[0_0_0_1px_rgba(255,42,42,0.4),0_0_32px_rgba(255,42,42,0.4)] sm:h-[72px] sm:w-[72px]"
            >
              {playing ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button
              type="button"
              aria-label={t("playerpage.fwd30", "Do przodu 30 sekund")}
              onClick={() => seekToSeconds(Math.min(total, seconds + 30))}
              className="grid min-h-[44px] min-w-[44px] place-items-center p-2 font-mono text-[11px] font-semibold tracking-ui text-ink-1 transition-colors hover:text-ink-0"
            >
              +30
            </button>
            <button
              type="button"
              aria-label={t("playerpage.next_chapter", "Następny rozdział")}
              onClick={() => {
                const nextCh = CHAPTERS.find((c) => c.sec > seconds);
                if (nextCh) seekToSeconds(nextCh.sec);
              }}
              className="grid min-h-[44px] min-w-[44px] place-items-center p-2 text-ink-1 transition-colors hover:text-ink-0"
            >
              <Next size={20} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 sm:mt-6 sm:gap-4 sm:pt-5">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`inline-flex min-h-[44px] items-center border px-3 py-2 font-mono text-[11px] tracking-ui transition-colors sm:px-3.5 ${
                    speed === s ? "border-red bg-red text-black" : "border-line bg-black/40 text-ink-1 hover:border-red hover:text-red"
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <button type="button" aria-label={t("playerpage.save", "Zapisz")} className="grid h-11 w-11 place-items-center border border-line text-ink-1 transition-colors hover:border-red hover:text-red">
                <Heart />
              </button>
              <button type="button" aria-label={t("playerpage.share", "Udostępnij")} className="grid h-11 w-11 place-items-center border border-line text-ink-1 transition-colors hover:border-red hover:text-red">
                <Share />
              </button>
              <span className="border border-blue/40 bg-black/40 px-3 py-2 font-mono text-[10px] uppercase tracking-mono text-blue">
                {t("playerpage.quality", "FLAC · Lossless")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col border-t border-line bg-[rgba(10,13,18,0.95)] backdrop-blur-xl lg:max-h-screen lg:border-l lg:border-t-0">
        <div className="flex border-b border-line">
          {tabs.map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => setTab(tb.id)}
              className={`flex-1 min-h-[44px] border-b-2 px-3 py-[14px] font-mono text-[11px] uppercase tracking-mono transition-colors sm:px-4 sm:py-[18px] ${
                tab === tb.id ? "border-red text-red" : "border-transparent text-ink-2 hover:text-ink-0"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        <div ref={panelRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          {tab === "transcript" && TRANSCRIPT.length === 0 && (
            <div className="border border-dashed border-line bg-black/20 px-6 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3">
                {t("playerpage.transcript_empty", "Transkrypt dla tego odcinka pojawi się wkrótce.")}
              </p>
            </div>
          )}
          {tab === "transcript" &&
            TRANSCRIPT.map((line, i) => {
              if (line.marker) {
                return (
                  <div
                    key={line.key}
                    data-idx={i}
                    className={`my-6 border-l-2 px-4 py-3 font-mono text-[10px] uppercase tracking-mono ${
                      line.marker === "sfx" ? "border-blue bg-blue/[0.04] text-blue" : "border-red bg-red/[0.05] text-red"
                    }`}
                  >
                    {line.text}
                  </div>
                );
              }
              const past = line.sec < seconds - 12;
              const current = i === currentLineIdx;
              return (
                <button
                  key={line.key}
                  type="button"
                  data-idx={i}
                  onClick={() => seekToSeconds(line.sec)}
                  className={`mb-[22px] grid w-full grid-cols-[56px_1fr] gap-4 text-left transition-opacity hover:opacity-100 ${
                    current || past ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span className={`pt-0.5 font-mono text-[11px] tracking-ui ${current ? "text-red" : "text-ink-2"}`}>
                    {fmt(line.sec)}
                  </span>
                  <span>
                    <span className={`mb-1 block font-mono text-[9px] uppercase tracking-mono ${past ? "text-ink-3" : "text-red"}`}>
                      {line.speaker}
                    </span>
                    <span
                      className={
                        current
                          ? "block font-serif text-[18px] italic leading-[1.4] text-ink-0"
                          : past
                            ? "block text-[15px] font-light leading-relaxed text-ink-2"
                            : "block text-[15px] font-light leading-relaxed text-ink-1"
                      }
                    >
                      {line.text}
                    </span>
                  </span>
                </button>
              );
            })}

          {tab === "chapters" && CHAPTERS.length === 0 && (
            <div className="border border-dashed border-line bg-black/20 px-6 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-mono text-ink-3">
                {t("playerpage.chapters_empty", "Rozdziały dla tego odcinka pojawią się wkrótce.")}
              </p>
            </div>
          )}
          {tab === "chapters" && CHAPTERS.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {CHAPTERS.map((c) => {
                const isActive = currentCh?.n === c.n;
                return (
                  <button
                    key={c.n}
                    type="button"
                    onClick={() => seekToSeconds(c.sec)}
                    className={`grid grid-cols-[1fr_auto] items-center gap-2.5 border px-4 py-3.5 text-left transition-colors ${
                      isActive
                        ? "border-red bg-red/[0.06]"
                        : "border-line bg-bg-2/50 hover:border-red/30 hover:bg-bg-2/80"
                    }`}
                  >
                    <span>
                      <span className={`mb-1 block font-mono text-[10px] tracking-mono ${isActive ? "text-red" : "text-ink-2"}`}>
                        {`// CHAPTER ${String(c.n).padStart(2, "0")}`}
                      </span>
                      <span className="block font-serif text-[17px] italic leading-tight text-ink-0">
                        {t(`playerpage.${c.key}`, c.t)}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-ink-1">{c.time}</span>
                  </button>
                );
              })}
            </div>
          )}

          {tab === "notes" && (
            <div className="flex flex-col gap-3">
              {[
                { time: "19:48", text: t("playerpage.note1", "Hydrofony robione w lutym 2026 w Gdańsku — Piotr nagrywał z mola w nocy przez 4 godziny.") },
                { time: "27:14", text: t("playerpage.note2", "Mgła w mixie = nagranie z autentycznej mgły + 8 warstw szumu różowego processed przez convolution reverb z katedry w Oliwie.") },
                { time: "31:48", text: t("playerpage.note3", "KLUCZOWY MOMENT — Katarzyna nagrywała oddech w basenie. 45 sekund. Wyszła sina.") },
              ].map((n) => (
                <div key={n.time} className="border border-line bg-bg-2/50 px-4 py-3.5">
                  <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-mono text-ink-2">
                    <span className="text-red">@ {n.time}</span>
                    <List size={12} />
                  </div>
                  <p className="text-[13px] font-light leading-relaxed text-ink-1">{n.text}</p>
                </div>
              ))}
              <button
                type="button"
                className="w-full border border-dashed border-line bg-black/30 p-3 font-mono text-[11px] uppercase tracking-mono text-ink-2 transition-colors hover:border-red hover:text-red"
              >
                {t("playerpage.add_note", "+ Dodaj notatkę w")} {fmt(seconds)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
