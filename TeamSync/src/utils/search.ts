export function matchesSearchQuery(query: string, ...fields: (string | undefined)[]) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery === "") {
    return true;
  }

  return fields.some((field) => (field ?? "").toLowerCase().includes(normalizedQuery));
}
