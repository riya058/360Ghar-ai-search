import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Sparkles } from "lucide-react";
import { FilterChips } from "./components/FilterChips";
import { PropertyDetail } from "./components/PropertyDetail";
import { PropertyGrid } from "./components/PropertyGrid";
import { SearchBar } from "./components/SearchBar";
import { ShareSearchButton } from "./components/ShareSearchButton";
import { properties } from "./data/properties";
import { fallbackParseQuery, fallbackPropertySummary } from "./lib/fallbackParser";
import { generatePropertySummary, parseSearchQuery } from "./lib/openRouterClient";
import { rankProperties } from "./lib/ranking";
import { getInitialQuery, writeSearchQuery } from "./lib/urlState";
import type { ParsedSearchQuery, RankedProperty } from "./types";

const DEFAULT_PARSED_QUERY: ParsedSearchQuery = {
  location: "Gurgaon",
  sector: null,
  bhk: null,
  minPriceLakhs: null,
  maxPriceLakhs: null,
  amenities: [],
  preferences: ["verified 360 walkthrough"],
  mustHaves: [],
};

function buildInitialResults() {
  return rankProperties(properties, DEFAULT_PARSED_QUERY);
}

function statusText(resultCount: number, parsed: ParsedSearchQuery | null) {
  if (!parsed) {
    return "Verified Gurgaon listings";
  }

  if (resultCount === 1) {
    return "1 ranked match";
  }

  return `${resultCount} ranked matches`;
}

function App() {
  const [query, setQuery] = useState(getInitialQuery);
  const [parsedQuery, setParsedQuery] = useState<ParsedSearchQuery | null>(null);
  const [rankedProperties, setRankedProperties] = useState<RankedProperty[]>(buildInitialResults);
  const [selectedProperty, setSelectedProperty] = useState<RankedProperty | null>(null);
  const [summary, setSummary] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedId = selectedProperty?.id ?? null;

  const runSearch = useCallback(async (nextQuery: string) => {
    const trimmed = nextQuery.trim();

    if (!trimmed) {
      setParsedQuery(null);
      setRankedProperties(buildInitialResults());
      setSelectedProperty(null);
      setSummary("");
      writeSearchQuery("");
      return;
    }

    setIsSearching(true);
    setNotice("");
    setCopied(false);
    writeSearchQuery(trimmed);

    try {
      const parsed = await parseSearchQuery(trimmed);
      setParsedQuery(parsed);
      setRankedProperties(rankProperties(properties, parsed));
      setSelectedProperty(null);
      setSummary("");
    } catch (error) {
      const parsed = fallbackParseQuery(trimmed);
      setParsedQuery(parsed);
      setRankedProperties(rankProperties(properties, parsed));
      setSelectedProperty(null);
      setSummary("");
      setNotice(
        error instanceof Error
          ? `${error.message} Local parsing is active for this run.`
          : "Local parsing is active for this run.",
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  const selectProperty = useCallback(
    async (property: RankedProperty) => {
      setSelectedProperty(property);
      setSummary("");
      setIsSummaryLoading(true);

      try {
        const aiSummary = await generatePropertySummary(query.trim() || "Verified Gurgaon property", property);
        setSummary(aiSummary);
      } catch {
        setSummary(fallbackPropertySummary(query.trim() || "Verified Gurgaon property", property));
      } finally {
        setIsSummaryLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    const initialQuery = getInitialQuery();

    if (initialQuery) {
      void runSearch(initialQuery);
    }
  }, [runSearch]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const resultMeta = useMemo(() => statusText(rankedProperties.length, parsedQuery), [rankedProperties.length, parsedQuery]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <Building2 size={24} aria-hidden="true" />
          </span>
          <div>
            <strong>360Ghar</strong>
          </div>
        </div>
        <div className="topbar__signal">
          <Sparkles size={17} aria-hidden="true" />
          Gurgaon / NCR
        </div>
      </header>

      <main
          className={
            selectedProperty
              ? "app-layout app-layout--detail"
              : "app-layout app-layout--centered"
          }
      >
        <section className="search-column">
          <div className="intro">
            <span className="eyebrow">Verified 360 homes</span>
            <h1>Find homes that match
                your wishlist.
                </h1>
            <h2><big> Search Smarter. Move Faster.</big></h2>
          </div>

          <SearchBar query={query} isLoading={isSearching} onQueryChange={setQuery} onSearch={runSearch} />

          {notice ? (
            <div className="notice" role="status">
              <AlertTriangle size={18} aria-hidden="true" />
              {notice}
            </div>
          ) : null}

          <FilterChips parsed={parsedQuery} />

          <div className="results-toolbar">
            <div>
              <span className="eyebrow">Results</span>
              <h2>{resultMeta}</h2>
            </div>
            <ShareSearchButton query={query} copied={copied} onCopied={() => setCopied(true)} />
          </div>

          <PropertyGrid properties={rankedProperties} selectedId={selectedId} onSelect={selectProperty} />
        </section>

        {selectedProperty && ( 
          <PropertyDetail
            property={selectedProperty}
            summary={summary}
            isLoading={isSummaryLoading}
            onClose={() => {
                setSelectedProperty(null);
                setSummary("");
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
