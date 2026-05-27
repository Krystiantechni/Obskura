import PropTypes from "prop-types";

// Czysta ramka iPhone (dynamic island + home indicator) w stylu Obskury.
// Ekran w środku przekazywany jako children. Tailwind, bez inline-babela z prototypu.
export default function IosFrame({ children, className = "" }) {
  return (
    <div
      className={`relative h-[720px] w-[340px] max-w-full overflow-hidden rounded-[48px] bg-black shadow-[0_40px_80px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.06)] ${className}`}
    >
      {/* dynamic island */}
      <div className="absolute left-1/2 top-[11px] z-50 h-[34px] w-[120px] -translate-x-1/2 rounded-[24px] bg-black" />

      {/* status bar */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-7 pt-3.5 text-[13px] font-medium text-white/90">
        <span>9:41</span>
        <span className="flex items-center gap-1.5">
          <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
            <rect x="0" y="7" width="2.6" height="4" rx="0.6" />
            <rect x="4" y="4.5" width="2.6" height="6.5" rx="0.6" />
            <rect x="8" y="2" width="2.6" height="9" rx="0.6" />
            <rect x="12" y="0" width="2.6" height="11" rx="0.6" />
          </svg>
          <svg width="22" height="11" viewBox="0 0 22 11" fill="currentColor">
            <rect x="0.5" y="0.5" width="18" height="10" rx="2.6" fillOpacity="0.4" />
            <rect x="2" y="2" width="15" height="7" rx="1.4" />
          </svg>
        </span>
      </div>

      {/* screen */}
      <div className="relative h-full overflow-hidden">{children}</div>

      {/* home indicator */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center pb-2">
        <span className="h-[5px] w-[120px] rounded-full bg-white/70" />
      </div>
    </div>
  );
}

IosFrame.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
