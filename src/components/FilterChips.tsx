import type { ParsedSearchQuery } from "../types";
import { formatPrice } from "../lib/ranking";

interface FilterChipsProps {
  parsed: ParsedSearchQuery | null;
}

export function FilterChips({ parsed }: FilterChipsProps) {
  if (!parsed) {
    return null;
  }

  const chips = [
    parsed.location,
    parsed.sector,
    parsed.bhk ? `${parsed.bhk}BHK` : null,
    parsed.maxPriceLakhs ? `Under ${formatPrice(parsed.maxPriceLakhs)}` : null,
    ...parsed.amenities,
    ...parsed.preferences,
    ...parsed.mustHaves.map((item) => `${item} required`),
  ].filter(Boolean);

  if (!chips.length) {
    return null;
  }

  return (
    <div className="filter-chips" aria-label="Parsed search filters">
      {chips.map((chip) => (
        <span className="filter-chip" key={chip}>
          {chip}
        </span>
      ))}
    </div>
  );
}
