import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Primary CTA z czerwonym neon glow + shimmer sweep na hover.
// variant: primary (czerwone tło) | ghost (obrys). as: button | link (to).
export default function HorrorButton({
  children,
  variant = "primary",
  block = false,
  to,
  type = "button",
  className = "",
  disabled = false,
  ...rest
}) {
  const base =
    "group relative inline-flex items-center justify-center gap-3 overflow-hidden px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red";
  const variants = {
    primary:
      "bg-red text-white shadow-cta-red hover:bg-red-soft hover:shadow-cta-red-hover hover:-translate-y-px",
    ghost:
      "border border-white/10 text-ink-0 hover:border-red hover:text-red",
  };
  const cls = [
    base,
    variants[variant],
    block ? "w-full" : "",
    disabled ? "pointer-events-none opacity-40" : "",
    className,
  ].join(" ");

  const shimmer =
    variant === "primary" ? (
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.22)_50%,transparent_70%)] transition-transform duration-700 group-hover:translate-x-full"
      />
    ) : null;

  const content = (
    <>
      {shimmer}
      <span className="relative z-10 inline-flex items-center gap-3">{children}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled} {...rest}>
      {content}
    </button>
  );
}

HorrorButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "ghost"]),
  block: PropTypes.bool,
  to: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
