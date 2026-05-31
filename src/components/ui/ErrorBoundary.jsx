import { Component } from "react";
import PropTypes from "prop-types";

// Granica błędu wokół lazy-tras. Łapie: błędy renderu, błędy ładowania chunków
// (np. stary tab + nowy deploy = zmienione nazwy hash chunków → ChunkLoadError).
// Pokazuje czytelny komunikat zamiast białej strony, z opcją hard-reload.
//
// React error boundaries muszą być class components (hooks nie obsługują
// getDerivedStateFromError / componentDidCatch).
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log do konsoli — w produkcji można podpiąć Sentry/LogRocket przez prop onError.
    console.error("ErrorBoundary caught:", error, info?.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  hardReload = () => {
    // Hard reload bez cache — najczęściej rozwiązuje ChunkLoadError po deploy.
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isChunkError = /ChunkLoadError|Loading chunk|Failed to fetch dynamically/i.test(
      this.state.error?.message || "",
    );

    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8 px-6 pt-[140px] text-center">
        <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-mono text-red">
          <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
          {isChunkError ? "Sygnał zerwany" : "Coś poszło nie tak"}
        </div>

        <h1 className="max-w-2xl font-serif text-[clamp(28px,4vw,44px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink-0">
          {isChunkError ? (
            <>Nowa wersja serwisu jest <em className="italic text-ink-1">dostępna</em>.</>
          ) : (
            <>Coś tu <em className="italic text-ink-1">poszło nie tak</em>.</>
          )}
        </h1>

        <p className="max-w-md text-[15px] font-light leading-relaxed text-ink-1">
          {isChunkError
            ? "Wgraliśmy świeżą wersję, a Ty masz starą otwartą. Odśwież stronę, żeby załadować nową."
            : "Wystąpił błąd, którego się nie spodziewaliśmy. Spróbuj ponownie lub odśwież stronę."}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={this.hardReload}
            className="inline-flex items-center justify-center gap-2 bg-red px-7 py-3.5 font-sans text-[13px] font-bold uppercase tracking-[0.2em] text-black transition-shadow hover:shadow-[0_0_30px_rgba(255,42,42,0.45)]"
          >
            Odśwież stronę
          </button>
          {!isChunkError && (
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center justify-center gap-2 border border-white/15 px-7 py-3.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink-1 transition-colors hover:border-ink-0 hover:text-ink-0"
            >
              Spróbuj ponownie
            </button>
          )}
        </div>

        {import.meta.env.DEV && this.state.error?.message && (
          <pre className="mt-4 max-w-2xl overflow-x-auto border border-white/10 bg-bg-1/60 p-4 text-left font-mono text-[11px] text-ink-2">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  onError: PropTypes.func,
};
