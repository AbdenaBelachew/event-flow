/**
 * Convert an event title into a URL-safe slug.
 *
 * Examples:
 *   "Addis Jazz Night 2026!" -> "addis-jazz-night-2026"
 *   "  Conf 2026 / Live   "  -> "conf-2026-live"
 *   ""                       -> "event"
 */
export function slugify(input: string): string {
  const base = (input || '')
    .toString()
    .normalize('NFKD')
    // strip diacritics (e.g. é -> e)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // replace any non-alphanumeric char with a hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // collapse repeated hyphens and trim
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'event'
}

/**
 * Build the public share link for an event.
 * Uses a human-readable slug instead of the raw UUID.
 *
 *   https://app.example.com/browse?event=addis-jazz-night-2026
 */
export function buildEventShareLink(origin: string, title: string): string {
  const slug = slugify(title)
  return `${origin.replace(/\/+$/, '')}/browse?event=${slug}`
}

/**
 * Heuristic: is this a UUID v4-shaped string?
 * Used so we keep accepting old ?event=<uuid> links while shipping slug links.
 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string | null | undefined): boolean {
  return !!value && UUID_RE.test(value)
}
