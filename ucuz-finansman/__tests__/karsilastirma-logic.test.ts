import { describe, it, expect } from 'vitest'
import {
  clampMonths,
  handleMonthsChange,
  handlePesinatChange,
  handleTaksitChange,
  handleTutarChange,
  isValidFormState,
  type KarsilastirmaFormState,
} from '@/lib/karsilastirma-state'
import {
  parseKarsilastirmaUrl,
  resolveInitialState,
} from '@/lib/url-params'

// ─── Helpers ──────────────────────────────────────────────────────────────

const TOL = 0.01

function invariantHolds(s: KarsilastirmaFormState): boolean {
  return Math.abs(s.taksit * s.months - (s.tutar - s.pesinat)) <= TOL
}

function makeState(
  over: Partial<KarsilastirmaFormState> = {},
): KarsilastirmaFormState {
  const base: KarsilastirmaFormState = {
    tutar: 1_200_000,
    pesinat: 200_000,
    taksit: 50_000, // (1_200_000 - 200_000) / 20
    months: 20,
    primaryField: 'tutar',
    varlikTuru: 'konut',
  }
  return { ...base, ...over }
}

// deterministic pseudo-random (LCG) so "100 random edits" test is reproducible
function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ════════════════════════════════════════════════════════════════════════
// STATE MACHINE TESTS
// ════════════════════════════════════════════════════════════════════════

describe('karsilastirma-state: invariant preserved', () => {
  it('handleTutarChange maintains invariant', () => {
    const s = handleTutarChange(makeState(), 2_400_000)
    expect(invariantHolds(s)).toBe(true)
    expect(s.tutar).toBeCloseTo(2_400_000, 2)
    expect(s.primaryField).toBe('tutar')
  })

  it('handleTaksitChange maintains invariant', () => {
    const s = handleTaksitChange(makeState(), 75_000)
    expect(invariantHolds(s)).toBe(true)
    expect(s.taksit).toBeCloseTo(75_000, 2)
    expect(s.primaryField).toBe('taksit')
  })

  it('handlePesinatChange maintains invariant (primary=tutar)', () => {
    const s = handlePesinatChange(
      makeState({ primaryField: 'tutar' }),
      300_000,
    )
    expect(invariantHolds(s)).toBe(true)
    expect(s.pesinat).toBeCloseTo(300_000, 2)
    // tutar should be unchanged since primary is tutar
    expect(s.tutar).toBeCloseTo(1_200_000, 2)
    expect(s.primaryField).toBe('tutar')
  })

  it('handlePesinatChange maintains invariant (primary=taksit)', () => {
    const s0 = makeState({ primaryField: 'taksit', taksit: 50_000 })
    const s = handlePesinatChange(s0, 400_000)
    expect(invariantHolds(s)).toBe(true)
    expect(s.pesinat).toBeCloseTo(400_000, 2)
    // taksit kept constant, tutar recomputed
    expect(s.taksit).toBeCloseTo(50_000, 2)
    expect(s.tutar).toBeCloseTo(400_000 + 50_000 * 20, 2)
    expect(s.primaryField).toBe('taksit')
  })

  it('handleMonthsChange maintains invariant', () => {
    const s = handleMonthsChange(makeState(), 36)
    expect(invariantHolds(s)).toBe(true)
    expect(s.months).toBe(36)
    // primary=tutar by default → tutar pinned
    expect(s.tutar).toBeCloseTo(1_200_000, 2)
  })

  it('handleMonthsChange with primary=taksit pins taksit', () => {
    const s = handleMonthsChange(
      makeState({ primaryField: 'taksit', taksit: 50_000 }),
      24,
    )
    expect(invariantHolds(s)).toBe(true)
    expect(s.months).toBe(24)
    expect(s.taksit).toBeCloseTo(50_000, 2)
    expect(s.tutar).toBeCloseTo(200_000 + 50_000 * 24, 2)
  })

  it('100 random edits all maintain invariant', () => {
    const rand = mulberry32(0xC0FFEE)
    for (let trial = 0; trial < 100; trial++) {
      let s = makeState()
      for (let i = 0; i < 10; i++) {
        const pick = Math.floor(rand() * 4)
        const v = Math.floor(rand() * 1_000_000)
        if (pick === 0) s = handleTutarChange(s, v)
        else if (pick === 1) s = handleTaksitChange(s, Math.max(1, v))
        else if (pick === 2) s = handlePesinatChange(s, v)
        else s = handleMonthsChange(s, Math.floor(rand() * 200))
        expect(invariantHolds(s)).toBe(true)
        expect(s.months).toBeGreaterThanOrEqual(1)
        expect(s.months).toBeLessThanOrEqual(120)
        expect(s.tutar).toBeGreaterThanOrEqual(0)
        expect(s.pesinat).toBeGreaterThanOrEqual(0)
        expect(s.pesinat).toBeLessThanOrEqual(s.tutar + TOL)
        expect(s.taksit).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('karsilastirma-state: degenerate inputs rejected', () => {
  it('handleTaksitChange with 0 does not modify state', () => {
    const s0 = makeState()
    const s = handleTaksitChange(s0, 0)
    expect(s).toEqual(s0)
  })

  it('handleTaksitChange with negative does not modify state', () => {
    const s0 = makeState()
    expect(handleTaksitChange(s0, -100)).toEqual(s0)
    expect(handleTaksitChange(s0, -0.01)).toEqual(s0)
  })

  it('handleTaksitChange with NaN does not modify state', () => {
    const s0 = makeState()
    expect(handleTaksitChange(s0, Number.NaN)).toEqual(s0)
  })

  it('handleTaksitChange with Infinity does not modify state', () => {
    const s0 = makeState()
    expect(handleTaksitChange(s0, Number.POSITIVE_INFINITY)).toEqual(s0)
    expect(handleTaksitChange(s0, Number.NEGATIVE_INFINITY)).toEqual(s0)
  })

  it('handleTutarChange with negative clamps to pesinat', () => {
    const s = handleTutarChange(makeState({ pesinat: 200_000 }), -500_000)
    expect(s.tutar).toBeCloseTo(200_000, 2)
    expect(s.pesinat).toBeCloseTo(200_000, 2)
    // kalan == 0 → taksit must be 0 (not negative, not NaN)
    expect(s.taksit).toBeCloseTo(0, 2)
    expect(invariantHolds(s)).toBe(true)
  })

  it('handleTutarChange with val < pesinat clamps to pesinat', () => {
    const s = handleTutarChange(makeState({ pesinat: 500_000 }), 100_000)
    expect(s.tutar).toBeCloseTo(500_000, 2)
    expect(s.pesinat).toBeCloseTo(500_000, 2)
    expect(s.taksit).toBeCloseTo(0, 2)
  })

  it('handlePesinatChange with negative clamps to 0', () => {
    const s = handlePesinatChange(makeState(), -50_000)
    expect(s.pesinat).toBe(0)
    expect(invariantHolds(s)).toBe(true)
  })

  it('handlePesinatChange above tutar clamps to tutar (primary=tutar)', () => {
    const s = handlePesinatChange(
      makeState({ tutar: 1_000_000, pesinat: 0, primaryField: 'tutar' }),
      9_999_999,
    )
    expect(s.pesinat).toBeCloseTo(1_000_000, 2)
    expect(s.taksit).toBeCloseTo(0, 2)
    expect(invariantHolds(s)).toBe(true)
  })

  it('handleMonthsChange clamps to [1, 120]', () => {
    expect(handleMonthsChange(makeState(), 5000).months).toBe(120)
    expect(handleMonthsChange(makeState(), -12).months).toBe(1)
    expect(handleMonthsChange(makeState(), 60).months).toBe(60)
    expect(handleMonthsChange(makeState(), 120).months).toBe(120)
    expect(handleMonthsChange(makeState(), 1).months).toBe(1)
  })

  it('handleMonthsChange with 0 keeps months >= 1', () => {
    const s = handleMonthsChange(makeState(), 0)
    expect(s.months).toBeGreaterThanOrEqual(1)
    expect(s.months).toBe(1)
    expect(invariantHolds(s)).toBe(true)
  })

  it('clampMonths helper: boundaries', () => {
    expect(clampMonths(0)).toBe(1)
    expect(clampMonths(1)).toBe(1)
    expect(clampMonths(-1000)).toBe(1)
    expect(clampMonths(121)).toBe(120)
    expect(clampMonths(1_000_000)).toBe(120)
    expect(clampMonths(Number.NaN)).toBe(1)
    expect(clampMonths(Number.POSITIVE_INFINITY)).toBe(120)
  })
})

describe('karsilastirma-state: no NaN propagation', () => {
  it('NaN input returns state unchanged (tutar)', () => {
    const s0 = makeState()
    expect(handleTutarChange(s0, Number.NaN)).toEqual(s0)
  })

  it('NaN input returns state unchanged (taksit)', () => {
    const s0 = makeState()
    expect(handleTaksitChange(s0, Number.NaN)).toEqual(s0)
  })

  it('NaN input returns state unchanged (pesinat)', () => {
    const s0 = makeState()
    expect(handlePesinatChange(s0, Number.NaN)).toEqual(s0)
  })

  it('NaN input returns state unchanged (months)', () => {
    const s0 = makeState()
    expect(handleMonthsChange(s0, Number.NaN)).toEqual(s0)
  })

  it('Infinity propagation prevented in all handlers', () => {
    const s0 = makeState()
    expect(handleTutarChange(s0, Number.POSITIVE_INFINITY)).toEqual(s0)
    expect(handlePesinatChange(s0, Number.POSITIVE_INFINITY)).toEqual(s0)
    expect(handleMonthsChange(s0, Number.POSITIVE_INFINITY)).not.toBe(s0) // clampMonths handles it
    expect(handleMonthsChange(s0, Number.POSITIVE_INFINITY).months).toBe(120)
  })
})

describe('karsilastirma-state: isValidFormState', () => {
  it('accepts a default valid state', () => {
    expect(isValidFormState(makeState())).toBe(true)
  })

  it('rejects negative values', () => {
    expect(isValidFormState(makeState({ tutar: -1 }))).toBe(false)
    expect(isValidFormState(makeState({ pesinat: -1 }))).toBe(false)
    expect(isValidFormState(makeState({ taksit: -1 }))).toBe(false)
  })

  it('rejects months out of range', () => {
    expect(isValidFormState(makeState({ months: 0 }))).toBe(false)
    expect(isValidFormState(makeState({ months: 121 }))).toBe(false)
  })

  it('rejects pesinat > tutar', () => {
    expect(
      isValidFormState(
        makeState({ tutar: 100, pesinat: 500, taksit: 0, months: 1 }),
      ),
    ).toBe(false)
  })

  it('rejects states that break the invariant', () => {
    // taksit*months ≠ tutar-pesinat
    expect(
      isValidFormState({
        tutar: 1_000_000,
        pesinat: 0,
        taksit: 1,
        months: 20,
        primaryField: 'tutar',
        varlikTuru: 'konut',
      }),
    ).toBe(false)
  })

  it('rejects NaN / Infinity in any field', () => {
    expect(isValidFormState(makeState({ tutar: Number.NaN }))).toBe(false)
    expect(isValidFormState(makeState({ pesinat: Number.NaN }))).toBe(false)
    expect(isValidFormState(makeState({ taksit: Number.NaN }))).toBe(false)
    expect(isValidFormState(makeState({ months: Number.NaN }))).toBe(false)
    expect(
      isValidFormState(makeState({ tutar: Number.POSITIVE_INFINITY })),
    ).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════════════════
// URL PARSING TESTS
// ════════════════════════════════════════════════════════════════════════

describe('url-params: presence detection', () => {
  it('numeric param parsed correctly', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=1500000&pesinat=250000&taksit=60000&months=20'),
    )
    expect(out.tutar).toBe(1_500_000)
    expect(out.pesinat).toBe(250_000)
    expect(out.taksit).toBe(60_000)
    expect(out.months).toBe(20)
  })

  it('non-numeric string treated as absent', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=abc&pesinat=xyz'),
    )
    expect(out.tutar).toBeUndefined()
    expect(out.pesinat).toBeUndefined()
  })

  it('empty string treated as absent', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=&pesinat=&taksit='),
    )
    expect(out.tutar).toBeUndefined()
    expect(out.pesinat).toBeUndefined()
    expect(out.taksit).toBeUndefined()
  })

  it('whitespace-only treated as absent', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=%20%20'),
    )
    expect(out.tutar).toBeUndefined()
  })

  it('negative number treated as absent for tutar/pesinat/taksit', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=-100&pesinat=-1&taksit=-50'),
    )
    expect(out.tutar).toBeUndefined()
    expect(out.pesinat).toBeUndefined()
    expect(out.taksit).toBeUndefined()
  })

  it('0 for orgPct/krFaiz/mevduat is preserved (not coerced to default)', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('orgPct=0&krFaiz=0&mevduatYillik=0'),
    )
    // CRITICAL: `||` coercion would drop these; use strict presence check.
    expect(out.orgPct).toBe(0)
    expect(out.krFaiz).toBe(0)
    expect(out.mevduatYillik).toBe(0)
  })

  it('0 for tutar/pesinat/taksit is preserved (legitimate 0)', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=0&pesinat=0&taksit=0'),
    )
    expect(out.tutar).toBe(0)
    expect(out.pesinat).toBe(0)
    expect(out.taksit).toBe(0)
  })

  it('NaN / Infinity strings treated as absent', () => {
    const out = parseKarsilastirmaUrl(
      new URLSearchParams('tutar=NaN&pesinat=Infinity&taksit=-Infinity'),
    )
    expect(out.tutar).toBeUndefined()
    expect(out.pesinat).toBeUndefined()
    expect(out.taksit).toBeUndefined()
  })
})

describe('url-params: conflict resolution', () => {
  it('both tutar and taksit: tutar wins, taksit recomputed', () => {
    // URL says tutar=2_000_000, taksit=999_999 → the stored taksit is IGNORED,
    // recomputed from (tutar - pesinat) / months.
    const sp = new URLSearchParams(
      'tutar=2000000&pesinat=400000&taksit=999999&months=20',
    )
    const input = parseKarsilastirmaUrl(sp)
    const s = resolveInitialState(input, {
      tutar: 0,
      pesinat: 0,
      taksit: 0,
      months: 20,
    })
    expect(s.primaryField).toBe('tutar')
    expect(s.tutar).toBeCloseTo(2_000_000, 2)
    expect(s.pesinat).toBeCloseTo(400_000, 2)
    expect(s.taksit).toBeCloseTo((2_000_000 - 400_000) / 20, 2)
    expect(s.taksit).not.toBeCloseTo(999_999, 2)
    expect(invariantHolds(s)).toBe(true)
  })

  it('only taksit: primary=taksit, tutar computed', () => {
    const sp = new URLSearchParams('taksit=75000&pesinat=100000&months=24')
    const input = parseKarsilastirmaUrl(sp)
    const s = resolveInitialState(input, {
      tutar: 0,
      pesinat: 0,
      taksit: 0,
      months: 20,
    })
    expect(s.primaryField).toBe('taksit')
    expect(s.taksit).toBeCloseTo(75_000, 2)
    expect(s.months).toBe(24)
    expect(s.pesinat).toBeCloseTo(100_000, 2)
    expect(s.tutar).toBeCloseTo(100_000 + 75_000 * 24, 2)
    expect(invariantHolds(s)).toBe(true)
  })

  it('primaryField reflects actual validity not string presence', () => {
    // ?tutar=abc&taksit=100000 → `has("tutar")` is true but tutar invalid.
    // A correct impl uses Number.isFinite, not searchParams.has → primary=taksit.
    const sp = new URLSearchParams('tutar=abc&taksit=100000&months=20')
    const input = parseKarsilastirmaUrl(sp)
    const s = resolveInitialState(input, {
      tutar: 0,
      pesinat: 0,
      taksit: 0,
      months: 20,
    })
    expect(s.primaryField).toBe('taksit')
    expect(s.taksit).toBeCloseTo(100_000, 2)
    expect(s.tutar).toBeCloseTo(0 + 100_000 * 20, 2)
    expect(invariantHolds(s)).toBe(true)
  })

  it('neither tutar nor taksit present: defaults with primary=tutar', () => {
    const sp = new URLSearchParams('')
    const input = parseKarsilastirmaUrl(sp)
    const s = resolveInitialState(input, {
      tutar: 1_000_000,
      pesinat: 100_000,
      taksit: 50_000,
      months: 18,
    })
    expect(s.primaryField).toBe('tutar')
    expect(s.tutar).toBeCloseTo(1_000_000, 2)
    expect(s.pesinat).toBeCloseTo(100_000, 2)
    expect(s.months).toBe(18)
    expect(invariantHolds(s)).toBe(true)
  })

  it('legitimate orgPct=0 survives (not replaced by default)', () => {
    const out = parseKarsilastirmaUrl(new URLSearchParams('orgPct=0'))
    expect(out.orgPct).toBe(0)
    // Compare against a `||`-buggy readback mentally: if buggy code used
    // `Number(sp.get('orgPct')) || 10`, we'd get 10. Here we get 0.
  })
})

describe('url-params: clamping', () => {
  it('months=1000 clamped to 120', () => {
    const out = parseKarsilastirmaUrl(new URLSearchParams('months=1000'))
    expect(out.months).toBe(120)
    const s = resolveInitialState(
      { months: 1000, tutar: 1_000_000 },
      { tutar: 0, pesinat: 0, taksit: 0, months: 20 },
    )
    expect(s.months).toBe(120)
  })

  it('months=0 clamped to 1', () => {
    const out = parseKarsilastirmaUrl(new URLSearchParams('months=0'))
    expect(out.months).toBe(1)
    const s = resolveInitialState(
      { months: 0, tutar: 1_000_000 },
      { tutar: 0, pesinat: 0, taksit: 0, months: 20 },
    )
    expect(s.months).toBe(1)
  })

  it('months absent → default used but clamped', () => {
    const s = resolveInitialState(
      { tutar: 1_000_000 },
      { tutar: 0, pesinat: 0, taksit: 0, months: 999 },
    )
    expect(s.months).toBe(120)
  })

  it('pesinat>tutar recomputed (no negative taksit)', () => {
    // URL has tutar=500_000 but pesinat=800_000 → pesinat clamped to 500_000,
    // taksit = 0 (never negative).
    const sp = new URLSearchParams('tutar=500000&pesinat=800000&months=20')
    const input = parseKarsilastirmaUrl(sp)
    const s = resolveInitialState(input, {
      tutar: 0,
      pesinat: 0,
      taksit: 0,
      months: 20,
    })
    expect(s.tutar).toBeCloseTo(500_000, 2)
    expect(s.pesinat).toBeLessThanOrEqual(s.tutar + TOL)
    expect(s.taksit).toBeGreaterThanOrEqual(0)
    expect(invariantHolds(s)).toBe(true)
  })

  it('result always satisfies isValidFormState', () => {
    const cases = [
      'tutar=1500000&pesinat=300000&months=20',
      'taksit=75000&months=24',
      'tutar=500000&pesinat=800000&months=1000',
      'tutar=abc&taksit=50000',
      '',
      'tutar=0&pesinat=0',
    ]
    for (const c of cases) {
      const s = resolveInitialState(
        parseKarsilastirmaUrl(new URLSearchParams(c)),
        { tutar: 1_000_000, pesinat: 100_000, taksit: 50_000, months: 18 },
      )
      expect(isValidFormState(s)).toBe(true)
    }
  })
})
