import { Loader2, MapPin, X } from "lucide-react";
import type { RankedProperty } from "../types";
import { formatPrice } from "../lib/ranking";

interface PropertyDetailProps {
  property: RankedProperty | null;
  summary: string;
  isLoading: boolean;
  onClose: () => void;
}

export function PropertyDetail({ property, summary, isLoading, onClose }: PropertyDetailProps) {
  if (!property) {
    return null;
  }

  return (
    <aside className="detail-panel" aria-label="Property details">
      <div className="detail-panel__header">
        <div>
          <span className="eyebrow">AI match summary</span>
          <h2>{property.title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close property details" title="Close">
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <img src={property.imageUrl} alt={`${property.title} interior`} />

      <div className="detail-panel__facts">
        <strong>{formatPrice(property.priceLakhs)}</strong>
        <span>{property.bhk}BHK</span>
        <span>{property.areaSqFt.toLocaleString()} sq ft</span>
      </div>

      <p className="detail-panel__location">
        <MapPin size={16} aria-hidden="true" />
        {property.sector}, {property.locality}
      </p>

      <div className="summary-box">
        {isLoading ? (
          <p className="loading-line">
            <Loader2 className="spin" size={18} aria-hidden="true" />
            Generating summary
          </p>
        ) : (
          <p>{summary}</p>
        )}
      </div>

      <div className="detail-panel__section">
        <h3>Why it ranks</h3>
        <div className="filter-chips">
          {property.matchReasons.map((reason) => (
            <span className="filter-chip" key={reason}>
              {reason}
            </span>
          ))}
        </div>
      </div>

      <div className="detail-panel__section">
        <h3>Nearby</h3>
        <ul>
          {property.nearby.map((place) => (
            <li key={place}>{place}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
