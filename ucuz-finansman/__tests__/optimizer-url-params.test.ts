import { describe, it, expect } from 'vitest'
import {
  parseOptimizerUrl,
  resolveOptimizerInitialState,
  serializeOptimizerState,
} from '../lib/url-params'
import {
  DEFAULT_OPTIMIZER_STATE,
  type OptimizerMarketState,
} from '../lib/optimizer-state'

const DEFAULTS = {
  orgPct: 8.5,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
}

describe('parseOptimizerUrl — mode', () => {
  it('defaults to "taksit" when mode is absent', () => {
    const out = parseOptimizerUrl(new URLSearchParams(''))
    expect(out.mode).toBe('taksit')
  })

  it('defaults to "taksit" for unknown mode values', () => {
    const out = parseOptimizerUrl(new URLSearchParams('mode=arsa'))
    expect(out.mode).toBe('taksit')
  })

  it('accepts all three valid modes', () => {
    expect(parseOptimizerUrl(new URLSearchParams('mode=tutar')).mode).toBe('tutar')
    expect(parseOptimizerUrl(new URLSearchParams('mode=taksit')).mode).toBe('taksit')
    expect(parseOptimizerUrl(new URLSearchParams('mode=pesinat')).mode).toBe('pesinat')
  })
})

describe('parseOptimizerUrl — value fields dropped when they are the derived output', () => {
  it('mode=tutar drops any ?tutar= param', () => {
    const out = parseOptimizerUrl(new URLSearchParams('mode=tutar&tutar=1800000&pesinat=300000&taksit=60000'))
    expect(out.tutar).toBeUndefined()
    expect(out.pesinat).toBe(300_000)
    expect(out.taksit).toBe(60_000)
  })

  it('mode=taksit drops any ?taksit= param', () => {
    const out = parseOptimizerUrl(new URLSearchParams('mode=taksit&tutar=1800000&pesinat=300000&taksit=60000'))
    expect(out.taksit).toBeUndefined()
    expect(out.tutar).toBe(1_800_000)
    expect(out.pesinat).toBe(300_000)
  })

  it('mode=pesinat drops any ?pesinat= param', () => {
    const out = parseOptimizerUrl(new URLSearchParams('mode=pesinat&tutar=1800000&pesinat=300000&taksit=60000'))
    expect(out.pesinat).toBeUndefined()
    expect(out.tutar).toBe(1_800_000)
    expect(out.taksit).toBe(60_000)
  })
})

describe('parseOptimizerUrl — market params', () => {
  it('reads orgPct, krFaiz, mevduatYillik', () => {
    const out = parseOptimizerUrl(new URLSearchParams('orgPct=5&krFaiz=3&mevduatYillik=25'))
    expect(out.orgPct).toBe(5)
    expect(out.krFaiz).toBe(3)
    expect(out.mevduatYillik).toBe(25)
  })

  it('accepts legacy hero-form names (kr_faiz, mevduat_y)', () => {
    const out = parseOptimizerUrl(new URLSearchParams('kr_faiz=2.49&mevduat_y=40'))
    expect(out.krFaiz).toBe(2.49)
    expect(out.mevduatYillik).toBe(40)
  })

  it('canonical names win over legacy if both are present', () => {
    const out = parseOptimizerUrl(new URLSearchParams('krFaiz=3&kr_faiz=5'))
    expect(out.krFaiz).toBe(3)
  })

  it('ignores non-numeric / negative market params', () => {
    const out = parseOptimizerUrl(new URLSearchParams('orgPct=abc&krFaiz=-1&mevduatYillik='))
    expect(out.orgPct).toBeUndefined()
    expect(out.krFaiz).toBeUndefined()
    expect(out.mevduatYillik).toBeUndefined()
  })
})

describe('parseOptimizerUrl — varlikTuru', () => {
  it('reads valid varlikTuru', () => {
    expect(parseOptimizerUrl(new URLSearchParams('varlikTuru=tasit')).varlikTuru).toBe('tasit')
    expect(parseOptimizerUrl(new URLSearchParams('varlikTuru=isyeri')).varlikTuru).toBe('isyeri')
    expect(parseOptimizerUrl(new URLSearchParams('varlikTuru=konut')).varlikTuru).toBe('konut')
  })

  it('drops unknown varlikTuru', () => {
    expect(parseOptimizerUrl(new URLSearchParams('varlikTuru=arsa')).varlikTuru).toBeUndefined()
  })
})

describe('resolveOptimizerInitialState', () => {
  it('produces form with mode from URL and derived field undefined', () => {
    const url = parseOptimizerUrl(new URLSearchParams('mode=tutar&pesinat=300000&taksit=60000'))
    const { form } = resolveOptimizerInitialState(url, DEFAULTS)
    expect(form.optimizeFor).toBe('tutar')
    expect(form.tutar).toBeUndefined()
    expect(form.pesinat).toBe(300_000)
    expect(form.taksit).toBe(60_000)
  })

  it('produces market from URL, falling back to defaults', () => {
    const url = parseOptimizerUrl(new URLSearchParams('krFaiz=3'))
    const { market } = resolveOptimizerInitialState(url, DEFAULTS)
    expect(market.krFaizAylik).toBe(3)
    expect(market.orgPct).toBe(DEFAULTS.orgPct)
    expect(market.mevduatYillik).toBe(DEFAULTS.mevduatYillik)
  })

  it('defaults varlikTuru to konut when absent', () => {
    const url = parseOptimizerUrl(new URLSearchParams(''))
    const { form } = resolveOptimizerInitialState(url, DEFAULTS)
    expect(form.varlikTuru).toBe('konut')
  })

  it('full deep-link round-trip preserves all intended fields', () => {
    const url = parseOptimizerUrl(new URLSearchParams(
      'mode=pesinat&tutar=1800000&taksit=60000&orgPct=8.5&krFaiz=2.49&mevduatYillik=40&varlikTuru=tasit',
    ))
    const { form, market } = resolveOptimizerInitialState(url, DEFAULTS)
    expect(form.optimizeFor).toBe('pesinat')
    expect(form.tutar).toBe(1_800_000)
    expect(form.taksit).toBe(60_000)
    expect(form.pesinat).toBeUndefined()
    expect(form.varlikTuru).toBe('tasit')
    expect(market.krFaizAylik).toBe(2.49)
    expect(market.mevduatYillik).toBe(40)
  })
})

describe('serializeOptimizerState', () => {
  const MARKET: OptimizerMarketState = {
    orgPct: 8.5,
    krFaizAylik: 2.49,
    mevduatYillik: 40,
  }

  it('emits mode + varlıkTürü + market params', () => {
    const sp = serializeOptimizerState(
      { ...DEFAULT_OPTIMIZER_STATE, optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000 },
      MARKET,
    )
    expect(sp.get('mode')).toBe('taksit')
    expect(sp.get('varlikTuru')).toBe('konut')
    expect(sp.get('orgPct')).toBe('8.5')
    expect(sp.get('krFaiz')).toBe('2.49')
    expect(sp.get('mevduatYillik')).toBe('40')
  })

  it('emits known-value fields but omits the derived field', () => {
    const sp = serializeOptimizerState(
      { ...DEFAULT_OPTIMIZER_STATE, optimizeFor: 'taksit', tutar: 1_800_000, pesinat: 300_000 },
      MARKET,
    )
    expect(sp.get('tutar')).toBe('1800000')
    expect(sp.get('pesinat')).toBe('300000')
    expect(sp.has('taksit')).toBe(false)
  })

  it('round-trips: serialize → parse → resolve produces matching state', () => {
    const before = {
      ...DEFAULT_OPTIMIZER_STATE,
      optimizeFor: 'pesinat' as const,
      tutar: 1_800_000,
      taksit: 60_000,
      varlikTuru: 'tasit' as const,
    }
    const sp = serializeOptimizerState(before, MARKET)
    const url = parseOptimizerUrl(sp)
    const { form, market } = resolveOptimizerInitialState(url, DEFAULTS)
    expect(form).toEqual(before)
    expect(market).toEqual(MARKET)
  })
})
