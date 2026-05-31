import PropTypes from "prop-types";

// Holograficzny nagłówek hero: czerwony neon + stała chromatic aberration (holo),
// przejazd sheen, pionowa linia skanu HUD i okazjonalny, delikatny glitch RGB-split.
export default function SciFiText({ text, className = "" }) {
  return (
    <span className={`sci-fi-text relative inline-block ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] -translate-x-[2px] text-red/40"
      >
        {text}
      </span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] translate-x-[2px] text-blue/40"
      >
        {text}
      </span>

      <span className="animate-holo-flicker relative z-[2] block text-red">{text}</span>

      <span
        aria-hidden
        className="animate-holo-scan pointer-events-none absolute inset-x-0 z-[3] h-px bg-blue/60"
      />
    </span>
  );
}

SciFiText.propTypes = {
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
};
