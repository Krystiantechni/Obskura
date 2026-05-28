// [cookies-off] Stub — drag FAB wyłączony (używany tylko przez CookieConsent).
export function useCookieFab() {
  return { ref: { current: null }, style: undefined, onPointerDown: () => {}, onPointerMove: () => {}, onPointerUp: () => {}, shouldIgnoreClick: () => false };
}
export default useCookieFab;

// === ORYGINALNY KOD — odkomentuj, aby przywrócić (Cmd+/ na zaznaczeniu lub usuń '// ' z każdej linii) ===
// import { useCallback, useEffect, useRef, useState } from "react";
// 
// const POS_KEY = "obskura_cookie_pos";
// const SIZE = 58;
// 
// function loadPos() {
//   try {
//     const p = JSON.parse(localStorage.getItem(POS_KEY));
//     if (p && typeof p.x === "number" && typeof p.y === "number") return p;
//   } catch {
//     /* ignore */
//   }
//   return null;
// }
// 
// function clampPos(x, y) {
//   return {
//     x: Math.max(8, Math.min(window.innerWidth - SIZE - 8, x)),
//     y: Math.max(8, Math.min(window.innerHeight - SIZE - 8, y)),
//   };
// }
// 
// // Przeciągalna ikona cookie (lewy przycisk). Pozycja zapisywana w localStorage (przetrwa F5).
// // Fizykę krwi (chlupot przy ruchu) obsługuje symulacja cząstek <BloodSim> — wykrywa ruch ikony sama.
// export function useCookieFab() {
//   const ref = useRef(null);
//   const [pos, setPos] = useState(loadPos);
//   const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0, ignoreClick: false });
// 
//   useEffect(() => {
//     const onResize = () => setPos((p) => (p ? clampPos(p.x, p.y) : p));
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);
// 
//   const onPointerDown = useCallback((e) => {
//     if (e.button !== 0) return;
//     const r = ref.current.getBoundingClientRect();
//     drag.current = { down: true, moved: false, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, ignoreClick: false };
//     try { ref.current.setPointerCapture(e.pointerId); } catch { /* ignore */ }
//   }, []);
// 
//   const onPointerMove = useCallback((e) => {
//     const d = drag.current;
//     if (!d.down) return;
//     const dx = e.clientX - d.sx;
//     const dy = e.clientY - d.sy;
//     if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
//     setPos(clampPos(d.ox + dx, d.oy + dy));
//   }, []);
// 
//   const onPointerUp = useCallback((e) => {
//     const d = drag.current;
//     if (!d.down) return;
//     d.down = false;
//     try { ref.current.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
//     if (d.moved) {
//       d.ignoreClick = true; // przeciąganie nie otwiera panelu
//       setPos((p) => {
//         if (p) localStorage.setItem(POS_KEY, JSON.stringify(p));
//         return p;
//       });
//       setTimeout(() => { drag.current.ignoreClick = false; }, 60);
//     }
//   }, []);
// 
//   const shouldIgnoreClick = useCallback(() => drag.current.ignoreClick, []);
// 
//   const style = pos ? { left: `${pos.x}px`, top: `${pos.y}px`, right: "auto", bottom: "auto" } : undefined;
// 
//   return { ref, pos, style, onPointerDown, onPointerMove, onPointerUp, shouldIgnoreClick };
// }
// 
// export default useCookieFab;
