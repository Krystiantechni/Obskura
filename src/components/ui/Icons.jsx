import PropTypes from "prop-types";

// Zestaw ikon SVG OBSKURA — inline, currentColor, lekkie (z prototypu Obskura.html).
export const Play = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor"><path d="M2 1 L11 6 L2 11 Z" /></svg>
);
export const Pause = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></svg>
);
export const Prev = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor"><rect x="2" y="2" width="2" height="10" /><path d="M14 2 L5 7 L14 12 Z" /></svg>
);
export const Next = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor"><rect x="10" y="2" width="2" height="10" /><path d="M0 2 L9 7 L0 12 Z" /></svg>
);
export const Heart = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7Z" /></svg>
);
export const HeartFill = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor"><path d="M8 14s-5-3-5-7a3 3 0 0 1 5-2 3 3 0 0 1 5 2c0 4-5 7-5 7Z" /></svg>
);
export const Volume = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 6 H6 L10 3 V13 L6 10 H3 Z" fill="currentColor" /><path d="M12 5 C13.5 6.5 13.5 9.5 12 11" /></svg>
);
export const Share = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="4" cy="8" r="2" /><circle cx="12" cy="3.5" r="2" /><circle cx="12" cy="12.5" r="2" /><path d="M6 7 L10 4.5 M6 9 L10 11.5" /></svg>
);
export const List = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="4" x2="13" y2="4" /><line x1="3" y1="8" x2="13" y2="8" /><line x1="3" y1="12" x2="13" y2="12" /></svg>
);
export const Arrow = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6 H10 M7 3 L10 6 L7 9" /></svg>
);
export const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="5" /><path d="M12 12 L16 16" /></svg>
);
export const GridIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="1" width="5" height="5" /><rect x="8" y="1" width="5" height="5" /><rect x="1" y="8" width="5" height="5" /><rect x="8" y="8" width="5" height="5" /></svg>
);
export const ListViewIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor"><rect x="1" y="2" width="12" height="2" /><rect x="1" y="6" width="12" height="2" /><rect x="1" y="10" width="12" height="2" /></svg>
);

const sizeProp = { size: PropTypes.number };
Play.propTypes = sizeProp;
Pause.propTypes = sizeProp;
Prev.propTypes = sizeProp;
Next.propTypes = sizeProp;
Heart.propTypes = sizeProp;
HeartFill.propTypes = sizeProp;
Volume.propTypes = sizeProp;
Share.propTypes = sizeProp;
List.propTypes = sizeProp;
Arrow.propTypes = sizeProp;
SearchIcon.propTypes = sizeProp;
GridIcon.propTypes = sizeProp;
ListViewIcon.propTypes = sizeProp;
