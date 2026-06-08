import type { ParsedSearchQuery, Property } from "../types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b:free";
const FALLBACK_MODELS = ["openrouter/free"];

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

function getApiKey() {
  return import.meta.env.VITE_OPENROUTER_API_KEY?.trim();
}

export function hasOpenRouterKey() {
  return Boolean(getApiKey());
}

function getConfiguredModel() {
  return import.meta.env.VITE_OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

function getModelCandidates() {
  return Array.from(new Set([getConfiguredModel(), ...FALLBACK_MODELS]));
}

function getErrorMessage(data: ChatCompletionResponse, status: number) {
  const message = data.error?.message || `OpenRouter request failed with ${status}.`;

  if (message.toLowerCase().includes("provider returned error")) {
    return `${message} The selected free model/provider may be unavailable or rate-limited.`;
  }

  return message;
}

async function callOpenRouter(messages: Array<{ role: "system" | "user"; content: string }>, maxTokens = 420) {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new OpenRouterError("OpenRouter API key is missing.");
  }

  const errors: string[] = [];

  for (const model of getModelCandidates()) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-OpenRouter-Title": "360Ghar AI Property Search",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: maxTokens,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as ChatCompletionResponse;

      if (!response.ok) {
        errors.push(`${model}: ${getErrorMessage(data, response.status)}`);
        continue;
      }

      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        errors.push(`${model}: OpenRouter returned an empty response.`);
        continue;
      }

      return content;
    } catch (error) {
      errors.push(`${model}: ${error instanceof Error ? error.message : "Request failed."}`);
    }
  }

  throw new OpenRouterError(
    `OpenRouter failed for ${getConfiguredModel()} and fallback openrouter/free. ${errors.join(" | ")}`,
  );
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? text;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new OpenRouterError("Could not find JSON in the model response.");
  }

  return candidate.slice(firstBrace, lastBrace + 1);
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeParsedQuery(value: unknown): ParsedSearchQuery {
  const object = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    location: asNullableString(object.location),
    sector: asNullableString(object.sector),
    bhk: asNullableNumber(object.bhk),
    minPriceLakhs: asNullableNumber(object.minPriceLakhs),
    maxPriceLakhs: asNullableNumber(object.maxPriceLakhs),
    amenities: asStringArray(object.amenities),
    preferences: asStringArray(object.preferences),
    mustHaves: asStringArray(object.mustHaves),
  };
}

export async function parseSearchQuery(query: string): Promise<ParsedSearchQuery> {
  const content = await callOpenRouter(
    [
      {
        role: "system",
        content:
          "You parse Indian real-estate search queries for Gurgaon/NCR. Return JSON only. Use lakhs for all prices. Use null for unknown scalar fields and [] for unknown lists.",
      },
      {
        role: "user",
        content: `Parse this search query into exactly this JSON shape:
{
  "location": string | null,
  "sector": string | null,
  "bhk": number | null,
  "minPriceLakhs": number | null,
  "maxPriceLakhs": number | null,
  "amenities": string[],
  "preferences": string[],
  "mustHaves": string[]
}

Rules:
- Convert crores to lakhs. Example: 1.5 crore becomes 150.
- Keep sector values like "Sector 50".
- Put school, metro, market, balcony, parking, gym, pool, clubhouse into amenities when mentioned.
- Put sunlight, investment, family, quiet, ready-to-move, premium into preferences.
- Put non-negotiable requirements into mustHaves.

Query: "${query}"`,
      },
    ],
    360,
  );

  return normalizeParsedQuery(JSON.parse(extractJsonObject(content)));
}

export async function generatePropertySummary(query: string, property: Property) {
  return callOpenRouter(
    [
      {
        role: "system",
        content:
          "You write concise, warm property match summaries for a consumer real-estate app. Do not use markdown. Keep it specific and practical.",
      },
      {
        role: "user",
        content: `Original user query: "${query}"

Property:
${JSON.stringify(
  {
    title: property.title,
    bhk: property.bhk,
    areaSqFt: property.areaSqFt,
    sector: property.sector,
    locality: property.locality,
    priceLakhs: property.priceLakhs,
    amenities: property.amenities,
    nearby: property.nearby,
    sunlight: property.sunlight,
    highlights: property.highlights,
  },
  null,
  2,
)}

Write 2-3 short lines explaining why this property matches the query. Mention the user's priorities when relevant.`,
      },
    ],
    220,
  );
}
