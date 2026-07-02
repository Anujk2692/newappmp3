/** Pass a search query from Home → Media Search tab */
let pendingSearchQuery: string | null = null;

export function setPendingSearchQuery(query: string): void {
  pendingSearchQuery = query;
}

export function consumePendingSearchQuery(): string | null {
  const q = pendingSearchQuery;
  pendingSearchQuery = null;
  return q;
}
