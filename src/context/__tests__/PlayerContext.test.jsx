import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PlayerProvider, usePlayer } from '../PlayerContext';

// jsdom nie implementuje HTMLMediaElement.play / pause — mockujemy globalnie.
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.HTMLMediaElement.prototype.load = vi.fn();
});

beforeEach(() => {
  localStorage.clear();
});

const TRACK = {
  id: 'track-1',
  src: '/audio/test.mp3',
  title: 'Test Track',
};

// Wieloelementowa kolejka do testów next/prev/playQueue.
const TRACKS = [
  { id: '11', src: '/audio/11.mp3', title: 'Eleven' },
  { id: '12', src: '/audio/12.mp3', title: 'Twelve' },
  { id: '13', src: '/audio/13.mp3', title: 'Thirteen' },
];

function PlayerConsumer() {
  const { current, playing, playTrack, toggle } = usePlayer();
  return (
    <div>
      <div data-testid="current">{current ? current.id : 'null'}</div>
      <div data-testid="playing">{playing ? 'yes' : 'no'}</div>
      <button type="button" onClick={() => playTrack(TRACK)} data-testid="play-btn">
        play
      </button>
      <button type="button" onClick={toggle} data-testid="toggle-btn">
        toggle
      </button>
    </div>
  );
}

// Rozszerzony consumer — ekspozycja queue/hasNext/hasPrev/isFav/sleepRemaining
// i operacji potrzebnych do nowych testów.
function FullPlayerConsumer() {
  const {
    current,
    playing,
    queue,
    hasNext,
    hasPrev,
    sleepRemaining,
    playQueue,
    next,
    prev,
    toggleFavorite,
    isFavorite,
    setSleepTimer,
    stop,
  } = usePlayer();
  return (
    <div>
      <div data-testid="current">{current ? current.id : 'null'}</div>
      <div data-testid="playing">{playing ? 'yes' : 'no'}</div>
      <div data-testid="queue-length">{queue.length}</div>
      <div data-testid="has-next">{hasNext ? 'yes' : 'no'}</div>
      <div data-testid="has-prev">{hasPrev ? 'yes' : 'no'}</div>
      <div data-testid="is-fav-12">{isFavorite('12') ? 'yes' : 'no'}</div>
      <div data-testid="sleep-remaining">{sleepRemaining}</div>
      <button
        type="button"
        data-testid="play-queue-12"
        onClick={() => playQueue(TRACKS, '12')}
      >
        play queue from 12
      </button>
      <button type="button" data-testid="next-btn" onClick={next}>
        next
      </button>
      <button type="button" data-testid="prev-btn" onClick={prev}>
        prev
      </button>
      <button
        type="button"
        data-testid="fav-toggle-12"
        onClick={() => toggleFavorite('12')}
      >
        fav 12
      </button>
      <button
        type="button"
        data-testid="sleep-15"
        onClick={() => setSleepTimer(15)}
      >
        sleep 15
      </button>
      <button type="button" data-testid="stop-btn" onClick={stop}>
        stop
      </button>
    </div>
  );
}

describe('PlayerContext', () => {
  it('current === null na start (przed jakąkolwiek interakcją)', () => {
    render(
      <PlayerProvider>
        <PlayerConsumer />
      </PlayerProvider>,
    );
    expect(screen.getByTestId('current')).toHaveTextContent('null');
    expect(screen.getByTestId('playing')).toHaveTextContent('no');
  });

  it('playTrack ustawia current', () => {
    render(
      <PlayerProvider>
        <PlayerConsumer />
      </PlayerProvider>,
    );
    act(() => {
      screen.getByTestId('play-btn').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('track-1');
    expect(screen.getByTestId('playing')).toHaveTextContent('yes');
  });

  it('toggle przełącza playing', () => {
    render(
      <PlayerProvider>
        <PlayerConsumer />
      </PlayerProvider>,
    );
    // potrzebujemy najpierw bieżącej ścieżki — toggle bez current to no-op
    act(() => {
      screen.getByTestId('play-btn').click();
    });
    expect(screen.getByTestId('playing')).toHaveTextContent('yes');

    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    expect(screen.getByTestId('playing')).toHaveTextContent('no');

    act(() => {
      screen.getByTestId('toggle-btn').click();
    });
    expect(screen.getByTestId('playing')).toHaveTextContent('yes');
  });
});

describe('PlayerContext — queue, fav, sleep', () => {
  it('playQueue(TRACKS, "12") ustawia kolejkę i startuje od "12"; hasNext=true', () => {
    render(
      <PlayerProvider>
        <FullPlayerConsumer />
      </PlayerProvider>,
    );
    act(() => {
      screen.getByTestId('play-queue-12').click();
    });
    expect(screen.getByTestId('queue-length')).toHaveTextContent('3');
    expect(screen.getByTestId('current')).toHaveTextContent('12');
    expect(screen.getByTestId('playing')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-next')).toHaveTextContent('yes');
    expect(screen.getByTestId('has-prev')).toHaveTextContent('yes');
  });

  it('next() przeskakuje do kolejnej ścieżki w queue', () => {
    render(
      <PlayerProvider>
        <FullPlayerConsumer />
      </PlayerProvider>,
    );
    act(() => {
      screen.getByTestId('play-queue-12').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('12');

    act(() => {
      screen.getByTestId('next-btn').click();
    });
    // currentIndex+1 → '13'
    expect(screen.getByTestId('current')).toHaveTextContent('13');
    // już ostatnia w kolejce
    expect(screen.getByTestId('has-next')).toHaveTextContent('no');
  });

  it('prev() cofa do poprzedniej ścieżki gdy currentTime < 3; restart do 0 gdy currentTime > 3', () => {
    const { container } = render(
      <PlayerProvider>
        <FullPlayerConsumer />
      </PlayerProvider>,
    );
    act(() => {
      screen.getByTestId('play-queue-12').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('12');

    const audio = container.querySelector('audio');
    expect(audio).toBeTruthy();

    // Przypadek 1: currentTime < 3 → cofnij do poprzedniej ścieżki ('11').
    // jsdom pozwala ustawić currentTime jako zwykłą właściwość.
    audio.currentTime = 1;
    act(() => {
      screen.getByTestId('prev-btn').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('11');

    // Wróćmy do '12' żeby przetestować drugi przypadek.
    act(() => {
      screen.getByTestId('play-queue-12').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('12');

    // Przypadek 2: currentTime > 3 → restart bieżącej ścieżki (currentTime = 0).
    audio.currentTime = 42;
    act(() => {
      screen.getByTestId('prev-btn').click();
    });
    // current się nie zmienia — to nadal '12'.
    expect(screen.getByTestId('current')).toHaveTextContent('12');
    expect(audio.currentTime).toBe(0);
  });

  it('toggleFavorite("12") dodaje gdy brak, usuwa gdy jest; isFavorite odzwierciedla stan', () => {
    render(
      <PlayerProvider>
        <FullPlayerConsumer />
      </PlayerProvider>,
    );
    // Domyślnie nic nie jest ulubione.
    expect(screen.getByTestId('is-fav-12')).toHaveTextContent('no');

    act(() => {
      screen.getByTestId('fav-toggle-12').click();
    });
    expect(screen.getByTestId('is-fav-12')).toHaveTextContent('yes');

    act(() => {
      screen.getByTestId('fav-toggle-12').click();
    });
    expect(screen.getByTestId('is-fav-12')).toHaveTextContent('no');
  });

  it('setSleepTimer(15) ustawia sleepRemaining > 0; stop() resetuje current/playing/queue', () => {
    render(
      <PlayerProvider>
        <FullPlayerConsumer />
      </PlayerProvider>,
    );
    act(() => {
      screen.getByTestId('play-queue-12').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('12');
    expect(screen.getByTestId('playing')).toHaveTextContent('yes');

    // setSleepTimer(15) → 15 minut × 60 s = 900 s (od ręki, bez czekania na interwał).
    act(() => {
      screen.getByTestId('sleep-15').click();
    });
    const remaining = Number(screen.getByTestId('sleep-remaining').textContent);
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBe(900);

    // stop() — pełny reset.
    act(() => {
      screen.getByTestId('stop-btn').click();
    });
    expect(screen.getByTestId('current')).toHaveTextContent('null');
    expect(screen.getByTestId('playing')).toHaveTextContent('no');
    expect(screen.getByTestId('queue-length')).toHaveTextContent('0');
    expect(screen.getByTestId('sleep-remaining')).toHaveTextContent('0');
  });
});
