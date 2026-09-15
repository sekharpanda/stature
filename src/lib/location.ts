/**
 * Upstream feeds store postcodes and numeric country codes as City/Country
 * rows (e.g. "30350", "219"), which would otherwise render inside location
 * labels as "Dubai Islands, 30350, 219".
 */
export function isRealPlaceName(value?: string | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length > 1 && !/^\d+$/.test(trimmed);
}

export function locationLabel(
  parts: Array<string | null | undefined>,
  fallback = "Dubai",
) {
  return (
    parts
      .filter(isRealPlaceName)
      .filter((value, index, all) => all.indexOf(value) === index)
      .join(", ") || fallback
  );
}
