// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import DeltaSweepChart from '../../components/optimizer/DeltaSweepChart'
import type { OptimizeOption } from '../../lib/tf-optimize'

// Mock react-chartjs-2's Line — we don't want to render canvas in jsdom,
// we just want to verify the component mounts and passes correct data.
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: { data: unknown; options: unknown }) => (
    <div
      data-testid="line-chart"
      data-datasets={JSON.stringify((data as { datasets: unknown[] }).datasets.length)}
      data-labels={JSON.stringify((data as { labels: number[] }).labels.length)}
    />
  ),
}))

function makeOption(N: number, feasible = true, delta = -1000 * N): OptimizeOption {
  return {
    vade: N,
    tutar: 1_800_000,
    pesinat: 300_000,
    taksit: (1_800_000 - 300_000) / N,
    teslimAy: Math.min(N, 5),
    kalanVade: Math.max(1, N - 4),
    krediIhtiyaci: 700_000,
    esdegerBankaTaksiti: 50_000,
    delta,
    tfDahaUcuz: delta < 0,
    feasible,
    reason: feasible ? undefined : 'test: not feasible',
  }
}

describe('DeltaSweepChart — mount', () => {
  it('renders with realistic 120-point sweep', () => {
    const allEvaluated = Array.from({ length: 120 }, (_, i) => makeOption(i + 1))
    const { getByTestId } = render(
      <DeltaSweepChart allEvaluated={allEvaluated} topVades={[9, 25, 60]} />
    )
    const chart = getByTestId('line-chart')
    expect(chart.getAttribute('data-labels')).toBe('120')
    expect(chart.getAttribute('data-datasets')).toBe('1')
  })

  it('handles an empty sweep gracefully', () => {
    const { getByTestId } = render(
      <DeltaSweepChart allEvaluated={[]} topVades={[]} />
    )
    expect(getByTestId('line-chart')).toBeTruthy()
  })

  it('handles mixed feasible / infeasible points without crashing', () => {
    const allEvaluated = [
      makeOption(1),
      makeOption(2, false),
      makeOption(3),
      makeOption(4, false),
    ]
    const { getByTestId } = render(
      <DeltaSweepChart allEvaluated={allEvaluated} topVades={[1, 3]} />
    )
    expect(getByTestId('line-chart').getAttribute('data-labels')).toBe('4')
  })
})
