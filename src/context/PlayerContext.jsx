import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

const FAV_KEY = "obskura_favorites";
const STATE_KEY = "obskura_player_state";

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

// Zapisany stan odtwarzania (kontynuuj słuchanie).
function loadSavedState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATE_KEY));
    if (raw && Array.isArray(raw.queue) && raw.queue.length) return raw;
  } catch {
    /* ignore */
  }
  return null;
}

// Globalny stan audio — jeden <audio> żyjący ponad routerem, grający nieprzerwanie
// przy zmianie tras. Kolejka, ulubione, resume i sleep timer (localStorage).
export function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [saved] = useState(loadSavedState);
  // Pozycja do odtworzenia po restoreu — zastosowana raz, gdy metadane się załadują.
  const pendingResume = useRef(saved?.currentTime || 0);

  const [queue, setQueue] = useState(saved?.queue || []);
  const [currentId, setCurrentId] = useState(saved?.currentId || null);
  const [playing, setPlaying] = useState(false); // nigdy auto-play (polityka przeglądarek)
  const [currentTime, setCurrentTime] = useState(saved?.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [favorites, setFavorites] = useState(loadFavorites);
  const [sleepEndsAt, setSleepEndsAt] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(0);

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
    if (!pendingResume.current) setCurrentTime(0);
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

  // Persist stanu odtwarzania (resume): od razu przy zmianie ścieżki/kolejki
  // oraz co 5 s w trakcie grania.
  useEffect(() => {
    if (!currentId) {
      localStorage.removeItem(STATE_KEY);
      return undefined;
    }
    const save = () => {
      localStorage.setItem(
        STATE_KEY,
        JSON.stringify({ queue, currentId, currentTime: audioRef.current?.currentTime || 0 }),
      );
    };
    save();
    const id = setInterval(save, 5000);
    return () => clearInterval(id);
  }, [queue, currentId]);

  // Sleep timer — odlicza w interwale i pauzuje po upływie czasu.
  // (setState tylko w callbacku interwału, nie synchronicznie w efekcie).
  useEffect(() => {
    if (!sleepEndsAt) return undefined;
    const id = setInterval(() => {
      const rem = Math.max(0, Math.round((sleepEndsAt - Date.now()) / 1000));
      setSleepRemaining(rem);
      if (rem <= 0) {
        setPlaying(false);
        setSleepEndsAt(null);
        setSleepRemaining(0);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sleepEndsAt]);

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
    pendingResume.current = 0;
    setQueue((q) => (q.some((t) => t.id === track.id) ? q : [...q, track]));
    setCurrentId(track.id);
    setPlaying(true);
  }, []);

  // Odtwórz całą kolejkę od wskazanej ścieżki.
  const playQueue = useCallback((tracks, startId) => {
    pendingResume.current = 0;
    setQueue(tracks);
    setCurrentId(startId ?? tracks[0]?.id ?? null);
    setPlaying(true);
  }, []);

  // Skok do ścieżki już obecnej w kolejce.
  const jumpTo = useCallback((id) => {
    pendingResume.current = 0;
    setCurrentId(id);
    setPlaying(true);
  }, []);

  // Dodaj na koniec kolejki (bez przerywania bieżącej).
  const addToQueue = useCallback((track) => {
    setQueue((q) => (q.some((t) => t.id === track.id) ? q : [...q, track]));
  }, []);

  const removeFromQueue = useCallback(
    (id) => {
      const idx = queue.findIndex((t) => t.id === id);
      const nq = queue.filter((t) => t.id !== id);
      setQueue(nq);
      if (id === currentId) {
        const nextTrack = nq[idx] || nq[idx - 1] || null;
        setCurrentId(nextTrack?.id ?? null);
        if (!nextTrack) setPlaying(false);
      }
    },
    [queue, currentId],
  );

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

  // minutes=0 → wyłącz timer. Początkową wartość odliczania ustawiamy tu (nie w efekcie).
  const setSleepTimer = useCallback((minutes) => {
    if (minutes) {
      setSleepEndsAt(Date.now() + minutes * 60000);
      setSleepRemaining(minutes * 60);
    } else {
      setSleepEndsAt(null);
      setSleepRemaining(0);
    }
  }, []);

  const stop = useCallback(() => {
    pendingResume.current = 0;
    setPlaying(false);
    setCurrentId(null);
    setQueue([]);
    setSleepEndsAt(null);
    setSleepRemaining(0);
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((favs) => (favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id]));
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  // Po załadowaniu metadanych: przywróć zapisaną pozycję (raz).
  const onLoadedMetadata = (e) => {
    setDuration(e.currentTarget.duration || 0);
    if (pendingResume.current > 0) {
      e.currentTarget.currentTime = pendingResume.current;
      setCurrentTime(pendingResume.current);
      pendingResume.current = 0;
    }
  };

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
      sleepRemaining,
      sleepActive: !!sleepEndsAt,
      playTrack,
      playQueue,
      jumpTo,
      addToQueue,
      removeFromQueue,
      toggle,
      next,
      prev,
      seek,
      setVolume,
      setSleepTimer,
      stop,
      toggleFavorite,
      isFavorite,
    }),
    [queue, current, currentIndex, playing, currentTime, duration, volume, favorites, hasNext, hasPrev, sleepRemaining, sleepEndsAt, playTrack, playQueue, jumpTo, addToQueue, removeFromQueue, toggle, next, prev, seek, setVolume, setSleepTimer, stop, toggleFavorite, isFavorite],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => (hasNext ? next() : setPlaying(false))}
      />
    </PlayerContext.Provider>
  );
}

PlayerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
