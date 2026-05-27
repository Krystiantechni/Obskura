import PropTypes from "prop-types";

// Holograficzny nagłówek hero: czerwony neon + stała chromatic aberration (holo),
// przejazd sheen, pionowa linia skanu HUD i okazjonalny, delikatny glitch RGB-split.
export default function SciFiText({ text, className = "" }) {
  return (
    <span className={`sci-fi-text relative inline-block ${className}`}>
      {/* Chromatic aberration — stałe, subtelne ghosty (efekt holo, nie glitch) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] -translate-x-[2px] text-red/30 mix-blend-screen"
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] translate-x-[2px] text-blue/30 mix-blend-screen"
      >
        {text}
      </span>

      {/* Glitch burst — rzadki (raz na ~6s), delikatny RGB-split */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] animate-glitch-a text-red"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)" }}
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] animate-glitch-b text-blue mix-blend-screen"
        style={{ clipPath: "polygon(0 55%, 100% 55%, 100% 100%, 0 100%)" }}
      >
        {text}
      </span>

      {/* Główny tekst + flicker CRT */}
      <span className="animate-holo-flicker relative z-[2] block text-red">{text}</span>

      {/* Holograficzny sheen — przejazd światła */}
      <span aria-hidden className="sci-fi-sheen pointer-events-none absolute inset-0 z-[3]" />

      {/* Linia skanu HUD */}
      <span
        aria-hidden
        className="animate-holo-scan pointer-events-none absolute inset-x-0 z-[3] h-px bg-blue/60 mix-blend-screen"
      />
    </span>
  );
}

SciFiText.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};
