// Pure URL-param parsing for the Karşılaştırma page.
// No React / DOM / Next.js imports — takes a plain URLSearchParams and
// returns a validated input object.
//
// Presence rule: a param is considered *present* only when
//   Number.isFinite(x) && x >= 0
// — never `||` coercion (so legitimate 0 survives, "abc" / NaN / -1 are absent).

import {
  clampMonths,
  DEFAULT_VARLIK,
  isVarlikTuru,
  type KarsilastirmaFormState,
  type PrimaryField,
  type VarlikTuru,
} from './karsilastirma-state'

export interface KarsilastirmaUrlInput {
  tutar?: number
  pesinat?: number
  taksit?: number
  months?: number
  orgPct?: number
  krFaiz?: number
  mevduatYillik?: number
  varlikTuru?: VarlikTuru
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Parse a query-param value as a non-negative finite number.
 * Returns `undefined` for:
 *   - missing (`null`) params
 *   - empty / whitespace-only strings
 *   - non-numeric strings ("abc")
 *   - NaN / ±Infinity
 *   - negative numbers (caller can override per-field if needed)
 *
 * IMPORTANT: does NOT use `||` — so `"0"` returns `0`, not `undefined`.
 */
function readNonNegative(
  sp: URLSearchParams,
  key: string,
): number | undefined {
  const raw = sp.get(key)
  if (raw === null) return undefined
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return undefined
  if (n < 0) return undefined
  return n
}

// ─── parseKarsilastirmaUrl ─────────────────────────────────────────────────

export function parseKarsilastirmaUrl(
  searchParams: URLSearchParams,
): KarsilastirmaUrlInput {
  const out: KarsilastirmaUrlInput = {}

  const tutar = readNonNegative(searchParams, 'tutar')
  if (tutar !== undefined) out.tutar = tutar

  const pesinat = readNonNegative(searchParams, 'pesinat')
  if (pesinat !== undefined) out.pesinat = pesinat

  const taksit = readNonNegative(searchParams, 'taksit')
  if (taksit !== undefined) out.taksit = taksit

  // varlikTuru must be resolved BEFORE months so clampMonths uses the right cap
  const rawVarlik = searchParams.get('varlikTuru')
  const varlikTuru: VarlikTuru = isVarlikTuru(rawVarlik) ? rawVarlik : DEFAULT_VARLIK
  out.varlikTuru = varlikTuru

  const months = readNonNegative(searchParams, 'months')
  if (months !== undefined) out.months = clampMonths(months, varlikTuru)

  const orgPct = readNonNegative(searchParams, 'orgPct')
  if (orgPct !== undefined) out.orgPct = orgPct

  const krFaiz = readNonNegative(searchParams, 'krFaiz')
  if (krFaiz !== undefined) out.krFaiz = krFaiz

  const mevduatYillik = readNonNegative(searchParams, 'mevduatYillik')
  if (mevduatYillik !== undefined) out.mevduatYillik = mevduatYillik

  return out
}

// ─── resolveInitialState ──────────────────────────────────────────────────

/**
 * Build the initial form state from URL params + defaults.
 *
 * Precedence:
 *  1. Both `tutar` and `taksit` present → tutar wins, taksit recomputed.
 *     primaryField = 'tutar'.
 *  2. Only `taksit` present → primaryField = 'taksit', tutar computed.
 *  3. Only `tutar` present (or neither) → primaryField = 'tutar'.
 *
 * Validity is judged by `Number.isFinite(x) && x >= 0` — NOT by
 * `searchParams.has(key)` — so `?tutar=abc&taksit=100000` picks taksit.
 *
 * Months always clamped to [1, 120]. Peşinat > tutar ⇒ peşinat clamped to
 * tutar to guarantee a non-negative taksit.
 */
export function resolveInitialState(
  urlInput: KarsilastirmaUrlInput,
  defaults: { tutar: number; pesinat: number; taksit: number; months: number; varlikTuru?: VarlikTuru },
): KarsilastirmaFormState {
  const varlikTuru: VarlikTuru = urlInput.varlikTuru ?? defaults.varlikTuru ?? DEFAULT_VARLIK

  const months = clampMonths(
    urlInput.months !== undefined ? urlInput.months : defaults.months,
    varlikTuru,
  )

  const hasTutar = urlInput.tutar !== undefined
  const hasTaksit = urlInput.taksit !== undefined

  let pesinat =
    urlInput.pesinat !== undefined ? urlInput.pesinat : defaults.pesinat
  if (!Number.isFinite(pesinat) || pesinat < 0) pesinat = 0

  let tutar: number
  let taksit: number
  let primaryField: PrimaryField

  if (hasTutar) {
    // Tutar is authoritative (wins over taksit if both present).
    tutar = urlInput.tutar as number
    if (pesinat > tutar) pesinat = tutar
    taksit = (tutar - pesinat) / months
    primaryField = 'tutar'
  } else if (hasTaksit) {
    taksit = urlInput.taksit as number
    tutar = pesinat + taksit * months
    primaryField = 'taksit'
  } else {
    tutar = defaults.tutar
    if (pesinat > tutar) pesinat = tutar
    taksit = (tutar - pesinat) / months
    primaryField = 'tutar'
  }

  // IMPORTANT: do NOT round here — rounding each field independently breaks
  // the `tutar − pesinat = taksit × months` invariant (e.g. 1 000 000 / 36).
  // Display-layer formatting is the caller's responsibility.
  return {
    tutar,
    pesinat,
    taksit,
    months,
    primaryField,
    varlikTuru,
  }
}
