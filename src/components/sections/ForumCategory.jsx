import PropTypes from "prop-types";

// Blok kategorii forum: nagłówek z ikoną + lista wątków (responsywne wiersze).
export default function ForumCategory({ category }) {
  const Icon = category.icon;
  return (
    <div className="mb-6 border border-line bg-bg-1/40 transition-colors hover:border-red/40">
      <div className="flex items-center justify-between border-b border-line bg-black/30 px-6 py-4">
        <span className="flex items-center gap-3 font-serif text-[24px] italic">
          {Icon && (
            <span className="grid h-9 w-9 place-items-center border border-line text-red">
              <Icon size={16} />
            </span>
          )}
          {category.name}
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
          className="grid w-full cursor-pointer grid-cols-1 items-center gap-2 border-b border-line-soft px-6 py-4 text-left transition-colors last:border-b-0 hover:bg-red/[0.04] lg:grid-cols-[1fr_80px_80px_160px] lg:gap-4"
        >
          <span className="min-w-0">
            <span className="mb-1 block text-[15px] font-medium leading-snug text-ink-0">
              {th.badge === "pin" && <span className="mr-2 text-red">📌</span>}
              {th.badge === "hot" && <span className="mr-2 text-blue">🔥</span>}
              {th.t}
            </span>
            <span className="block font-mono text-[10px] uppercase tracking-ui text-ink-2">{th.meta}</span>
          </span>
          <span className="font-mono text-[13px] text-ink-1 lg:text-center">
            {th.replies}
            <span className="ml-1 font-mono text-[9px] uppercase tracking-ui text-ink-3 lg:ml-0 lg:block">odp.</span>
          </span>
          <span className="font-mono text-[13px] text-ink-1 lg:text-center">
            {th.views}
            <span className="ml-1 font-mono text-[9px] uppercase tracking-ui text-ink-3 lg:ml-0 lg:block">odsłon</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-ui text-ink-2 lg:text-right">
            <span className="font-serif text-[13px] normal-case italic tracking-normal text-ink-0 lg:mb-0.5 lg:block">{th.who}</span>{" "}
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
