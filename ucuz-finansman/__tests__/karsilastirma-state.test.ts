import { describe, it, expect } from 'vitest'
import {
  clampMonths,
  getMaxMonths,
  VADE_CAPS,
  DEFAULT_VARLIK,
  isVarlikTuru,
  handleVarlikTuruChange,
  isValidFormState,
  type KarsilastirmaFormState,
  type VarlikTuru,
} from '../lib/karsilastirma-state'
import { parseKarsilastirmaUrl, resolveInitialState } from '../lib/url-params'

function makeState(over: Partial<KarsilastirmaFormState> = {}): KarsilastirmaFormState {
  return {
    tutar: 1_200_000,
    pesinat: 200_000,
    taksit: 50_000,
    months: 20,
    primaryField: 'tutar',
    varlikTuru: 'konut',
    ...over,
  }
}

describe('VarlikTuru constants', () => {
  it('VADE_CAPS matches Yönetmelik m. 22/3', () => {
    expect(VADE_CAPS.konut).toBe(120)
    expect(VADE_CAPS.isyeri).toBe(120)
    expect(VADE_CAPS.tasit).toBe(60)
  })

  it('DEFAULT_VARLIK is konut', () => {
    expect(DEFAULT_VARLIK).toBe('konut')
  })

  it('isVarlikTuru validates input', () => {
    expect(isVarlikTuru('konut')).toBe(true)
    expect(isVarlikTuru('isyeri')).toBe(true)
    expect(isVarlikTuru('tasit')).toBe(true)
    expect(isVarlikTuru('kredi')).toBe(false)
    expect(isVarlikTuru(null)).toBe(false)
    expect(isVarlikTuru(undefined)).toBe(false)
    expect(isVarlikTuru(120)).toBe(false)
  })
})

describe('clampMonths(v, varlikTuru)', () => {
  it('clamps konut to 120', () => {
    expect(clampMonths(130, 'konut')).toBe(120)
    expect(clampMonths(120, 'konut')).toBe(120)
    expect(clampMonths(60, 'konut')).toBe(60)
  })

  it('clamps isyeri to 120', () => {
    expect(clampMonths(130, 'isyeri')).toBe(120)
  })

  it('clamps taşıt to 60', () => {
    expect(clampMonths(130, 'tasit')).toBe(60)
    expect(clampMonths(60, 'tasit')).toBe(60)
    expect(clampMonths(36, 'tasit')).toBe(36)
  })

  it('floors to MIN_MONTHS=1 for zero/negative', () => {
    expect(clampMonths(0, 'tasit')).toBe(1)
    expect(clampMonths(-5, 'konut')).toBe(1)
  })

  it('handles NaN and infinities', () => {
    expect(clampMonths(Number.NaN, 'konut')).toBe(1)
    expect(clampMonths(Number.POSITIVE_INFINITY, 'tasit')).toBe(60)
    expect(clampMonths(Number.NEGATIVE_INFINITY, 'konut')).toBe(1)
  })

  it('defaults to konut cap when varlikTuru omitted (backwards compat)', () => {
    expect(clampMonths(130)).toBe(120)
    expect(clampMonths(60)).toBe(60)
  })
})

describe('handleVarlikTuruChange', () => {
  it('konut → tasit with vade=120 auto-clamps months to 60 (primaryField=tutar)', () => {
    const start = makeState({ tutar: 600_000, pesinat: 0, taksit: 5_000, months: 120 })
    const next = handleVarlikTuruChange(start, 'tasit')
    expect(next.varlikTuru).toBe('tasit')
    expect(next.months).toBe(60)
    // tutar fixed, taksit recomputed: 600_000 / 60 = 10_000
    expect(next.tutar).toBe(600_000)
    expect(next.taksit).toBe(10_000)
  })

  it('konut → tasit keeps months when already ≤ 60', () => {
    const start = makeState({ months: 36 })
    const next = handleVarlikTuruChange(start, 'tasit')
    expect(next.months).toBe(36)
  })

  it('tasit → konut does not change months (no upgrade)', () => {
    const start = makeState({ varlikTuru: 'tasit', months: 60 })
    const next = handleVarlikTuruChange(start, 'konut')
    expect(next.months).toBe(60)
    expect(next.varlikTuru).toBe('konut')
  })

  it('keeps taksit fixed when primaryField=taksit (tutar re-derives)', () => {
    const start = makeState({ primaryField: 'taksit', taksit: 5_000, months: 120, tutar: 600_000, pesinat: 0 })
    const next = handleVarlikTuruChange(start, 'tasit')
    expect(next.months).toBe(60)
    expect(next.taksit).toBe(5_000)
    expect(next.tutar).toBe(5_000 * 60)
  })

  it('is a no-op when varlikTuru is unchanged', () => {
    const start = makeState()
    const next = handleVarlikTuruChange(start, 'konut')
    expect(next).toBe(start) // reference equality: state not cloned
  })

  it('ignores invalid VarlikTuru', () => {
    const start = makeState()
    // @ts-expect-error — intentional invalid input
    const next = handleVarlikTuruChange(start, 'kredi')
    expect(next).toBe(start)
  })
})

describe('isValidFormState with varlikTuru', () => {
  it('accepts konut state with months=120', () => {
    const s = makeState({ months: 120, tutar: 1_200_000, pesinat: 0, taksit: 10_000 })
    expect(isValidFormState(s)).toBe(true)
  })

  it('rejects taşıt state with months=90 (> 60)', () => {
    const s = makeState({ varlikTuru: 'tasit', months: 90 })
    expect(isValidFormState(s)).toBe(false)
  })

  it('accepts taşıt with months=60', () => {
    const s = makeState({ varlikTuru: 'tasit', months: 60, tutar: 300_000, pesinat: 0, taksit: 5_000 })
    expect(isValidFormState(s)).toBe(true)
  })

  it('rejects when varlikTuru is missing/invalid', () => {
    // @ts-expect-error — intentionally malformed
    expect(isValidFormState({ ...makeState(), varlikTuru: 'kredi' })).toBe(false)
  })
})

describe('URL round-trip with varlikTuru', () => {
  it('parseKarsilastirmaUrl extracts varlikTuru=tasit and clamps months to 60', () => {
    const sp = new URLSearchParams('varlikTuru=tasit&months=120')
    const out = parseKarsilastirmaUrl(sp)
    expect(out.varlikTuru).toBe('tasit')
    expect(out.months).toBe(60)
  })

  it('falls back to konut for unknown varlikTuru values', () => {
    const sp = new URLSearchParams('varlikTuru=arsa&months=96')
    const out = parseKarsilastirmaUrl(sp)
    expect(out.varlikTuru).toBe('konut')
    expect(out.months).toBe(96)
  })

  it('resolveInitialState hydrates varlikTuru and clamps months', () => {
    const urlInput = parseKarsilastirmaUrl(new URLSearchParams('varlikTuru=tasit&months=120'))
    const state = resolveInitialState(urlInput, {
      tutar: 600_000,
      pesinat: 0,
      taksit: 10_000,
      months: 120,
    })
    expect(state.varlikTuru).toBe('tasit')
    expect(state.months).toBe(60)
  })

  it('defaults varlikTuru to konut when param is missing', () => {
    const state = resolveInitialState(parseKarsilastirmaUrl(new URLSearchParams('months=120')), {
      tutar: 1_200_000,
      pesinat: 0,
      taksit: 10_000,
      months: 120,
    })
    expect(state.varlikTuru).toBe('konut')
    expect(state.months).toBe(120)
  })
})

describe('getMaxMonths', () => {
  it('matches VADE_CAPS for every VarlikTuru', () => {
    const types: VarlikTuru[] = ['konut', 'isyeri', 'tasit']
    for (const t of types) {
      expect(getMaxMonths(t)).toBe(VADE_CAPS[t])
    }
  })
})
