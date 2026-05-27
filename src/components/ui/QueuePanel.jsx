import PropTypes from "prop-types";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "../../context/PlayerContext";
import { Play, Pause } from "./Icons";

// Panel kolejki — wysuwa się nad mini-playerem. Skok do ścieżki / usunięcie z kolejki.
export default function QueuePanel({ open, onClose }) {
  const { queue, current, playing, jumpTo, removeFromQueue, toggle } = usePlayer();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="queue-panel"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-[80px] right-3 z-[81] flex max-h-[min(60vh,460px)] w-[min(420px,calc(100vw-24px))] flex-col border border-white/10 bg-[rgba(10,13,18,0.97)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:right-12"
          role="dialog"
          aria-label="Kolejka odtwarzania"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <span className="font-mono text-[11px] uppercase tracking-mono text-ink-1">
              Kolejka <span className="text-ink-3">· {queue.length}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Zamknij kolejkę"
              className="grid h-7 w-7 place-items-center text-ink-2 transition-colors hover:text-ink-0"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
              </svg>
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto py-2">
            {queue.length === 0 && (
              <li className="px-5 py-8 text-center font-mono text-[11px] uppercase tracking-mono text-ink-3">
                Kolejka pusta
              </li>
            )}
            {queue.map((track, i) => {
              const isCurrent = current?.id === track.id;
              const isPlaying = isCurrent && playing;
              return (
                <li
                  key={track.id}
                  className={`group flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isCurrent ? "bg-red/[0.07]" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => (isCurrent ? toggle() : jumpTo(track.id))}
                    aria-label={isPlaying ? `Pauza: ${track.title}` : `Odtwórz: ${track.title}`}
                    className="relative grid h-10 w-10 flex-shrink-0 place-items-center overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: `url(${track.cover})` }}
                  >
                    <span className="absolute inset-0 bg-black/45 transition-colors group-hover:bg-black/60" />
                    <span className={`relative ${isCurrent ? "text-red" : "text-ink-0"}`}>
                      {isPlaying ? <Pause size={9} /> : <Play size={9} />}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => (isCurrent ? toggle() : jumpTo(track.id))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate font-serif text-[15px] leading-tight text-ink-0">
                      {track.title} {track.em && <em className="italic text-ink-1">{track.em}</em>}
                    </span>
                    <span className="block truncate font-mono text-[9px] uppercase tracking-mono text-ink-2">
                      {String(i + 1).padStart(2, "0")} · {track.meta}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromQueue(track.id)}
                    aria-label={`Usuń z kolejki: ${track.title}`}
                    className="grid h-7 w-7 flex-shrink-0 place-items-center text-ink-3 opacity-0 transition-all hover:text-red focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

QueuePanel.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
