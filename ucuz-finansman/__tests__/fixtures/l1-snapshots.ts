// Regression fixtures for the three-gate teslim algorithm (L1/PR-4).
// Source of truth for these numbers is the hand-worked example in
// /Users/sezaiavci/.claude/plans/tender-knitting-cherny.md §Verified rule.
//
// Formula reminder:
//   pesinatRatio        = peşinat / tutar
//   savingsGate         = first t where peşinat + Σ taksit ≥ tutar × 0.40
//   baseDurationGate    = ceil(vade × 0.40)
//   reducedDurationGate = max(min(5, vade), ceil(vade × 0.40 × (1 − pesinatRatio)))
//   teslimAy            = min(vade, max(savingsGate, reducedDurationGate))

import type { KarsilastirmaParams } from '../../lib/hesaplamalar'

export interface L1Snapshot {
  name: string
  input: KarsilastirmaParams
  expect: {
    teslimAy: number
    tasarrufEsikAyi: number
    sureEsikAyi: number
    bagliyayanEsik: 'tasarruf' | 'sure' | 'her-ikisi'
  }
}

const baseOther = {
  orgPct: 8.5,
  takTuru: 'sabit' as const,
  artisAy: 0,
  yeniTaksit: 0,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
}

export const L1_SNAPSHOTS: L1Snapshot[] = [
  {
    name: 'Defaults — peşinat 16.67%, vade 25: süre gate (9) binds',
    input: {
      ...baseOther,
      tutar: 1_800_000, pesinat: 300_000, taksit0: 60_000,
    },
    expect: {
      tasarrufEsikAyi: 7,      // peşinat + 7×60 = 720 ≥ 720
      sureEsikAyi: 9,          // ceil(25 × 0.4 × (1 − 0.1667)) = ceil(8.33) = 9
      teslimAy: 9,
      bagliyayanEsik: 'sure',
    },
  },
  {
    name: 'High peşinat (50%) — floor of 5 binds',
    input: {
      ...baseOther,
      tutar: 1_800_000, pesinat: 900_000, taksit0: 60_000,
    },
    expect: {
      tasarrufEsikAyi: 1,      // peşinat alone > 720k; first loop iter meets threshold
      sureEsikAyi: 5,          // ceil(25 × 0.4 × 0.5) = 5
      teslimAy: 5,
      bagliyayanEsik: 'sure',
    },
  },
  {
    name: 'Zero peşinat — base duration gate (10) binds',
    input: {
      ...baseOther,
      tutar: 1_800_000, pesinat: 0, taksit0: 72_000,
    },
    expect: {
      // peşinat=0, pesinatRatio=0 → reducedDurationGate = baseDurationGate = 10
      // savings: 72k × 10 = 720k ≥ 720k at t=10
      tasarrufEsikAyi: 10,
      sureEsikAyi: 10,
      teslimAy: 10,
      bagliyayanEsik: 'her-ikisi',
    },
  },
  {
    name: 'Short vade (6 ay) — floor 5 still applies',
    input: {
      ...baseOther,
      tutar: 600_000, pesinat: 60_000, taksit0: 90_000,
    },
    expect: {
      // baseDuration = ceil(6 × 0.4) = 3; pesinatRatio = 0.10
      // reducedDuration = max(min(5, 6), ceil(6 × 0.4 × 0.9)) = max(5, 3) = 5
      // savings: 60 + t×90 ≥ 240 → t ≥ 2 → tasarrufEsikAyi = 2
      // teslim = max(2, 5) = 5
      tasarrufEsikAyi: 2,
      sureEsikAyi: 5,
      teslimAy: 5,
      bagliyayanEsik: 'sure',
    },
  },
  {
    name: 'Very short vade (4 ay) — vade caps both gates',
    input: {
      ...baseOther,
      tutar: 400_000, pesinat: 40_000, taksit0: 90_000,
    },
    expect: {
      // baseDuration = ceil(4 × 0.4) = 2; pesinatRatio = 0.10
      // floor = min(5, 4) = 4; reduced = max(4, ceil(4 × 0.4 × 0.9)) = max(4, 2) = 4
      // savings: 40 + t×90 ≥ 160 → t ≥ 2 → tasarrufEsikAyi = 2
      // teslim = min(vade=4, max(2, 4)) = 4
      tasarrufEsikAyi: 2,
      sureEsikAyi: 4,
      teslimAy: 4,
      bagliyayanEsik: 'sure',
    },
  },
]
