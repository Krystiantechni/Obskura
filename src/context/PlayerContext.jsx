import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

const FAV_KEY = "obskura_favorites";

const PlayerContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer musi być użyte wewnątrz <PlayerProvider>");
  return ctx;
}

function loadFavorites() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// Globalny stan audio — jeden <audio> żyjący ponad routerem, grający nieprzerwanie
// przy zmianie tras. Kolejka + ulubione (localStorage).
export function PlayerProvider({ children }) {
  const audioRef = useRef(null);

  const [queue, setQueue] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [favorites, setFavorites] = useState(loadFavorites);

  const current = useMemo(
    () => queue.find((t) => t.id === currentId) || null,
    [queue, currentId],
  );
  const currentIndex = useMemo(
    () => queue.findIndex((t) => t.id === currentId),
    [queue, currentId],
  );
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;
  const hasPrev = currentIndex > 0;

  // Persist ulubionych.
  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites]);

  // Załaduj nowe źródło gdy zmienia się ścieżka.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.src;
    audio.load();
    setCurrentTime(0);
    if (playing) audio.play().catch(() => setPlaying(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // Synchronizacja play/pause.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [playing, current]);

  // Głośność.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const next = useCallback(() => {
    setCurrentId((id) => {
      const i = queue.findIndex((t) => t.id === id);
      return i >= 0 && i < queue.length - 1 ? queue[i + 1].id : id;
    });
  }, [queue]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setCurrentId((id) => {
      const i = queue.findIndex((t) => t.id === id);
      return i > 0 ? queue[i - 1].id : id;
    });
  }, [queue]);

  const toggle = useCallback(() => {
    if (!current) return;
    setPlaying((p) => !p);
  }, [current]);

  // Odtwórz konkretną ścieżkę — dołącz do kolejki jeśli jej nie ma.
  const playTrack = useCallback((track) => {
    setQueue((q) => (q.some((t) => t.id === track.id) ? q : [...q, track]));
    setCurrentId(track.id);
    setPlaying(true);
  }, []);

  // Odtwórz całą kolejkę od wskazanej ścieżki.
  const playQueue = useCallback((tracks, startId) => {
    setQueue(tracks);
    setCurrentId(startId ?? tracks[0]?.id ?? null);
    setPlaying(true);
  }, []);

  const seek = useCallback(
    (frac) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      audio.currentTime = Math.max(0, Math.min(1, frac)) * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration],
  );

  const setVolume = useCallback((v) => setVolumeState(Math.max(0, Math.min(1, v))), []);

  const stop = useCallback(() => {
    setPlaying(false);
    setCurrentId(null);
    setQueue([]);
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((favs) => (favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]));
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const value = useMemo(
    () => ({
      queue,
      current,
      currentIndex,
      playing,
      currentTime,
      duration,
      progress: duration ? currentTime / duration : 0,
      volume,
      favorites,
      hasNext,
      hasPrev,
      playTrack,
      playQueue,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      stop,
      toggleFavorite,
      isFavorite,
    }),
    [queue, current, currentIndex, playing, currentTime, duration, volume, favorites, hasNext, hasPrev, playTrack, playQueue, toggle, next, prev, seek, setVolume, stop, toggleFavorite, isFavorite],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => (hasNext ? next() : setPlaying(false))}
      />
    </PlayerContext.Provider>
  );
}

PlayerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
