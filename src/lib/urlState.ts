const QUERY_PARAM = "q";

export function getInitialQuery() {
  return new URLSearchParams(window.location.search).get(QUERY_PARAM) ?? "";
}

export function writeSearchQuery(query: string) {
  const url = new URL(window.location.href);

  if (query.trim()) {
    url.searchParams.set(QUERY_PARAM, query.trim());
  } else {
    url.searchParams.delete(QUERY_PARAM);
  }

  window.history.replaceState({}, "", url);
}

export function buildShareUrl(query: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(QUERY_PARAM, query.trim());
  return url.toString();
}
