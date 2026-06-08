import type { ParsedSearchQuery, Property, RankedProperty } from "../types";

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function includesAny(values: string[], needle: string) {
  const normalizedNeedle = normalize(needle);
  return values.some((value) => normalize(value).includes(normalizedNeedle) || normalizedNeedle.includes(normalize(value)));
}

function uniqueReasons(reasons: string[]) {
  return Array.from(new Set(reasons)).slice(0, 4);
}

function priceLabel(priceLakhs: number) {
  if (priceLakhs >= 100) {
    return `Rs. ${(priceLakhs / 100).toFixed(priceLakhs % 100 === 0 ? 0 : 2)} Cr`;
  }

  return `Rs. ${priceLakhs}L`;
}

function propertySignals(property: Property) {
  return [
    property.sector,
    property.locality,
    property.propertyType,
    property.sunlight,
    ...property.amenities,
    ...property.nearby,
    ...property.highlights,
    ...property.tags,
  ];
}

function isHardMatch(property: Property, parsed: ParsedSearchQuery) {
  if (parsed.bhk && property.bhk !== parsed.bhk) {
    return false;
  }

  if (parsed.maxPriceLakhs && property.priceLakhs > parsed.maxPriceLakhs + 8) {
    return false;
  }

  return true;
}

function scoreProperty(property: Property, parsed: ParsedSearchQuery): RankedProperty {
  const signals = propertySignals(property);
  const reasons: string[] = [];
  let score = 0;

  if (parsed.bhk) {
    if (property.bhk === parsed.bhk) {
      score += 28;
      reasons.push(`${property.bhk}BHK match`);
    } else {
      score -= 18;
    }
  }

  if (parsed.sector) {
    if (normalize(property.sector) === normalize(parsed.sector)) {
      score += 34;
      reasons.push(`${property.sector} address`);
    } else if (normalize(property.locality).includes(normalize(parsed.sector))) {
      score += 12;
    }
  }

  if (parsed.maxPriceLakhs) {
    if (property.priceLakhs <= parsed.maxPriceLakhs) {
      score += 24;
      reasons.push(`Within ${priceLabel(parsed.maxPriceLakhs)} budget`);
    } else if (property.priceLakhs <= parsed.maxPriceLakhs + 8) {
      score += 8;
      reasons.push(`Close to ${priceLabel(parsed.maxPriceLakhs)} budget`);
    } else {
      score -= 16;
    }
  }

  parsed.amenities.forEach((amenity) => {
    if (includesAny(signals, amenity)) {
      score += 14;
      reasons.push(`Has ${amenity}`);
    }
  });

  parsed.mustHaves.forEach((mustHave) => {
    if (includesAny(signals, mustHave)) {
      score += 18;
      reasons.push(`${mustHave} nearby`);
    }
  });

  parsed.preferences.forEach((preference) => {
    if (preference.includes("sunlight") || preference.includes("natural light")) {
      if (property.sunlight === "Excellent") {
        score += 18;
        reasons.push("Great natural light");
      } else if (property.sunlight === "Good") {
        score += 10;
        reasons.push("Good natural light");
      }
      return;
    }

    if (preference.includes("affordable") && property.priceLakhs <= 90) {
      score += 12;
      reasons.push("Strong value pick");
      return;
    }

    if (includesAny(signals, preference)) {
      score += 10;
      reasons.push(`Fits ${preference}`);
    }
  });

  if (!reasons.length) {
    reasons.push(property.highlights[0], property.nearby[0]);
  }

  return {
    ...property,
    score,
    matchReasons: uniqueReasons(reasons),
  };
}

export function rankProperties(properties: Property[], parsed: ParsedSearchQuery): RankedProperty[] {
  const scored = properties
    .map((property) => scoreProperty(property, parsed))
    .sort((a, b) => b.score - a.score || a.priceLakhs - b.priceLakhs);

  const hardFiltered = scored.filter((property) => isHardMatch(property, parsed));

  if (hardFiltered.length > 0) {
    return hardFiltered;
  }

  return scored.slice(0, 6).map((property) => ({
    ...property,
    matchReasons: ["Closest available match", ...property.matchReasons].slice(0, 4),
  }));
}

export function formatPrice(priceLakhs: number) {
  return priceLabel(priceLakhs);
}
