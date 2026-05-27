import PropTypes from "prop-types";

// Absolutnie pozycjonowana karta metadanych — mono, glass, lewa krawędź akcentowa.
// Sci-fi hover: świecące narożniki (corner brackets), skanline lecący w dół,
// intensyfikacja neonowego glow i delikatne uniesienie.
export default function FloatingMetaCard({ label, value, accent = "red", className = "", style }) {
  const isBlue = accent === "blue";
  const edge = isBlue ? "border-l-2 border-l-blue" : "border-l-2 border-l-red";
  const glow = isBlue ? "hover:shadow-neon-blue" : "hover:shadow-neon-red";
  const valueHover = isBlue ? "group-hover:text-blue" : "group-hover:text-red";
  const bracketBorder = isBlue ? "border-blue" : "border-red";
  const scanGrad = isBlue
    ? "from-transparent via-blue to-transparent"
    : "from-transparent via-red to-transparent";

  return (
    <div
      style={style}
      className={[
        "group absolute z-[12] overflow-hidden border border-white/8 bg-bg-1/75 px-4 py-3.5 font-mono uppercase tracking-[0.1em] backdrop-blur-md",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-bg-1/90",
        edge,
        glow,
        className,
      ].join(" ")}
    >
      {/* Skanline — leci w dół, widoczny tylko na hover */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${scanGrad} opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:animate-scan-y`}
      />
      {/* Świecące narożniki (corner brackets) — pojawiają się na hover */}
      <span aria-hidden className={`pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t ${bracketBorder} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <span aria-hidden className={`pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t ${bracketBorder} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <span aria-hidden className={`pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l ${bracketBorder} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />
      <span aria-hidden className={`pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r ${bracketBorder} opacity-0 transition-opacity duration-200 group-hover:opacity-100`} />

      <div className="mb-1 text-[9px] text-ink-2 transition-colors duration-300 group-hover:text-ink-1">{label}</div>
      <div className={`text-[11px] text-ink-0 transition-colors duration-300 ${valueHover}`}>{value}</div>
    </div>
  );
}

FloatingMetaCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  accent: PropTypes.oneOf(["red", "blue"]),
  className: PropTypes.string,
  style: PropTypes.object,
};
