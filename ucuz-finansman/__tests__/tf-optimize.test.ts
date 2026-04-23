import { describe, it, expect } from 'vitest'
import {
  optimizeTF,
  type OptimizeInput,
} from '../lib/tf-optimize'
import { VADE_CAPS } from '../lib/karsilastirma-state'
import { karsilastirmaHesapla } from '../lib/hesaplamalar'

const MARKET = {
  orgPct: 8.5,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
}

describe('optimizeTF — sweep coverage', () => {
  it('evaluates every integer vade in [1, 120] for konut', () => {
    const result = optimizeTF({
      ...MARKET,
      tutar: 1_800_000,
      pesinat: 300_000,
      varlikTuru: 'konut',
      optimizeFor: 'taksit',
    })
    expect(result.allEvaluated.length).toBe(VADE_CAPS.konut)
    expect(result.allEvaluated[0].vade).toBe(1)
    expect(result.allEvaluated[result.allEvaluated.length - 1].vade).toBe(120)
  })

  it('evaluates every integer vade in [1, 60] for taşıt', () => {
    const result = optimizeTF({
      ...MARKET,
      pesinat: 100_000,
      taksit: 20_000,
      varlikTuru: 'tasit',
      optimizeFor: 'tutar',
    }, 10)
    expect(result.allEvaluated.length).toBe(VADE_CAPS.tasit)
    expect(result.allEvaluated[0].vade).toBe(1)
    expect(result.allEvaluated[result.allEvaluated.length - 1].vade).toBe(60)
  })
})

describe('optimizeTF — use case B: (tutar + peşinat) → optimize taksit', () => {
  const input: OptimizeInput = {
    ...MARKET,
    tutar: 1_800_000,
    pesinat: 300_000,
    varlikTuru: 'konut',
    optimizeFor: 'taksit',
  }

  it('returns at most topN options, sorted ascending by delta', () => {
    const result = optimizeTF(input, 3)
    expect(result.options.length).toBeLessThanOrEqual(3)
    expect(result.options.length).toBeGreaterThan(0)
    for (let i = 1; i < result.options.length; i++) {
      expect(result.options[i].delta).toBeGreaterThanOrEqual(result.options[i - 1].delta)
    }
  })

  it('each option has taksit = (tutar − peşinat) / vade', () => {
    const result = optimizeTF(input)
    for (const o of result.options) {
      expect(o.taksit).toBeCloseTo((1_800_000 - 300_000) / o.vade, 5)
    }
  })

  it('all returned options are feasible', () => {
    const result = optimizeTF(input)
    for (const o of result.options) expect(o.feasible).toBe(true)
  })

  it('global optimum really is the minimum across the full sweep', () => {
    const result = optimizeTF(input, 1)
    const feasible = result.allEvaluated.filter(o => o.feasible)
    const minDelta = Math.min(...feasible.map(o => o.delta))
    expect(result.options[0].delta).toBeCloseTo(minDelta, 6)
  })
})

describe('optimizeTF — use case C: (tutar + taksit) → optimize peşinat', () => {
  it('derived peşinat = tutar − taksit × vade for each option', () => {
    const result = optimizeTF({
      ...MARKET,
      tutar: 3_000_000,
      taksit: 20_000,
      varlikTuru: 'konut',
      optimizeFor: 'pesinat',
    })
    for (const o of result.options) {
      expect(o.pesinat).toBeCloseTo(3_000_000 - 20_000 * o.vade, 5)
    }
  })

  it('marks vades with negative derived peşinat as infeasible', () => {
    // tutar=600k, taksit=30k → pesinat = 600k - 30k*N. Negative when N > 20.
    const result = optimizeTF({
      ...MARKET,
      tutar: 600_000,
      taksit: 30_000,
      varlikTuru: 'konut',
      optimizeFor: 'pesinat',
    })
    const infeasible = result.allEvaluated.filter(o => !o.feasible)
    for (const o of infeasible) {
      expect(o.vade).toBeGreaterThan(20)
      expect(o.reason).toMatch(/negatif/)
    }
    for (const o of result.options) {
      expect(o.pesinat).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns no options when every vade is infeasible', () => {
    // Small tutar, huge taksit → no feasible N ≥ 1.
    const result = optimizeTF({
      ...MARKET,
      tutar: 10_000,
      taksit: 50_000,
      varlikTuru: 'konut',
      optimizeFor: 'pesinat',
    })
    expect(result.options.length).toBe(0)
  })
})

describe('optimizeTF — use case A: (peşinat + taksit) → optimize tutar', () => {
  it('derived tutar = peşinat + taksit × vade', () => {
    const result = optimizeTF({
      ...MARKET,
      pesinat: 200_000,
      taksit: 50_000,
      varlikTuru: 'konut',
      optimizeFor: 'tutar',
    })
    for (const o of result.options) {
      expect(o.tutar).toBeCloseTo(200_000 + 50_000 * o.vade, 5)
    }
    expect(result.options.length).toBeGreaterThan(0)
  })

  it('always feasible (tutar is constructed to satisfy invariant)', () => {
    const result = optimizeTF({
      ...MARKET,
      pesinat: 200_000,
      taksit: 50_000,
      varlikTuru: 'tasit',
      optimizeFor: 'tutar',
    })
    expect(result.options.length).toBe(3)
    for (const o of result.options) expect(o.feasible).toBe(true)
  })
})

describe('optimizeTF — agreement with karsilastirmaHesapla (cross-check)', () => {
  it('teslimAy, kalanVade, and delta match the main engine on a sample', () => {
    const result = optimizeTF({
      ...MARKET,
      tutar: 1_800_000,
      pesinat: 300_000,
      varlikTuru: 'konut',
      optimizeFor: 'taksit',
    })
    // Check a handful of N across the sweep (full 120-point cross-check is
    // slow because karsilastirmaHesapla also builds rows/cashflows).
    const sample = [5, 12, 24, 36, 60, 90, 120]
    for (const N of sample) {
      const o = result.allEvaluated.find(x => x.vade === N)
      if (!o || !o.feasible) continue
      const cross = karsilastirmaHesapla({
        tutar: o.tutar,
        pesinat: o.pesinat,
        orgPct: MARKET.orgPct,
        taksit0: o.taksit,
        takTuru: 'sabit',
        artisAy: 0,
        yeniTaksit: 0,
        krFaizAylik: MARKET.krFaizAylik,
        mevduatYillik: MARKET.mevduatYillik,
      })
      expect(o.teslimAy, `vade=${N} teslimAy`).toBe(cross.teslimAy)
      expect(o.kalanVade, `vade=${N} kalanVade`).toBe(cross.kalanVade)
      expect(o.delta, `vade=${N} delta`).toBeCloseTo(cross.tfToplam - cross.altToplam, -1)
    }
  })
})

describe('optimizeTF — tfAlwaysExpensive flag', () => {
  it('is true when current market makes TF lose across the whole sweep (r_m > r_b)', () => {
    // Current TR defaults: r_m = 40%/yıl ≈ 2.85%/ay, r_b = 2.49%/ay. r_m > r_b → TF loses.
    const result = optimizeTF({
      tutar: 1_800_000,
      pesinat: 300_000,
      orgPct: 8.5,
      krFaizAylik: 2.49,
      mevduatYillik: 40,
      varlikTuru: 'konut',
      optimizeFor: 'taksit',
    })
    expect(result.tfAlwaysExpensive).toBe(true)
    for (const o of result.options) expect(o.tfDahaUcuz).toBe(false)
  })

  it('flips to false when r_b is high enough relative to r_m', () => {
    const result = optimizeTF({
      tutar: 1_800_000,
      pesinat: 300_000,
      orgPct: 5,
      krFaizAylik: 4.5,       // ~70%/yıl kredi
      mevduatYillik: 10,      // modest deposit rate
      varlikTuru: 'konut',
      optimizeFor: 'taksit',
    })
    expect(result.tfAlwaysExpensive).toBe(false)
    expect(result.options[0].tfDahaUcuz).toBe(true)
  })
})

describe('optimizeTF — edge cases', () => {
  it('handles zero banka faizi (r_b = 0) without division by zero', () => {
    const result = optimizeTF({
      tutar: 1_000_000,
      pesinat: 200_000,
      orgPct: 0,
      krFaizAylik: 0,
      mevduatYillik: 10,
      varlikTuru: 'konut',
      optimizeFor: 'taksit',
    })
    for (const o of result.options) {
      expect(Number.isFinite(o.esdegerBankaTaksiti)).toBe(true)
      expect(Number.isFinite(o.delta)).toBe(true)
    }
  })

  it('handles zero mevduat faizi (r_m = 0)', () => {
    const result = optimizeTF({
      tutar: 1_000_000,
      pesinat: 200_000,
      orgPct: 5,
      krFaizAylik: 2,
      mevduatYillik: 0,
      varlikTuru: 'konut',
      optimizeFor: 'taksit',
    })
    for (const o of result.options) {
      expect(Number.isFinite(o.delta)).toBe(true)
    }
  })
})
