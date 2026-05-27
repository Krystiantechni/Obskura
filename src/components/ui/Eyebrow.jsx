import PropTypes from "prop-types";

// Mono kicker z świecącą kreską — czerwony lub niebieski akcent.
export default function Eyebrow({ children, accent = "red", className = "", centered = false }) {
  const color = accent === "blue" ? "text-blue" : "text-red";
  const line = accent === "blue" ? "bg-blue shadow-[0_0_8px_#5fa8ff]" : "bg-red shadow-[0_0_8px_#ff2a2a]";
  return (
    <div
      className={[
        "inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow",
        color,
        centered ? "justify-center" : "",
        className,
      ].join(" ")}
    >
      <span className={`h-px w-8 ${line}`} />
      {children}
    </div>
  );
}

Eyebrow.propTypes = {
  children: PropTypes.node.isRequired,
  accent: PropTypes.oneOf(["red", "blue"]),
  className: PropTypes.string,
  centered: PropTypes.bool,
};
