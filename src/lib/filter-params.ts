/** Parse comma-separated (or repeated) filter query values. Safe for server + client. */
export function parseFilterList(value?: string | string[] | null): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function serializeFilterList(values: string[]): string {
  return values.join(",");
}
