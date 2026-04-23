import { describe, it, expect } from 'vitest'
import {
  DEFAULT_OPTIMIZER_STATE,
  handleOptimizeForChange,
  handleTutarChange,
  handlePesinatChange,
  handleTaksitChange,
  handleVarlikTuruChange,
  toOptimizeInput,
  isOptimizerReady,
  type OptimizerFormState,
  type OptimizerMarketState,
} from '../lib/optimizer-state'

const MARKET: OptimizerMarketState = {
  orgPct: 8.5,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
}

function makeState(over: Partial<OptimizerFormState> = {}): OptimizerFormState {
  return { ...DEFAULT_OPTIMIZER_STATE, ...over }
}

describe('DEFAULT_OPTIMIZER_STATE', () => {
  it('defaults optimizeFor to "taksit" (Mode B, simplest)', () => {
    expect(DEFAULT_OPTIMIZER_STATE.optimizeFor).toBe('taksit')
  })

  it('all three value fields start undefined', () => {
    expect(DEFAULT_OPTIMIZER_STATE.tutar).toBeUndefined()
    expect(DEFAULT_OPTIMIZER_STATE.pesinat).toBeUndefined()
    expect(DEFAULT_OPTIMIZER_STATE.taksit).toBeUndefined()
  })

  it('varlikTuru defaults to konut', () => {
    expect(DEFAULT_OPTIMIZER_STATE.varlikTuru).toBe('konut')
  })
})

describe('handleOptimizeForChange', () => {
  it('taksit → tutar clears tutar (now derived), preserves pesinat + taksit', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000, taksit: undefined })
    const next = handleOptimizeForChange(s, 'tutar')
    expect(next.optimizeFor).toBe('tutar')
    expect(next.tutar).toBeUndefined()
    expect(next.pesinat).toBe(300_000)
  })

  it('tutar → pesinat clears pesinat (now derived), preserves tutar + taksit', () => {
    const s = makeState({ optimizeFor: 'tutar', tutar: undefined, pesinat: 300_000, taksit: 60_000 })
    const next = handleOptimizeForChange(s, 'pesinat')
    expect(next.optimizeFor).toBe('pesinat')
    expect(next.pesinat).toBeUndefined()
    expect(next.taksit).toBe(60_000)
  })

  it('pesinat → taksit clears taksit (now derived), preserves tutar + pesinat', () => {
    const s = makeState({ optimizeFor: 'pesinat', tutar: 1_800_000, pesinat: undefined, taksit: 60_000 })
    const next = handleOptimizeForChange(s, 'taksit')
    expect(next.optimizeFor).toBe('taksit')
    expect(next.taksit).toBeUndefined()
    expect(next.tutar).toBe(1_800_000)
  })

  it('noop when switching to same mode (reference equality)', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000 })
    expect(handleOptimizeForChange(s, 'taksit')).toBe(s)
  })

  it('does not mutate varlikTuru', () => {
    const s = makeState({ optimizeFor: 'taksit', varlikTuru: 'tasit' })
    const next = handleOptimizeForChange(s, 'tutar')
    expect(next.varlikTuru).toBe('tasit')
  })
})

describe('field handlers reject invalid inputs (no-op returning same reference)', () => {
  const s = makeState({ tutar: 100 })

  it('handleTutarChange rejects NaN', () => {
    expect(handleTutarChange(s, Number.NaN)).toBe(s)
  })

  it('handleTutarChange rejects negative', () => {
    expect(handleTutarChange(s, -1)).toBe(s)
  })

  it('handleTutarChange rejects ±Infinity', () => {
    expect(handleTutarChange(s, Number.POSITIVE_INFINITY)).toBe(s)
    expect(handleTutarChange(s, Number.NEGATIVE_INFINITY)).toBe(s)
  })

  it('handlePesinatChange rejects NaN/negative', () => {
    expect(handlePesinatChange(s, Number.NaN)).toBe(s)
    expect(handlePesinatChange(s, -100)).toBe(s)
  })

  it('handleTaksitChange rejects NaN/negative', () => {
    expect(handleTaksitChange(s, Number.NaN)).toBe(s)
    expect(handleTaksitChange(s, -100)).toBe(s)
  })

  it('accepts zero (legitimate for pesinat)', () => {
    const next = handlePesinatChange(s, 0)
    expect(next.pesinat).toBe(0)
  })
})

describe('field handlers respect the derived-field lock', () => {
  it('handleTutarChange ignored when tutar is the derived field', () => {
    const s = makeState({ optimizeFor: 'tutar' })
    expect(handleTutarChange(s, 1_800_000)).toBe(s)
  })

  it('handlePesinatChange ignored when pesinat is the derived field', () => {
    const s = makeState({ optimizeFor: 'pesinat' })
    expect(handlePesinatChange(s, 300_000)).toBe(s)
  })

  it('handleTaksitChange ignored when taksit is the derived field', () => {
    const s = makeState({ optimizeFor: 'taksit' })
    expect(handleTaksitChange(s, 60_000)).toBe(s)
  })
})

describe('handleVarlikTuruChange', () => {
  it('updates varlikTuru without clearing input fields', () => {
    const s = makeState({ tutar: 1_800_000, pesinat: 300_000, varlikTuru: 'konut' })
    const next = handleVarlikTuruChange(s, 'tasit')
    expect(next.varlikTuru).toBe('tasit')
    expect(next.tutar).toBe(1_800_000)
    expect(next.pesinat).toBe(300_000)
  })

  it('noop when same varlikTuru (reference equality)', () => {
    const s = makeState({ varlikTuru: 'konut' })
    expect(handleVarlikTuruChange(s, 'konut')).toBe(s)
  })

  it('rejects invalid input', () => {
    const s = makeState()
    // @ts-expect-error — intentional invalid
    expect(handleVarlikTuruChange(s, 'arsa')).toBe(s)
    // @ts-expect-error
    expect(handleVarlikTuruChange(s, null)).toBe(s)
  })
})

describe('toOptimizeInput', () => {
  it('returns null when a required non-derived field is missing', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000 /* pesinat missing */ })
    expect(toOptimizeInput(s, MARKET)).toBeNull()
  })

  it('returns null when a market param is invalid', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000 })
    expect(toOptimizeInput(s, { ...MARKET, krFaizAylik: Number.NaN })).toBeNull()
    expect(toOptimizeInput(s, { ...MARKET, mevduatYillik: -1 })).toBeNull()
  })

  it('produces correct OptimizeInput for mode "taksit"', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000 })
    const input = toOptimizeInput(s, MARKET)!
    expect(input).not.toBeNull()
    expect(input.optimizeFor).toBe('taksit')
    expect(input.tutar).toBe(1_800_000)
    expect(input.pesinat).toBe(300_000)
    expect(input.taksit).toBeUndefined()
    expect(input.varlikTuru).toBe('konut')
    expect(input.orgPct).toBe(8.5)
    expect(input.krFaizAylik).toBe(2.49)
    expect(input.mevduatYillik).toBe(40)
  })

  it('produces correct OptimizeInput for mode "tutar"', () => {
    const s = makeState({ optimizeFor: 'tutar', pesinat: 300_000, taksit: 60_000 })
    const input = toOptimizeInput(s, MARKET)!
    expect(input.optimizeFor).toBe('tutar')
    expect(input.tutar).toBeUndefined()
    expect(input.pesinat).toBe(300_000)
    expect(input.taksit).toBe(60_000)
  })

  it('produces correct OptimizeInput for mode "pesinat"', () => {
    const s = makeState({ optimizeFor: 'pesinat', tutar: 1_800_000, taksit: 60_000, varlikTuru: 'tasit' })
    const input = toOptimizeInput(s, MARKET)!
    expect(input.optimizeFor).toBe('pesinat')
    expect(input.tutar).toBe(1_800_000)
    expect(input.pesinat).toBeUndefined()
    expect(input.taksit).toBe(60_000)
    expect(input.varlikTuru).toBe('tasit')
  })
})

describe('isOptimizerReady', () => {
  it('true when all non-derived fields are set', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000 })
    expect(isOptimizerReady(s, MARKET)).toBe(true)
  })

  it('false when any required field is missing', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000 })
    expect(isOptimizerReady(s, MARKET)).toBe(false)
  })

  it('false when market is invalid', () => {
    const s = makeState({ optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000 })
    expect(isOptimizerReady(s, { ...MARKET, orgPct: Number.NaN })).toBe(false)
  })
})
