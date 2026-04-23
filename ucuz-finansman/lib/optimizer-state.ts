// Pure state machine for the /optimizasyon form.
//
// The form has ONE free variable (optimizeFor) that picks which of
// {tutar, peşinat, taksit} is the DERIVED output. The other two are
// user-provided inputs. Switching mode clears the newly-derived field;
// the two input fields are preserved.
//
// No React / DOM / Next.js imports — safe for tests and pure-function reuse.

import {
  DEFAULT_VARLIK,
  isVarlikTuru,
  type VarlikTuru,
} from './karsilastirma-state'
import type { OptimizeCase, OptimizeInput } from './tf-optimize'

export interface OptimizerFormState {
  optimizeFor: OptimizeCase         // which field is derived
  tutar?: number                    // undefined when optimizeFor === 'tutar'
  pesinat?: number                  // undefined when optimizeFor === 'pesinat'
  taksit?: number                   // undefined when optimizeFor === 'taksit'
  varlikTuru: VarlikTuru
}

export interface OptimizerMarketState {
  orgPct: number                    // UI scale (e.g. 8.5 for 8.5%)
  krFaizAylik: number
  mevduatYillik: number
}

/**
 * Default mode is 'taksit' (Mode B) — rho fixed, mathematically simplest,
 * and covers the most common user scenario (known asset price + cash on hand).
 */
export const DEFAULT_OPTIMIZER_STATE: OptimizerFormState = {
  optimizeFor: 'taksit',
  tutar: undefined,
  pesinat: undefined,
  taksit: undefined,
  varlikTuru: DEFAULT_VARLIK,
}

function isValid(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
}

/**
 * Change which field is the derived output. Clears the newly-derived field;
 * preserves the other two (so the user doesn't lose work on mode toggles).
 * No-op when next === current.
 */
export function handleOptimizeForChange(
  state: OptimizerFormState,
  next: OptimizeCase,
): OptimizerFormState {
  if (next === state.optimizeFor) return state
  return {
    ...state,
    optimizeFor: next,
    [next]: undefined,
  }
}

/** Set tutar. Ignored (no-op) when tutar is the derived field. */
export function handleTutarChange(
  state: OptimizerFormState,
  val: number,
): OptimizerFormState {
  if (state.optimizeFor === 'tutar') return state
  if (!isValid(val)) return state
  return { ...state, tutar: val }
}

/** Set peşinat. Ignored when peşinat is the derived field. */
export function handlePesinatChange(
  state: OptimizerFormState,
  val: number,
): OptimizerFormState {
  if (state.optimizeFor === 'pesinat') return state
  if (!isValid(val)) return state
  return { ...state, pesinat: val }
}

/** Set taksit. Ignored when taksit is the derived field. */
export function handleTaksitChange(
  state: OptimizerFormState,
  val: number,
): OptimizerFormState {
  if (state.optimizeFor === 'taksit') return state
  if (!isValid(val)) return state
  return { ...state, taksit: val }
}

/**
 * Change varlık türü. Does NOT clear input fields — unlike karsilastirma-state
 * which re-clamps months, here we just pass the new cap to the optimizer
 * via toOptimizeInput; per-N feasibility filtering happens inside optimizeTF.
 */
export function handleVarlikTuruChange(
  state: OptimizerFormState,
  next: VarlikTuru,
): OptimizerFormState {
  if (!isVarlikTuru(next)) return state
  if (next === state.varlikTuru) return state
  return { ...state, varlikTuru: next }
}

/**
 * Build the OptimizeInput for `optimizeTF`. Returns null when any required
 * (non-derived) field is missing or invalid — callers should render an
 * empty/placeholder state when this returns null rather than trying to run
 * the optimizer with partial inputs.
 */
export function toOptimizeInput(
  state: OptimizerFormState,
  market: OptimizerMarketState,
): OptimizeInput | null {
  // Every non-derived field must be a non-negative finite number.
  for (const key of ['tutar', 'pesinat', 'taksit'] as const) {
    if (key === state.optimizeFor) continue
    if (!isValid(state[key])) return null
  }
  if (!isValid(market.orgPct)) return null
  if (!isValid(market.krFaizAylik)) return null
  if (!isValid(market.mevduatYillik)) return null
  if (!isVarlikTuru(state.varlikTuru)) return null

  return {
    tutar: state.optimizeFor === 'tutar' ? undefined : state.tutar,
    pesinat: state.optimizeFor === 'pesinat' ? undefined : state.pesinat,
    taksit: state.optimizeFor === 'taksit' ? undefined : state.taksit,
    orgPct: market.orgPct,
    krFaizAylik: market.krFaizAylik,
    mevduatYillik: market.mevduatYillik,
    varlikTuru: state.varlikTuru,
    optimizeFor: state.optimizeFor,
  }
}

/**
 * Structural validity check (for components that want a boolean rather than
 * calling toOptimizeInput and checking null).
 */
export function isOptimizerReady(
  state: OptimizerFormState,
  market: OptimizerMarketState,
): boolean {
  return toOptimizeInput(state, market) !== null
}
