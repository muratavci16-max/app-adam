// Resolves a post-login redirect target from a raw query param.
// Accepts only internal relative paths beginning with a single '/'.
// Rejects null, external URLs, protocol-relative ('//...'), and non-prefixed paths.
export function resolveRedirect(raw: string | null): string {
  const DEFAULT = '/hesaplamarim'
  if (!raw) return DEFAULT
  if (raw[0] !== '/') return DEFAULT
  if (raw.length > 1 && raw[1] === '/') return DEFAULT
  return raw
}
