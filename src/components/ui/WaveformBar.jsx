import PropTypes from "prop-types";
import { useMemo } from "react";

// 80 deterministycznych słupków — klikalny progress, aktywny słupek biały, odsłuchane czerwone.
export default function WaveformBar({ progress, onSeek, className = "" }) {
  const bars = useMemo(() => {
    const arr = [];
    let seed = 1337;
    for (let i = 0; i < 80; i++) {
      seed = (seed * 9301 + 49297) % 233280;
      const r = seed / 233280;
      const env = Math.sin((i / 80) * Math.PI) * 0.7 + 0.3;
      arr.push((0.2 + r * 0.8) * env);
    }
    return arr;
  }, []);

  const handleClick = (e) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, x)));
  };

  const currentIdx = Math.floor(progress * bars.length);

  return (
    <div
      className={`flex h-9 cursor-pointer items-center gap-px sm:gap-[2px] ${className}`}
      onClick={handleClick}
    >
      {bars.map((h, i) => {
        const played = i < currentIdx;
        const current = i === currentIdx;
        return (
          <div
            key={i}
            className={[
              "min-w-px flex-1 transition-all duration-300 sm:min-w-[2px]",
              current
                ? "bg-ink-0 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                : played
                  ? "bg-red shadow-[0_0_4px_rgba(255,42,42,0.6)]"
                  : "bg-white/15",
            ].join(" ")}
            style={{ height: `${h * 100}%` }}
          />
        );
      })}
    </div>
  );
}

WaveformBar.propTypes = {
  progress: PropTypes.number.isRequired,
  onSeek: PropTypes.func,
  className: PropTypes.string,
};
