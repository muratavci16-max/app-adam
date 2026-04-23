// TF Calculator — optimization helper.
//
// Given any TWO of {tutar, peşinat, taksit}, sweeps every integer vade N in
// [1, VADE_CAPS[varlikTuru]] and returns the top K configurations ranked by
// Delta = C_TF − C_alt, where C_TF is total TF cost and C_alt is the
// conventional mevduat+kredi alternative. Negative Delta → TF cheaper.
//
// The optimization knob is vade (N). The remaining variable of the trio
// {tutar, peşinat, taksit} is DERIVED from the invariant:
//     taksit × vade = tutar − peşinat
//
// Why brute force over every integer: N is 1..120 at most (konut/işyeri),
// 1..60 for taşıt. Each evaluation is simple arithmetic + two Math.pow calls.
// Total cost is well under 1 ms even on mobile JS engines, so algorithmic
// shortcuts (plateau enumeration, ternary search, continuous relaxation) buy
// little and risk missing the integer optimum near ceil-boundaries of the
// three-gate rule. Brute force is exhaustive and deterministic.
//
// See /Users/sezaiavci/.claude/plans/tender-knitting-cherny.md §Verified rule
// for the underlying delivery-gate math, and the JSDoc in lib/hesaplamalar.ts
// for the BDDK-mevzuat basis of the three-gate rule.

import {
  getMaxMonths,
  type VarlikTuru,
} from './karsilastirma-state'

/** Which variable the optimizer is solving FOR (i.e. deriving). */
export type OptimizeCase = 'tutar' | 'taksit' | 'pesinat'

export interface OptimizeInput {
  /** Contract amount. Required unless optimizeFor === 'tutar'. */
  tutar?: number
  /** Peşinat. Required unless optimizeFor === 'pesinat'. */
  pesinat?: number
  /** Aylık taksit. Required unless optimizeFor === 'taksit'. */
  taksit?: number
  /** Organizasyon ücreti, percent (UI format — e.g. 8.5 for 8.5%). */
  orgPct: number
  /** Banka aylık kredi faizi, percent (UI format — e.g. 2.49 for 2.49%). */
  krFaizAylik: number
  /** Banka yıllık mevduat faizi, percent (UI format — e.g. 40 for 40%). */
  mevduatYillik: number
  /** Asset type (drives VADE_MENU). */
  varlikTuru: VarlikTuru
  /** Which variable the optimizer derives. The other two must be provided. */
  optimizeFor: OptimizeCase
}

export interface OptimizeOption {
  vade: number                  // N (ay)
  tutar: number                 // T
  pesinat: number               // P
  taksit: number                // k
  teslimAy: number              // d
  kalanVade: number             // M = N - d + 1
  krediIhtiyaci: number         // L = max(0, T - B_d)
  esdegerBankaTaksiti: number   // k_b = L * phi_M
  delta: number                 // C_TF - C_alt  (negative → TF cheaper)
  tfDahaUcuz: boolean           // delta < 0
  feasible: boolean             // false when derived variable is out of range
  reason?: string               // if infeasible, why
}

export interface OptimizeResult {
  options: OptimizeOption[]     // top-N feasible options, sorted ascending by delta
  allEvaluated: OptimizeOption[] // every vade in the menu, including infeasible (for heatmap/diagnostic)
  tfAlwaysExpensive: boolean    // true when no feasible option has delta < 0
}

/**
 * Three-gate teslim ayı rule. Mirror of the logic in lib/hesaplamalar.ts
 * (kept in sync by __tests__/tf-optimize.test.ts which cross-checks with
 * karsilastirmaHesapla output).
 *
 * Mevzuat: BDDK Yönetmelik m. 21/2-a + m. 21/3 (güncel metin 30.05.2025).
 */
function threeGate(rho: number, N: number): number {
  const t_tas = rho < 0.40
    ? Math.ceil((0.40 - rho) * N / (1 - rho))
    : 1
  const t_sure = Math.max(
    Math.min(5, N),
    Math.ceil(0.40 * N * (1 - rho)),
  )
  return Math.min(N, Math.max(t_tas, t_sure))
}

/**
 * Evaluate one (T, P, N) point. Pure arithmetic — no iteration, no React.
 *
 * Formulas (see docs in this file for derivation):
 *   k      = (T - P) / N                  (invariant)
 *   rho    = P / T
 *   d      = three_gate(rho, N)
 *   M      = N - d + 1
 *   A_d    = (1 + r_m)^(d - 1)
 *   S_d    = ((1 + r_m)^(d - 1) - 1) / r_m
 *   B_d    = (P + alpha * T) * A_d + k * S_d
 *   L      = max(0, T - B_d)
 *   phi_M  = r_b (1 + r_b)^M / ((1 + r_b)^M - 1)
 *   k_b    = L * phi_M
 *   Delta  = M * (k - k_b)
 */
function evaluate(
  T: number,
  P: number,
  N: number,
  alpha: number,
  r_b: number,
  r_m: number,
): Omit<OptimizeOption, 'feasible' | 'reason'> {
  const k = N > 0 ? (T - P) / N : 0
  const rho = T > 0 ? P / T : 0
  const d = threeGate(rho, N)
  const M = Math.max(0, N - d + 1)
  const A_d = Math.pow(1 + r_m, d - 1)
  const S_d = r_m === 0 ? (d - 1) : (A_d - 1) / r_m
  const B_d = (P + alpha * T) * A_d + k * S_d
  const L = Math.max(0, T - B_d)
  const phi_M = (() => {
    if (M <= 0) return 0
    if (r_b === 0) return 1 / M
    return (r_b * Math.pow(1 + r_b, M)) / (Math.pow(1 + r_b, M) - 1)
  })()
  const k_b = L * phi_M
  const delta = M * (k - k_b)
  return {
    vade: N,
    tutar: T,
    pesinat: P,
    taksit: k,
    teslimAy: d,
    kalanVade: M,
    krediIhtiyaci: L,
    esdegerBankaTaksiti: k_b,
    delta,
    tfDahaUcuz: delta < 0,
  }
}

/**
 * Run the optimizer. Sweeps every integer vade N in [1, maxMonths] and
 * returns the top K options (default 3) ranked by delta.
 *
 * At most 120 evaluations (konut/işyeri) or 60 (taşıt). Each is arithmetic
 * + two Math.pow calls; well under 1 ms total on modern JS engines.
 */
export function optimizeTF(input: OptimizeInput, topN = 3): OptimizeResult {
  const alpha = input.orgPct / 100
  const r_b = input.krFaizAylik / 100
  // Convert annual → monthly compounding.
  const r_m = Math.pow(1 + input.mevduatYillik / 100, 1 / 12) - 1

  const maxN = getMaxMonths(input.varlikTuru)
  const allEvaluated: OptimizeOption[] = []

  for (let N = 1; N <= maxN; N++) {
    let T: number
    let P: number
    let reason: string | undefined

    switch (input.optimizeFor) {
      case 'tutar': {
        if (input.pesinat == null || input.taksit == null) {
          reason = 'peşinat ve taksit girdileri gerekli'
          allEvaluated.push({
            ...evaluate(0, 0, N, alpha, r_b, r_m),
            feasible: false,
            reason,
          })
          continue
        }
        P = input.pesinat
        T = P + input.taksit * N
        break
      }
      case 'taksit': {
        if (input.tutar == null || input.pesinat == null) {
          reason = 'tutar ve peşinat girdileri gerekli'
          allEvaluated.push({
            ...evaluate(0, 0, N, alpha, r_b, r_m),
            feasible: false,
            reason,
          })
          continue
        }
        T = input.tutar
        P = input.pesinat
        if (P > T) {
          allEvaluated.push({
            ...evaluate(T, P, N, alpha, r_b, r_m),
            feasible: false,
            reason: 'peşinat sözleşme tutarından büyük',
          })
          continue
        }
        break
      }
      case 'pesinat': {
        if (input.tutar == null || input.taksit == null) {
          reason = 'tutar ve taksit girdileri gerekli'
          allEvaluated.push({
            ...evaluate(0, 0, N, alpha, r_b, r_m),
            feasible: false,
            reason,
          })
          continue
        }
        T = input.tutar
        P = T - input.taksit * N
        if (P < 0) {
          allEvaluated.push({
            ...evaluate(T, 0, N, alpha, r_b, r_m),
            feasible: false,
            reason: `taksit × vade = ${(input.taksit * N).toLocaleString('tr-TR')} TL > tutar — peşinat negatif olur`,
          })
          continue
        }
        break
      }
    }

    allEvaluated.push({
      ...evaluate(T, P, N, alpha, r_b, r_m),
      feasible: true,
    })
  }

  const feasible = allEvaluated.filter(o => o.feasible)
  const sorted = [...feasible].sort((a, b) => a.delta - b.delta)
  const options = sorted.slice(0, topN)
  const tfAlwaysExpensive = feasible.length > 0 && feasible.every(o => !o.tfDahaUcuz)

  return { options, allEvaluated, tfAlwaysExpensive }
}
