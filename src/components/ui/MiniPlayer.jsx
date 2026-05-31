import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "../../context/PlayerContext";
import WaveformBar from "./WaveformBar";
import QueuePanel from "./QueuePanel";
import { Play, Pause, Prev, Next, Heart, HeartFill, Volume, List } from "./Icons";

function fmt(sec) {
  if (!Number.isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SLEEP_OPTIONS = [15, 30, 45, 60];

// Trwały mini-player na dole — gra nieprzerwanie przy zmianie tras.
export default function MiniPlayer() {
  const {
    current, playing, progress, currentTime, duration,
    volume, hasNext, hasPrev, sleepRemaining, sleepActive,
    toggle, next, prev, seek, setVolume, setSleepTimer, stop, toggleFavorite, isFavorite,
  } = usePlayer();

  const [panel, setPanel] = useState(null); // "queue" | "sleep" | null
  const liked = current ? isFavorite(current.id) : false;

  const togglePanel = (name) => setPanel((p) => (p === name ? null : name));

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="mini-player"
          initial={{ y: 96, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 96, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[80] border-t border-white/10 bg-[rgba(10,13,18,0.96)] backdrop-blur-md"
          role="region"
          aria-label="Odtwarzacz"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.5),transparent)]" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/5 lg:hidden">
            <span className="block h-full bg-red shadow-[0_0_6px_#ff2a2a] transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
          </div>

          <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 lg:grid-cols-[minmax(0,260px)_1fr_minmax(0,260px)] lg:gap-6 lg:px-12 lg:py-3.5">
            <div className="flex min-w-0 items-center gap-3.5">
              <div
                className="relative h-12 w-12 flex-shrink-0 overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(${current.cover})`, filter: "contrast(1.05)" }}
              >
                <span className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(255,42,42,0.25), transparent 60%)" }} />
                {playing && (
                  <span className="absolute bottom-1 left-1 h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate font-serif text-[17px] font-medium leading-tight text-ink-0">
                  {current.title} {current.em && <em className="italic text-ink-1">{current.em}</em>}
                </div>
                <div className="truncate font-mono text-[10px] uppercase tracking-mono text-ink-2">{current.meta}</div>
              </div>
            </div>

            <div className="hidden flex-col gap-1.5 lg:flex">
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={prev}
                  disabled={!hasPrev && currentTime < 3}
                  aria-label="Poprzednia"
                  className="grid place-items-center p-1.5 text-ink-1 transition-colors hover:text-ink-0 disabled:opacity-30"
                >
                  <Prev />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  aria-label={playing ? "Pauza" : "Odtwórz"}
                  className="grid h-10 w-10 place-items-center rounded-full bg-ink-0 text-bg-0 transition-all hover:bg-red hover:text-white hover:shadow-[0_0_20px_rgba(255,42,42,0.5)]"
                >
                  {playing ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button
                  type="button"
                  onClick={next}
                  disabled={!hasNext}
                  aria-label="Następna"
                  className="grid place-items-center p-1.5 text-ink-1 transition-colors hover:text-ink-0 disabled:opacity-30"
                >
                  <Next />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="min-w-[42px] font-mono text-[10px] tracking-[0.1em] text-red">{fmt(currentTime)}</span>
                <WaveformBar progress={progress} onSeek={seek} className="flex-1 !h-7" />
                <span className="min-w-[42px] text-right font-mono text-[10px] tracking-[0.1em] text-ink-2">−{fmt(duration - currentTime)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pauza" : "Odtwórz"}
                className="grid h-10 w-10 place-items-center rounded-full bg-ink-0 text-bg-0 transition-all hover:bg-red hover:text-white lg:hidden"
              >
                {playing ? <Pause size={13} /> : <Play size={13} />}
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(current.id)}
                aria-pressed={liked}
                aria-label={liked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
                className={`grid h-9 w-9 place-items-center border transition-colors ${
                  liked ? "border-red text-red" : "border-white/10 text-ink-1 hover:border-red hover:text-red"
                }`}
              >
                {liked ? <HeartFill /> : <Heart />}
              </button>

              <div className="hidden items-center gap-2 lg:flex">
                <Volume />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Głośność"
                  className="h-1 w-20 cursor-pointer accent-red"
                />
              </div>

              <button
                type="button"
                onClick={() => togglePanel("queue")}
                aria-label="Kolejka odtwarzania"
                aria-expanded={panel === "queue"}
                className={`hidden h-9 w-9 place-items-center border transition-colors sm:grid ${
                  panel === "queue" ? "border-red text-red" : "border-white/10 text-ink-1 hover:border-red hover:text-red"
                }`}
              >
                <List />
              </button>

              <div className="relative hidden sm:block">
                <button
                  type="button"
                  onClick={() => togglePanel("sleep")}
                  aria-label="Wyłącznik czasowy"
                  aria-expanded={panel === "sleep"}
                  className={`grid h-9 w-9 place-items-center border transition-colors ${
                    sleepActive || panel === "sleep" ? "border-red text-red" : "border-white/10 text-ink-1 hover:border-red hover:text-red"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                    <path d="M13.5 9.5A5.5 5.5 0 1 1 6.5 2.5a4.5 4.5 0 0 0 7 7Z" />
                  </svg>
                </button>
                {sleepActive && (
                  <span className="pointer-events-none absolute -right-1.5 -top-2 rounded-sm bg-red px-1 font-mono text-[8px] leading-[1.5] text-white">
                    {fmt(sleepRemaining)}
                  </span>
                )}
              </div>

              <Link
                to="/player"
                aria-label="Otwórz pełny odtwarzacz"
                className="hidden h-9 w-9 place-items-center border border-white/10 text-ink-1 transition-colors hover:border-red hover:text-red sm:grid"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3.5 8.5 7 5l3.5 3.5" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={stop}
                aria-label="Zamknij odtwarzacz"
                className="grid h-9 w-9 place-items-center border border-white/10 text-ink-2 transition-colors hover:border-ink-0 hover:text-ink-0"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <QueuePanel open={panel === "queue"} onClose={() => setPanel(null)} />

          <AnimatePresence>
            {panel === "sleep" && (
              <motion.div
                key="sleep-menu"
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 12, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-[80px] right-3 z-[81] w-[200px] border border-white/10 bg-[rgba(10,13,18,0.98)] p-3 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md lg:right-12"
                role="dialog"
                aria-label="Wyłącznik czasowy"
              >
                <div className="mb-2.5 px-1 font-mono text-[10px] uppercase tracking-mono text-ink-2">
                  Wyłącz po
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {SLEEP_OPTIONS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setSleepTimer(m); setPanel(null); }}
                      className="border border-white/10 bg-black/30 py-2 font-mono text-[11px] tracking-ui text-ink-1 transition-colors hover:border-red hover:text-red"
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => { setSleepTimer(0); setPanel(null); }}
                  disabled={!sleepActive}
                  className="mt-1.5 w-full border border-white/10 py-2 font-mono text-[10px] uppercase tracking-mono text-ink-2 transition-colors enabled:hover:border-red enabled:hover:text-red disabled:opacity-40"
                >
                  {sleepActive ? `Wyłącz (${fmt(sleepRemaining)})` : "Timer nieaktywny"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
