// Shimmer fallback dla lazy-ładowanych tras — w stylu OBSKURy (mono label, pulsująca kropka).
export default function PageFallback() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 pt-[140px]">
      <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-mono text-ink-2">
        <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
        Ładowanie
      </div>

      <div className="w-full max-w-[680px] space-y-5">
        {[60, 90, 75].map((w, i) => (
          <div
            key={i}
            className="h-10 animate-shimmer rounded-sm bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.08),rgba(255,255,255,0.03))] bg-[length:200%_100%]"
            style={{ width: `${w}%` }}
          />
        ))}
        <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-shimmer rounded-sm bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.07),rgba(255,255,255,0.03))] bg-[length:200%_100%]"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
