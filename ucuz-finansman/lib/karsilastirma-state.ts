// Pure state-machine logic for the Karşılaştırma form.
// No React / DOM / side effects — safe to import from tests and from
// (eventually) KarsilastirmaClient.tsx.
//
// Invariant maintained by every handler:
//   tutar − pesinat = taksit × months           (within 0.01 float tolerance)
//
// Handlers reject degenerate inputs (NaN, Infinity, non-positive taksit, …)
// by returning the incoming state unchanged. Clamping rules are documented on
// each handler.

export type PrimaryField = 'tutar' | 'taksit'

// Varlık türleri — Yönetmelik m. 22/3 ile belirlenen azami vadeler:
//   konut ve çatılı iş yeri: 120 ay
//   taşıt:                    60 ay
export type VarlikTuru = 'konut' | 'isyeri' | 'tasit'

export const VADE_CAPS: Record<VarlikTuru, number> = {
  konut: 120,
  isyeri: 120,
  tasit: 60,
}

export const DEFAULT_VARLIK: VarlikTuru = 'konut'

export function getMaxMonths(v: VarlikTuru): number {
  return VADE_CAPS[v]
}

export function isVarlikTuru(v: unknown): v is VarlikTuru {
  return v === 'konut' || v === 'isyeri' || v === 'tasit'
}

export interface KarsilastirmaFormState {
  tutar: number
  pesinat: number
  taksit: number
  months: number
  primaryField: PrimaryField
  varlikTuru: VarlikTuru
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const MIN_MONTHS = 1

function isUsableNumber(v: number): boolean {
  return Number.isFinite(v)
}

/**
 * Clamp months to [1, VADE_CAPS[varlikTuru]].
 * varlikTuru defaults to 'konut' for backwards compatibility.
 *  - NaN           → MIN_MONTHS (1)
 *  - -Infinity     → MIN_MONTHS (1)
 *  - +Infinity     → max for this asset type
 *  - negative/zero → MIN_MONTHS (1)
 *  - fractional    → Math.floor first
 * Source: Yönetmelik m. 22/3.
 */
export function clampMonths(val: number, varlikTuru: VarlikTuru = DEFAULT_VARLIK): number {
  const max = getMaxMonths(varlikTuru)
  if (Number.isNaN(val)) return MIN_MONTHS
  if (val === Number.POSITIVE_INFINITY) return max
  if (val === Number.NEGATIVE_INFINITY) return MIN_MONTHS
  const floored = Math.floor(val)
  if (floored < MIN_MONTHS) return MIN_MONTHS
  if (floored > max) return max
  return floored
}

/**
 * Structural validity check. State is valid when:
 *  - all numeric fields are finite
 *  - tutar, pesinat, taksit ≥ 0
 *  - months ∈ [1, VADE_CAPS[varlikTuru]]
 *  - pesinat ≤ tutar
 *  - invariant tutar − pesinat ≈ taksit × months (0.01 tolerance)
 */
export function isValidFormState(s: KarsilastirmaFormState): boolean {
  if (!s) return false
  if (!isUsableNumber(s.tutar) || !isUsableNumber(s.pesinat)) return false
  if (!isUsableNumber(s.taksit) || !isUsableNumber(s.months)) return false
  if (s.tutar < 0 || s.pesinat < 0 || s.taksit < 0) return false
  if (!isVarlikTuru(s.varlikTuru)) return false
  const maxMonths = getMaxMonths(s.varlikTuru)
  if (s.months < MIN_MONTHS || s.months > maxMonths) return false
  if (s.pesinat > s.tutar + 0.01) return false
  if (s.primaryField !== 'tutar' && s.primaryField !== 'taksit') return false
  const expected = s.taksit * s.months
  const actual = s.tutar - s.pesinat
  return Math.abs(expected - actual) <= 0.01
}

// ─── Handlers ──────────────────────────────────────────────────────────────

/**
 * Tutar değiştiğinde:
 *  - NaN / Infinity           → state unchanged
 *  - val < 0  veya val < pesinat → clamp to pesinat (kalan negatif olamaz)
 *  - months ∈ [1, 120] zaten korunuyor
 *  - taksit = (tutar − pesinat) / months olarak yeniden hesaplanır
 *  - primaryField = 'tutar'
 */
export function handleTutarChange(
  state: KarsilastirmaFormState,
  val: number,
): KarsilastirmaFormState {
  if (!isUsableNumber(val)) return state

  const months = clampMonths(state.months, state.varlikTuru)
  const pesinat = Math.max(0, state.pesinat)
  const tutar = val < pesinat ? pesinat : val
  const taksit = (tutar - pesinat) / months

  return {
    tutar,
    pesinat,
    taksit,
    months,
    primaryField: 'tutar',
    varlikTuru: state.varlikTuru,
  }
}

/**
 * Taksit değiştiğinde:
 *  - NaN / Infinity / val ≤ 0 → reddet (state unchanged)
 *  - tutar = pesinat + taksit × months
 *  - primaryField = 'taksit'
 */
export function handleTaksitChange(
  state: KarsilastirmaFormState,
  val: number,
): KarsilastirmaFormState {
  if (!isUsableNumber(val)) return state
  if (val <= 0) return state

  const months = clampMonths(state.months, state.varlikTuru)
  const pesinat = Math.max(0, state.pesinat)
  const tutar = pesinat + val * months

  return {
    tutar,
    pesinat,
    taksit: val,
    months,
    primaryField: 'taksit',
    varlikTuru: state.varlikTuru,
  }
}

/**
 * Peşinat değiştiğinde:
 *  - NaN / Infinity → state unchanged
 *  - val < 0 → clamp to 0
 *  - peşinat > tutar ise peşinat tutar'a clamp'lenir
 *  - primaryField = 'tutar' → taksit yeniden hesaplanır
 *  - primaryField = 'taksit' → tutar yeniden hesaplanır
 */
export function handlePesinatChange(
  state: KarsilastirmaFormState,
  val: number,
): KarsilastirmaFormState {
  if (!isUsableNumber(val)) return state

  const months = clampMonths(state.months, state.varlikTuru)
  const pesinat = Math.max(0, val)

  if (state.primaryField === 'taksit') {
    // taksit sabit, tutar türet
    if (!isUsableNumber(state.taksit) || state.taksit <= 0) return state
    const tutar = pesinat + state.taksit * months
    return {
      tutar,
      pesinat,
      taksit: state.taksit,
      months,
      primaryField: 'taksit',
      varlikTuru: state.varlikTuru,
    }
  }

  // primaryField === 'tutar' → tutar sabit (peşinat > tutar ise tutar'a çek)
  const clampedPesinat = pesinat > state.tutar ? state.tutar : pesinat
  const taksit = (state.tutar - clampedPesinat) / months
  return {
    tutar: state.tutar,
    pesinat: clampedPesinat,
    taksit,
    months,
    primaryField: 'tutar',
    varlikTuru: state.varlikTuru,
  }
}

/**
 * Ay sayısı değiştiğinde:
 *  - NaN / Infinity → state unchanged
 *  - daima [1, 120] aralığına clamp
 *  - primaryField = 'tutar'  → taksit yeniden hesaplanır (tutar sabit)
 *  - primaryField = 'taksit' → tutar yeniden hesaplanır (taksit sabit)
 */
export function handleMonthsChange(
  state: KarsilastirmaFormState,
  val: number,
): KarsilastirmaFormState {
  // NaN is rejected outright; ±Infinity flows through clampMonths so that
  // callers can use `Number.POSITIVE_INFINITY` as a shorthand for the asset-type cap.
  if (Number.isNaN(val)) return state

  const months = clampMonths(val, state.varlikTuru)
  const pesinat = Math.max(0, state.pesinat)

  if (state.primaryField === 'taksit') {
    if (!isUsableNumber(state.taksit) || state.taksit <= 0) return state
    const tutar = pesinat + state.taksit * months
    return {
      tutar,
      pesinat,
      taksit: state.taksit,
      months,
      primaryField: 'taksit',
      varlikTuru: state.varlikTuru,
    }
  }

  // primaryField === 'tutar' → tutar sabit
  const tutar = Math.max(pesinat, state.tutar)
  const taksit = (tutar - pesinat) / months
  return {
    tutar,
    pesinat,
    taksit,
    months,
    primaryField: 'tutar',
    varlikTuru: state.varlikTuru,
  }
}

/**
 * Varlık türü değiştiğinde:
 *  - months yeni cap'e göre re-clamp'lenir (konut→taşıt geçişinde 120→60 düşebilir)
 *  - primaryField = 'tutar'  → tutar sabit, taksit yeniden
 *  - primaryField = 'taksit' → taksit sabit, tutar yeniden
 * Source: Yönetmelik m. 22/3.
 */
export function handleVarlikTuruChange(
  state: KarsilastirmaFormState,
  next: VarlikTuru,
): KarsilastirmaFormState {
  if (!isVarlikTuru(next)) return state
  if (next === state.varlikTuru) return state

  const months = clampMonths(state.months, next)
  const pesinat = Math.max(0, state.pesinat)

  if (state.primaryField === 'taksit') {
    if (!isUsableNumber(state.taksit) || state.taksit <= 0) {
      return { ...state, varlikTuru: next, months }
    }
    const tutar = pesinat + state.taksit * months
    return {
      tutar,
      pesinat,
      taksit: state.taksit,
      months,
      primaryField: 'taksit',
      varlikTuru: next,
    }
  }

  const tutar = Math.max(pesinat, state.tutar)
  const taksit = months > 0 ? (tutar - pesinat) / months : 0
  return {
    tutar,
    pesinat,
    taksit,
    months,
    primaryField: 'tutar',
    varlikTuru: next,
  }
}
