export type SunlightLevel = "Excellent" | "Good" | "Moderate";

export interface Property {
  id: string;
  title: string;
  bhk: number;
  areaSqFt: number;
  sector: string;
  locality: string;
  priceLakhs: number;
  imageUrl: string;
  propertyType: string;
  possession: string;
  sunlight: SunlightLevel;
  amenities: string[];
  nearby: string[];
  highlights: string[];
  tags: string[];
}

export interface ParsedSearchQuery {
  location: string | null;
  sector: string | null;
  bhk: number | null;
  minPriceLakhs: number | null;
  maxPriceLakhs: number | null;
  amenities: string[];
  preferences: string[];
  mustHaves: string[];
}

export interface RankedProperty extends Property {
  score: number;
  matchReasons: string[];
}
