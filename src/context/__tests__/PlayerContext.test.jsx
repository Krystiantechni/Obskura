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
