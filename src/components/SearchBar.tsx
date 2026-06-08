import { Loader2, Search } from "lucide-react";

interface SearchBarProps {
  query: string;
  isLoading: boolean;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
}

const SAMPLE_QUERY = "2BHK in Sector 50 Gurgaon under 80 lakhs, good sunlight, near a school";

export function SearchBar({ query, isLoading, onQueryChange, onSearch }: SearchBarProps) {
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query);
  };

  return (
    <form className="search-panel" onSubmit={submitSearch}>
      <div className="search-row">
        <Search className="search-row__icon" size={22} aria-hidden="true" />
        <input
          id="search-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={SAMPLE_QUERY}
        />
        <button className="primary-button" type="submit" disabled={isLoading || !query.trim()}>
          {isLoading ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
          Search
        </button>
      </div>
      <button className="sample-button" type="button" onClick={() => onQueryChange(SAMPLE_QUERY)}>
        <small> Use sample search</small>
      </button>
    </form>
  );
}
