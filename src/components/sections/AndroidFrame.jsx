import PropTypes from "prop-types";

// Czysta ramka Android (punch-hole + gesture nav pill) w stylu Obskury.
// Ekran w środku przekazywany jako children.
export default function AndroidFrame({ children, className = "" }) {
  return (
    <div
      className={`relative flex h-[720px] w-[340px] max-w-full flex-col overflow-hidden rounded-[26px] border-[7px] border-white/15 bg-[#0a0d12] shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${className}`}
    >
      {/* status bar */}
      <div className="relative flex h-9 items-center justify-between px-4 text-[12px] text-white/85">
        <span>9:30</span>
        {/* camera punch-hole */}
        <span className="absolute left-1/2 top-2 h-[18px] w-[18px] -translate-x-1/2 rounded-full bg-[#1d1d1d]" />
        <span className="flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3.75" y="2" width="8.5" height="13" rx="1.5" />
            <rect x="5.5" y="0.9" width="5" height="2" rx="0.5" />
          </svg>
        </span>
      </div>

      {/* screen */}
      <div className="relative flex-1 overflow-hidden">{children}</div>

      {/* gesture nav pill */}
      <div className="flex h-6 items-center justify-center">
        <span className="h-1 w-[100px] rounded-full bg-white/40" />
      </div>
    </div>
  );
}

AndroidFrame.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
