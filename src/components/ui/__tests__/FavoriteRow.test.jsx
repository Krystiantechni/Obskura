import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteRow from '../FavoriteRow';
import { usePlayer } from '../../../context/PlayerContext';

// Mockujemy PlayerContext — testujemy tylko logikę FavoriteRow w izolacji
// (interakcje wiersza, heart, klawiatura). Provider nas nie interesuje.
vi.mock('../../../context/PlayerContext', () => ({
  usePlayer: vi.fn(),
}));

const TRACK = {
  id: 'ep-12',
  num: '12',
  title: 'Mgła nad',
  em: 'Wisłoujściem',
  meta: '47:12 · 2026',
  cover: '/images/monster.webp',
};

function setPlayer({ current = null, playing = false } = {}) {
  const playTrack = vi.fn();
  const toggle = vi.fn();
  const toggleFavorite = vi.fn();
  usePlayer.mockReturnValue({
    current,
    playing,
    playTrack,
    toggle,
    toggleFavorite,
  });
  return { playTrack, toggle, toggleFavorite };
}

describe('FavoriteRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderuje title, em (italic) i meta z tracka', () => {
    setPlayer();
    render(<FavoriteRow track={TRACK} />);

    expect(screen.getByText('Mgła nad', { exact: false })).toBeInTheDocument();
    const em = screen.getByText('Wisłoujściem');
    expect(em.tagName.toLowerCase()).toBe('em');
    expect(em).toHaveClass('italic');
    expect(screen.getByText(TRACK.meta)).toBeInTheDocument();
  });

  it('klik wiersza wywołuje playTrack(track) gdy current === null', async () => {
    const { playTrack, toggle } = setPlayer({ current: null });
    render(<FavoriteRow track={TRACK} />);

    // Wiersz to <div role="button"> bez aria-label — filtrujemy spośród wszystkich.
    const rowEl = screen.getAllByRole('button').find((b) => b.tagName.toLowerCase() === 'div');
    await userEvent.click(rowEl);

    expect(playTrack).toHaveBeenCalledTimes(1);
    expect(playTrack).toHaveBeenCalledWith(TRACK);
    expect(toggle).not.toHaveBeenCalled();
  });

  it('klik wiersza gdy isCurrent=true wywołuje toggle()', async () => {
    const { playTrack, toggle } = setPlayer({
      current: { id: TRACK.id },
      playing: true,
    });
    render(<FavoriteRow track={TRACK} />);

    const rowEl = screen.getAllByRole('button').find((b) => b.tagName.toLowerCase() === 'div');
    await userEvent.click(rowEl);

    expect(toggle).toHaveBeenCalledTimes(1);
    expect(playTrack).not.toHaveBeenCalled();
  });

  it('klik heart button wywołuje toggleFavorite(track.id) i NIE wywołuje play (stopPropagation)', async () => {
    const { playTrack, toggle, toggleFavorite } = setPlayer({ current: null });
    render(<FavoriteRow track={TRACK} />);

    const heart = screen.getByRole('button', { name: /Usuń .* z ulubionych/i });
    await userEvent.click(heart);

    expect(toggleFavorite).toHaveBeenCalledTimes(1);
    expect(toggleFavorite).toHaveBeenCalledWith(TRACK.id);
    expect(playTrack).not.toHaveBeenCalled();
    expect(toggle).not.toHaveBeenCalled();
  });

  it('keyboard Enter na wierszu wywołuje play (playTrack gdy nie-current)', async () => {
    const { playTrack } = setPlayer({ current: null });
    render(<FavoriteRow track={TRACK} />);

    const rowEl = screen.getAllByRole('button').find((b) => b.tagName.toLowerCase() === 'div');
    rowEl.focus();
    await userEvent.keyboard('{Enter}');

    expect(playTrack).toHaveBeenCalledTimes(1);
    expect(playTrack).toHaveBeenCalledWith(TRACK);
  });

  it('gdy isPlaying (current.id === track.id && playing) pokazuje Pause icon, inaczej Play', () => {
    // Najpierw: nie-current → aria-label "Odtwórz ..."
    setPlayer({ current: null });
    const { unmount } = render(<FavoriteRow track={TRACK} />);
    expect(
      screen.getByRole('button', { name: new RegExp(`Odtwórz ${TRACK.title}`, 'i') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: new RegExp(`Pauza ${TRACK.title}`, 'i') }),
    ).not.toBeInTheDocument();
    unmount();

    // Teraz: current i playing=true → aria-label "Pauza ..."
    setPlayer({ current: { id: TRACK.id }, playing: true });
    render(<FavoriteRow track={TRACK} />);
    expect(
      screen.getByRole('button', { name: new RegExp(`Pauza ${TRACK.title}`, 'i') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: new RegExp(`Odtwórz ${TRACK.title}`, 'i') }),
    ).not.toBeInTheDocument();
  });
});
