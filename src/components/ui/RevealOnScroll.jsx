import PropTypes from "prop-types";
import { useReveal } from "../../hooks/useReveal";

// Wrapper który robi fade-up animację gdy element wjedzie w viewport.
export default function RevealOnScroll({ children, delay = 0, className = "", as: As = "div" }) {
  const [ref, visible] = useReveal({ threshold: 0.2 });
  return (
    <As
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={[
        "transition-all duration-[1.1s] ease-out-expo",
        visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
        className,
      ].join(" ")}
    >
      {children}
    </As>
  );
}

RevealOnScroll.propTypes = {
  children: PropTypes.node.isRequired,
  delay: PropTypes.number,
  className: PropTypes.string,
  as: PropTypes.elementType,
};
