import type { RankedProperty } from "../types";
import { PropertyCard } from "./PropertyCard";

interface PropertyGridProps {
  properties: RankedProperty[];
  selectedId: string | null;
  onSelect: (property: RankedProperty) => void;
}

export function PropertyGrid({ properties, selectedId, onSelect }: PropertyGridProps) {
  if (!properties.length) {
    return (
      <div className="empty-state">
        <h2>No close matches found</h2>
        <p>Try relaxing the budget, sector, or BHK requirement.</p>
      </div>
    );
  }

  return (
    <div className="property-grid">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          isSelected={property.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
