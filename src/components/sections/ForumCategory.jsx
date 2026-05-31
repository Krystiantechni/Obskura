import PropTypes from "prop-types";

// Blok kategorii forum: nagłówek z ikoną + lista wątków (responsywne wiersze).
export default function ForumCategory({ category }) {
  const Icon = category.icon;
  return (
    <div className="mb-6 border border-line bg-bg-1/40 transition-colors hover:border-red/40">
      <div className="flex items-center justify-between border-b border-line bg-black/30 px-6 py-4">
        <span className="flex min-w-0 items-center gap-3 font-serif text-[24px] italic">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center border border-line text-red">
              <Icon size={16} />
            </span>
          )}
          <span className="min-w-0 truncate">{category.name}</span>
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-mono text-ink-2 sm:block">
          {category.info.map((part, i) => (
            <span key={part}>
              {i > 0 && " · "}
              <span className="text-ink-0">{part}</span>
            </span>
          ))}
        </span>
      </div>

      {category.threads.map((th) => (
        <button
          key={th.t}
          type="button"
          className="w-full cursor-pointer border-b border-line-soft px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-red/[0.04] sm:px-6 lg:grid lg:grid-cols-[1fr_80px_80px_160px] lg:items-center lg:gap-4"
        >
          {/* Title + meta row */}
          <span className="block min-w-0">
            <span className="mb-1 block text-[15px] font-medium leading-snug text-ink-0">
              {th.badge === "pin" && <span className="mr-2 text-red">&#128204;</span>}
              {th.badge === "hot" && <span className="mr-2 text-blue">&#128293;</span>}
              {th.t}
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-ui text-ink-2">{th.meta}</span>
          </span>

          {/* Mobile footer row: stats + who/when — hidden on lg (each column takes over) */}
          <span className="mt-2 flex items-center gap-4 lg:hidden">
            <span className="font-mono text-[11px] text-ink-1">
              {th.replies}
              <span className="ml-0.5 font-mono text-[9px] uppercase tracking-ui text-ink-3">odp.</span>
            </span>
            <span className="font-mono text-[11px] text-ink-1">
              {th.views}
              <span className="ml-0.5 font-mono text-[9px] uppercase tracking-ui text-ink-3">odsłon</span>
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-ui text-ink-2">
              <span className="font-serif text-[12px] normal-case italic tracking-normal text-ink-0">{th.who}</span>
              {" · "}
              {th.when}
            </span>
          </span>

          {/* Desktop-only stat columns */}
          <span className="hidden font-mono text-[13px] text-ink-1 lg:block lg:text-center">
            {th.replies}
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-ui text-ink-3">odp.</span>
          </span>
          <span className="hidden font-mono text-[13px] text-ink-1 lg:block lg:text-center">
            {th.views}
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-ui text-ink-3">odsłon</span>
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-ui text-ink-2 lg:block lg:text-right">
            <span className="mb-0.5 block font-serif text-[13px] normal-case italic tracking-normal text-ink-0">{th.who}</span>
            {th.when}
          </span>
        </button>
      ))}
    </div>
  );
}

ForumCategory.propTypes = {
  category: PropTypes.shape({
    name: PropTypes.string.isRequired,
    info: PropTypes.arrayOf(PropTypes.string).isRequired,
    icon: PropTypes.elementType,
    threads: PropTypes.arrayOf(
      PropTypes.shape({
        t: PropTypes.string.isRequired,
        meta: PropTypes.string.isRequired,
        badge: PropTypes.string,
        replies: PropTypes.string.isRequired,
        views: PropTypes.string.isRequired,
        who: PropTypes.string.isRequired,
        when: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
};
