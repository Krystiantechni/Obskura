import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Logo OBSKURA — pulsująca czerwona kropka w obrysie + wordmark z dużym trackingiem.
export default function Brand({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center gap-3 text-[18px] font-extrabold tracking-brand text-ink-0 ${className}`}>
      <span className="relative h-6 w-6 rounded-full border-[1.5px] border-red shadow-[0_0_12px_rgba(255,42,42,0.5),inset_0_0_8px_rgba(255,42,42,0.3)]">
        <span className="absolute inset-[6px] animate-obskura-pulse rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
      </span>
      <span>OBSKURA</span>
    </Link>
  );
}

Brand.propTypes = { className: PropTypes.string };
