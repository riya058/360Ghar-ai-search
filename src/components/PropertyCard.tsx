import { Home, MapPin, Maximize2, Sun } from "lucide-react";
import type { RankedProperty } from "../types";
import { formatPrice } from "../lib/ranking";

interface PropertyCardProps {
  property: RankedProperty;
  isSelected: boolean;
  onSelect: (property: RankedProperty) => void;
}

export function PropertyCard({ property, isSelected, onSelect }: PropertyCardProps) {
  const badgeText = property.matchReasons.slice(0, 2).join(" / ");

  return (
    <article className={`property-card ${isSelected ? "property-card--selected" : ""}`}>
      <button className="property-card__button" type="button" onClick={() => onSelect(property)}>
        <div className="property-card__media">
          <img src={property.imageUrl} alt={`${property.title} interior`} />
          <span className="tour-badge">360 preview</span>
        </div>
        <div className="property-card__body">
          <div className="property-card__topline">
            <span className="match-badge">{badgeText}</span>
            <span className="score-pill">{Math.max(property.score, 8)}%</span>
          </div>
          <h2>{property.title}</h2>
          <div className="property-card__location">
            <MapPin size={16} aria-hidden="true" />
            {property.sector}, {property.locality}
          </div>
          <div className="property-card__facts">
            <span>
              <Home size={16} aria-hidden="true" />
              {property.bhk}BHK
            </span>
            <span>
              <Maximize2 size={16} aria-hidden="true" />
              {property.areaSqFt.toLocaleString()} sq ft
            </span>
            <span>
              <Sun size={16} aria-hidden="true" />
              {property.sunlight}
            </span>
          </div>
          <div className="property-card__bottom">
            <strong>{formatPrice(property.priceLakhs)}</strong>
            <span>{property.possession}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
