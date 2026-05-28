// [cookies-off] Stub — symulacja krwi wyłączona (używana tylko przez CookieConsent).
export default function BloodSim() { return null; }

// === ORYGINALNY KOD — odkomentuj, aby przywrócić (Cmd+/ na zaznaczeniu lub usuń '// ' z każdej linii) ===
// import { useEffect, useRef } from "react";
// import { getLenis } from "../../lib/lenisRef";
// 
// // Ciecz krwi z cząstek wewnątrz koła (canvas, integrator Verlet — stabilny, prędkość wynika z pozycji).
// // Grawitacja + kolizje (stała liczba cząstek = stała objętość). Bezwładność: ruch ikony (drag/shake)
// // i scroll wprawiają w chlupot. OPTYMALIZACJA: gdy krew osiądzie i nic się nie rusza, symulacja
// // usypia (zero CPU); budzi się przy ruchu. Pauza przy ukrytej karcie. Pre-renderowany sprite cząstki.
// export default function BloodSim() {
//   const canvasRef = useRef(null);
// 
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return undefined;
//     const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// 
//     const SIZE = 54;
//     const dpr = Math.min(2, window.devicePixelRatio || 1);
//     canvas.width = SIZE * dpr;
//     canvas.height = SIZE * dpr;
//     const ctx = canvas.getContext("2d", { willReadFrequently: true });
//     ctx.scale(dpr, dpr);
// 
//     const R = SIZE / 2;
//     const cx = R;
//     const cy = R;
//     const N = reduce ? 60 : 105; // pełniejsza, dobrze widoczna pula
//     const PR = 2.2;
//     const MIN = 3.1;
//     const MAXR = R - 1;
//     const G = 0.22;
//     const FRICTION = 0.985;
// 
//     // sprite cząstki (rysowany raz)
//     const SS = Math.ceil(PR * 4 * dpr);
//     const sprite = document.createElement("canvas");
//     sprite.width = SS;
//     sprite.height = SS;
//     const sc = sprite.getContext("2d");
//     // pełniejszy bump → po metaballu (blur+contrast) scala się w jednolitą ciecz z ostrą krawędzią
//     const grd = sc.createRadialGradient(SS / 2, SS / 2, 0, SS / 2, SS / 2, SS / 2);
//     grd.addColorStop(0, "rgba(210,30,30,1)");
//     grd.addColorStop(0.45, "rgba(180,22,22,1)");
//     grd.addColorStop(0.7, "rgba(150,16,16,0.85)");
//     grd.addColorStop(1, "rgba(120,13,13,0)");
//     sc.fillStyle = grd;
//     sc.fillRect(0, 0, SS, SS);
// 
//     const ps = [];
//     for (let i = 0; i < N; i++) {
//       const x = cx + (Math.random() - 0.5) * R;
//       const y = cy + R * 0.3 + Math.random() * R * 0.6;
//       ps.push({ x, y, px: x, py: y });
//     }
// 
//     const W = canvas.width;
//     const H = canvas.height;
//     const T = 55; // próg alfy — scala blobsy w jednolitą ciecz z ostrą krawędzią (metaball)
//     const draw = () => {
//       ctx.clearRect(0, 0, SIZE, SIZE);
//       for (let i = 0; i < N; i++) ctx.drawImage(sprite, ps[i].x - PR * 2, ps[i].y - PR * 2, PR * 4, PR * 4);
//       const img = ctx.getImageData(0, 0, W, H);
//       const d = img.data;
//       for (let k = 3; k < d.length; k += 4) {
//         const a = d[k];
//         if (a > T) {
//           const s = a > 255 ? 1 : (a - T) / (255 - T); // cieniowanie: jaśniejszy rdzeń, ciemniejsza krawędź
//           d[k - 3] = 172 + s * 80; // jaśniejsza, wyraźna czerwień
//           d[k - 2] = 20 + s * 30;
//           d[k - 1] = 20 + s * 30;
//           d[k] = 242;
//         } else {
//           d[k] = 0;
//         }
//       }
//       ctx.putImageData(img, 0, 0);
//     };
// 
//     const constrain = () => {
//       for (let i = 0; i < N; i++) {
//         const a = ps[i];
//         for (let j = i + 1; j < N; j++) {
//           const b = ps[j];
//           let dx = b.x - a.x;
//           let dy = b.y - a.y;
//           const d2 = dx * dx + dy * dy;
//           if (d2 < MIN * MIN && d2 > 0.0001) {
//             const d = Math.sqrt(d2);
//             const o = ((MIN - d) / d) * 0.5;
//             dx *= o; dy *= o;
//             a.x -= dx; a.y -= dy; b.x += dx; b.y += dy;
//           }
//         }
//       }
//       for (let i = 0; i < N; i++) {
//         const p = ps[i];
//         const dx = p.x - cx;
//         const dy = p.y - cy;
//         const dist = Math.hypot(dx, dy);
//         if (dist > MAXR) { p.x = cx + (dx / dist) * MAXR; p.y = cy + (dy / dist) * MAXR; }
//       }
//     };
// 
//     if (reduce) {
//       for (let s = 0; s < 120; s++) {
//         for (let i = 0; i < N; i++) {
//           const p = ps[i];
//           const vx = (p.x - p.px) * FRICTION;
//           const vy = (p.y - p.py) * FRICTION;
//           p.px = p.x; p.py = p.y;
//           p.x += vx; p.y += vy + G;
//         }
//         constrain();
//       }
//       draw();
//       return undefined;
//     }
// 
//     let lastRect = canvas.getBoundingClientRect();
//     let lastMVx = 0;
//     let lastMVy = 0;
//     let asleep = false;
//     let restFrames = 0;
//     let raf;
//     const step = () => {
//       raf = requestAnimationFrame(step);
//       if (document.hidden) return;
// 
//       const rect = canvas.getBoundingClientRect();
//       const cvx = rect.left - lastRect.left;
//       const cvy = rect.top - lastRect.top;
//       lastRect = rect;
//       const lenis = getLenis();
//       const sv = lenis && typeof lenis.velocity === "number" ? lenis.velocity : 0;
//       const mvx = cvx;
//       const mvy = cvy + sv * 0.45;
//       const impX = -(mvx - lastMVx) * 0.95; // bezwładność: cząstki lagują za ruchem
//       const impY = -(mvy - lastMVy) * 0.95;
//       lastMVx = mvx;
//       lastMVy = mvy;
//       const motion = Math.abs(impX) + Math.abs(impY);
// 
//       if (asleep) {
//         if (motion > 0.15) { asleep = false; restFrames = 0; } else return; // śpi → zero symulacji
//       }
// 
//       // żywe tłumienie przy ruchu, mocne wyciszanie w spoczynku (szybko stygnie → usypia)
//       const fr = motion < 0.08 ? 0.84 : FRICTION;
//       for (let i = 0; i < N; i++) {
//         const p = ps[i];
//         const vx = (p.x - p.px) * fr;
//         const vy = (p.y - p.py) * fr;
//         p.px = p.x; p.py = p.y;
//         p.x += vx + impX;
//         p.y += vy + impY + G;
//       }
//       constrain();
//       draw();
// 
//       // brak interakcji przez ~1.5 s → uśpij symulację (zamrożona klatka, zero CPU); ruch budzi
//       if (motion < 0.08) {
//         if (++restFrames > 90) asleep = true;
//       } else {
//         restFrames = 0;
//       }
//     };
//     raf = requestAnimationFrame(step);
//     return () => cancelAnimationFrame(raf);
//   }, []);
// 
//   return <canvas ref={canvasRef} aria-hidden style={{ width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 0 2px rgba(255,40,40,0.55))" }} />;
// }
