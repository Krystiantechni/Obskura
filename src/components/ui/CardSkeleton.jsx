import PropTypes from "prop-types";

// Placeholder karty historii (3:4) na czas ładowania listy katalogu.
export default function CardSkeleton({ count = 1 }) {
  // Fragment — `<CardSkeleton count={n} />` zachowuje się jak jeden element
  // (konsument w B8b-2 wstawia go wprost w grid bez troski o tablicę).
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="aspect-[3/4] animate-pulse bg-bg-1/60 [contain:layout_style_paint]"
        />
      ))}
    </>
  );
}

CardSkeleton.propTypes = { count: PropTypes.number };
