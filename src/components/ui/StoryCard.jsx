import PropTypes from "prop-types";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Pause } from "./Icons";
import { usePlayer } from "../../context/PlayerContext";
import { TRACKS, getTrack } from "../../data/tracks";

// Karta historii 3:4 — obraz z grayscale→kolor na hover, wideo (opcjonalne) play na mouseenter.
export default function StoryCard({ num, tag, tagAccent = "red", title, titleEm, duration, rating, image, video, to = "/odcinek/1" }) {
  const videoRef = useRef(null);
  const { current, playing, playQueue, toggle } = usePlayer();

  const id = to.split("/").pop();
  const track = getTrack(id);
  const isCurrent = track && current?.id === track.id;
  const isPlaying = isCurrent && playing;

  const onPlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!track) return;
    if (isCurrent) toggle();
    else playQueue(TRACKS, track.id);
  };

  const onEnter = () => {
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };
  const onLeave = () => {
    const v = videoRef.current;
    if (v) v.pause();
  };

  const tagCls =
    tagAccent === "blue"
      ? "border-blue/40 bg-blue/10 text-blue"
      : "border-red/40 bg-red/15 text-red";

  return (
    <Link
      to={to}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{ contain: "layout style paint" }}
      className="group relative block aspect-[3/4] overflow-hidden bg-bg-1 transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Obraz */}
      <div
        className="absolute inset-0 bg-cover bg-center brightness-[0.8] grayscale-[0.4] transition-all duration-500 group-hover:scale-105 group-hover:brightness-100 group-hover:grayscale-0"
        style={{ backgroundImage: `url(${image})` }}
      />
      {/* Wideo */}
      {video && (
        <video
          ref={videoRef}
          src={video}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 z-[1] h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />
      )}
      {/* Gradient mask */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-transparent via-transparent to-bg-0/95" />

      {/* Numer */}
      <div className="absolute left-4 top-4 z-[3] bg-black/40 px-2 py-1 font-mono text-[10px] tracking-mono text-ink-1 backdrop-blur-sm">
        // {num}
      </div>

      {/* Motion indicator (wideo) */}
      {video && (
        <span className="absolute right-4 top-4 z-[4] grid h-7 w-7 animate-obskura-pulse-fast place-items-center rounded-full border border-red/40 bg-black/60 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
        </span>
      )}

      {/* Play — realne sterowanie globalnym playerem */}
      {track && (
        <button
          type="button"
          onClick={onPlay}
          aria-label={isPlaying ? `Pauza: ${title}` : `Odtwórz: ${title}`}
          className={`absolute right-4 top-4 z-[5] grid h-10 w-10 place-items-center border backdrop-blur-sm transition-all duration-200 ${
            isCurrent
              ? "border-red bg-red text-white opacity-100"
              : "translate-y-[-4px] border-white/15 bg-black/60 text-ink-0 opacity-0 hover:!bg-red hover:!border-red group-hover:translate-y-0 group-hover:opacity-100"
          }`}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
        </button>
      )}

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 z-[3] p-6">
        <span className={`mb-3 inline-block border px-2.5 py-1 font-mono text-[9px] uppercase tracking-mono ${tagCls}`}>
          {tag}
        </span>
        <h3 className="mb-2 font-serif text-2xl font-medium leading-[1.05] text-ink-0">
          {title} {titleEm && <em className="italic text-ink-1">{titleEm}</em>}
        </h3>
        <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
          <span>{duration}</span>
          <span className="text-red">{rating}</span>
        </div>
      </div>
    </Link>
  );
}

StoryCard.propTypes = {
  num: PropTypes.string.isRequired,
  tag: PropTypes.string.isRequired,
  tagAccent: PropTypes.oneOf(["red", "blue"]),
  title: PropTypes.string.isRequired,
  titleEm: PropTypes.string,
  duration: PropTypes.string.isRequired,
  rating: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  video: PropTypes.string,
  to: PropTypes.string,
};
