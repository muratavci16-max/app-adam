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
import type {
  OptimizerFormState,
  OptimizerMarketState,
} from './optimizer-state'
import type { OptimizeCase } from './tf-optimize'

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

// ─── Optimizer URL helpers ─────────────────────────────────────────────────
// Deep-linkable state for /optimizasyon. Separate from the Karşılaştırma
// helpers above because the optimizer has a different state shape
// (optimizeFor instead of primaryField; one field is always undefined).

export interface OptimizerUrlInput {
  mode?: OptimizeCase
  tutar?: number
  pesinat?: number
  taksit?: number
  orgPct?: number
  krFaiz?: number
  mevduatYillik?: number
  varlikTuru?: VarlikTuru
}

function isOptimizeCase(v: unknown): v is OptimizeCase {
  return v === 'tutar' || v === 'taksit' || v === 'pesinat'
}

/**
 * Parse optimizer URL params. Mode defaults to 'taksit' when absent or
 * invalid (matches the in-app default).
 *
 * If the URL carries a value for the field that IS the derived output
 * (e.g. ?mode=taksit&taksit=60000), the value is discarded — mode wins.
 */
export function parseOptimizerUrl(
  searchParams: URLSearchParams,
): OptimizerUrlInput {
  const out: OptimizerUrlInput = {}

  const rawMode = searchParams.get('mode')
  out.mode = isOptimizeCase(rawMode) ? rawMode : 'taksit'

  // Read the three value fields but drop whichever one is the derived output.
  const tutar = readNonNegative(searchParams, 'tutar')
  const pesinat = readNonNegative(searchParams, 'pesinat')
  const taksit = readNonNegative(searchParams, 'taksit')
  if (tutar !== undefined && out.mode !== 'tutar') out.tutar = tutar
  if (pesinat !== undefined && out.mode !== 'pesinat') out.pesinat = pesinat
  if (taksit !== undefined && out.mode !== 'taksit') out.taksit = taksit

  const orgPct = readNonNegative(searchParams, 'orgPct')
  if (orgPct !== undefined) out.orgPct = orgPct

  // Accept both 'krFaiz' (canonical) and 'kr_faiz' (legacy hero form).
  const krFaiz = readNonNegative(searchParams, 'krFaiz')
    ?? readNonNegative(searchParams, 'kr_faiz')
  if (krFaiz !== undefined) out.krFaiz = krFaiz

  // Accept both 'mevduatYillik' and 'mevduat_y' (legacy hero form).
  const mevduatYillik = readNonNegative(searchParams, 'mevduatYillik')
    ?? readNonNegative(searchParams, 'mevduat_y')
  if (mevduatYillik !== undefined) out.mevduatYillik = mevduatYillik

  const rawVarlik = searchParams.get('varlikTuru')
  if (isVarlikTuru(rawVarlik)) out.varlikTuru = rawVarlik

  return out
}

/**
 * Build initial OptimizerFormState + market state from URL params + defaults.
 * The derived field (per mode) is forced to `undefined` regardless of URL.
 */
export function resolveOptimizerInitialState(
  urlInput: OptimizerUrlInput,
  defaults: {
    orgPct: number
    krFaizAylik: number
    mevduatYillik: number
    varlikTuru?: VarlikTuru
  },
): { form: OptimizerFormState; market: OptimizerMarketState } {
  const mode: OptimizeCase = urlInput.mode ?? 'taksit'
  const varlikTuru: VarlikTuru =
    urlInput.varlikTuru ?? defaults.varlikTuru ?? DEFAULT_VARLIK

  const form: OptimizerFormState = {
    optimizeFor: mode,
    tutar: mode === 'tutar' ? undefined : urlInput.tutar,
    pesinat: mode === 'pesinat' ? undefined : urlInput.pesinat,
    taksit: mode === 'taksit' ? undefined : urlInput.taksit,
    varlikTuru,
  }

  const market: OptimizerMarketState = {
    orgPct: urlInput.orgPct ?? defaults.orgPct,
    krFaizAylik: urlInput.krFaiz ?? defaults.krFaizAylik,
    mevduatYillik: urlInput.mevduatYillik ?? defaults.mevduatYillik,
  }

  return { form, market }
}

/**
 * Serialize the optimizer state back to URL params — useful for the hero CTA
 * and for "push to /karsilastirma" integration in OptionCard.
 */
export function serializeOptimizerState(
  form: OptimizerFormState,
  market: OptimizerMarketState,
): URLSearchParams {
  const sp = new URLSearchParams()
  sp.set('mode', form.optimizeFor)
  if (form.optimizeFor !== 'tutar' && form.tutar != null) sp.set('tutar', String(form.tutar))
  if (form.optimizeFor !== 'pesinat' && form.pesinat != null) sp.set('pesinat', String(form.pesinat))
  if (form.optimizeFor !== 'taksit' && form.taksit != null) sp.set('taksit', String(form.taksit))
  sp.set('orgPct', String(market.orgPct))
  sp.set('krFaiz', String(market.krFaizAylik))
  sp.set('mevduatYillik', String(market.mevduatYillik))
  sp.set('varlikTuru', form.varlikTuru)
  return sp
}
