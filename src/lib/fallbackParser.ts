import type { ParsedSearchQuery, Property } from "../types";

const EMPTY_QUERY: ParsedSearchQuery = {
  location: null,
  sector: null,
  bhk: null,
  minPriceLakhs: null,
  maxPriceLakhs: null,
  amenities: [],
  preferences: [],
  mustHaves: [],
};

const AMENITY_KEYWORDS = [
  "school",
  "metro",
  "market",
  "balcony",
  "parking",
  "gym",
  "pool",
  "clubhouse",
  "security",
  "lift",
  "park",
];

const PREFERENCE_KEYWORDS = [
  "sunlight",
  "natural light",
  "investment",
  "family",
  "quiet",
  "ready",
  "premium",
  "affordable",
  "rental",
];

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function parsePriceLakhs(text: string) {
  const pricePattern =
    /(?:under|below|upto|up to|less than|within|max|maximum)?\s*([0-9]+(?:\.[0-9]+)?)\s*(crore|crores|cr|lakh|lakhs|lac|lacs)\b/i;
  const match = text.match(pricePattern);

  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(value)) {
    return null;
  }

  return unit.startsWith("cr") || unit.startsWith("crore") ? value * 100 : value;
}

export function fallbackParseQuery(query: string): ParsedSearchQuery {
  const lower = query.toLowerCase();
  const sector = query.match(/sector\s*-?\s*(\d{1,3}[a-z]?)/i)?.[1];
  const bhk = query.match(/(\d)\s*bhk/i)?.[1];
  const amenities = AMENITY_KEYWORDS.filter((keyword) => lower.includes(keyword));
  const preferences = PREFERENCE_KEYWORDS.filter((keyword) => lower.includes(keyword));
  const maxPriceLakhs = parsePriceLakhs(lower);

  if (lower.includes("gurgaon") || lower.includes("gurugram")) {
    return {
      ...EMPTY_QUERY,
      location: "Gurgaon",
      sector: sector ? `Sector ${sector.toUpperCase()}` : null,
      bhk: bhk ? Number(bhk) : null,
      maxPriceLakhs: maxPriceLakhs ?? (lower.includes("affordable") ? 90 : null),
      amenities: unique(amenities),
      preferences: unique(preferences),
      mustHaves: unique(amenities.filter((item) => ["school", "metro", "balcony"].includes(item))),
    };
  }

  return {
    ...EMPTY_QUERY,
    sector: sector ? `Sector ${sector.toUpperCase()}` : null,
    bhk: bhk ? Number(bhk) : null,
    maxPriceLakhs: maxPriceLakhs ?? (lower.includes("affordable") ? 90 : null),
    amenities: unique(amenities),
    preferences: unique(preferences),
    mustHaves: unique(amenities.filter((item) => ["school", "metro", "balcony"].includes(item))),
  };
}

export function fallbackPropertySummary(query: string, property: Property) {
  const school = property.nearby.find((place) => /school|dps|presidium|xavier|goenka|heritage|lancers/i.test(place));
  const budget = `Rs. ${property.priceLakhs}L`;
  const sunlight = property.sunlight === "Excellent" ? "strong natural light" : "comfortable daylight";
  const nearbyLine = school ? `It also keeps you close to ${school}, which fits the school-access priority.` : "";

  return `${property.title} is a ${property.bhk}BHK in ${property.sector} at ${budget}, with ${sunlight} and ${property.areaSqFt.toLocaleString()} sq ft of usable space.
${nearbyLine || `For "${query}", its strongest fit is ${property.highlights[0].toLowerCase()}.`}`;
}
