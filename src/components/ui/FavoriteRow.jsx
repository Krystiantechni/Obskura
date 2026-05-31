import { Play, Pause, Heart } from "lucide-react";
import PropTypes from "prop-types";
import { usePlayer } from "../../context/PlayerContext";

// Wiersz ulubionego odcinka — spięty z realnym globalnym playerem (PlayerContext).
// Cały wiersz klikalny → odpala/pauzuje odtwarzanie. Heart toggle = usuń z ulubionych.
function FavoriteRow({ track }) {
  const { current, playing, playTrack, toggle, toggleFavorite } = usePlayer();
  const isCurrent = current?.id === track.id;
  const isPlaying = isCurrent && playing;
  const onPlay = () => (isCurrent ? toggle() : playTrack(track));
  const onRemove = (e) => { e.stopPropagation(); toggleFavorite(track.id); };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPlay(); } }}
      className={`mb-1.5 grid cursor-pointer grid-cols-[56px_1fr_auto] items-center gap-3 border bg-black/20 p-3.5 transition-colors hover:border-red/40 ${isCurrent ? "border-red/60 bg-red/[0.04]" : "border-line"} lg:grid-cols-[56px_1fr_140px_auto]`}
    >
      <div className="relative h-14 w-14 bg-cover bg-center" style={{ backgroundImage: `url('${track.cover}')` }}>
        {isPlaying && <span className="absolute bottom-1 left-1 h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_6px_#ff2a2a]" />}
      </div>
      <div>
        <div className="mb-1 font-mono text-[10px] tracking-mono text-red">★ S03 · E{track.num}{isCurrent ? " · TERAZ" : ""}</div>
        <div className="font-serif text-[17px] leading-tight">
          {track.title} {track.em && <em className="italic text-ink-1">{track.em}</em>}
        </div>
      </div>
      <div className="hidden font-mono text-[11px] uppercase tracking-ui text-ink-2 lg:block">{track.meta}</div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          aria-label={isPlaying ? `Pauza ${track.title}` : `Odtwórz ${track.title}`}
          className="grid h-9 w-9 place-items-center border border-line bg-white/[0.02] text-ink-1 transition-colors hover:border-red hover:text-red"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Usuń ${track.title} z ulubionych`}
          className="grid h-9 w-9 place-items-center border border-red/40 bg-red/[0.06] text-red transition-colors hover:bg-red hover:text-white"
        >
          <Heart size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );
}
FavoriteRow.propTypes = {
  track: PropTypes.shape({
    id: PropTypes.string.isRequired, num: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired, em: PropTypes.string, meta: PropTypes.string,
    cover: PropTypes.string.isRequired,
  }).isRequired,
};

export default FavoriteRow;
