// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FlipConditions from '../../components/optimizer/FlipConditions'
import type { OptimizeInput } from '../../lib/tf-optimize'

// Current TR market — inverted (r_m > r_b) → TF always loses.
const TF_LOSES_INPUT: OptimizeInput = {
  tutar: 1_800_000,
  pesinat: 300_000,
  orgPct: 8.5,
  krFaizAylik: 2.49,
  mevduatYillik: 40,
  varlikTuru: 'konut',
  optimizeFor: 'taksit',
}

describe('FlipConditions — mount and static content', () => {
  it('renders the Kanun 6361 m. 3/l and m. 39/B citation', () => {
    const { container } = render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    expect(container.textContent ?? '').toMatch(/Kanun 6361 m\. 3\/l.*m\. 39\/B/)
  })

  it('uses the "faizsiz finansman" framing (not "ucuzluk")', () => {
    const { container } = render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    expect(container.textContent ?? '').toMatch(/faizsiz finansman/i)
    expect(container.textContent ?? '').toMatch(/faizsizlik/i)
  })

  it('shows the two sliders with correct labels', () => {
    render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    expect(screen.getByLabelText(/Kredi aylık faizi/i)).toBeTruthy()
    expect(screen.getByLabelText(/Mevduat yıllık faizi/i)).toBeTruthy()
  })
})

describe('FlipConditions — live recompute', () => {
  it('default state shows "TF bankadan X daha pahalı" when tfAlwaysExpensive at baseline', () => {
    const { container } = render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    expect(container.textContent ?? '').toMatch(/daha pahalı/)
  })

  it('dragging kredi faizi up flips the result to "TF kazanıyor"', () => {
    render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    const krSlider = screen.getByLabelText(/Kredi aylık faizi/i) as HTMLInputElement
    fireEvent.change(krSlider, { target: { value: '6' } })  // very high kredi faizi
    const resultPanel = screen.getByTestId('flip-result')
    expect(resultPanel.textContent ?? '').toMatch(/TF kazanıyor|daha ucuz/)
  })

  it('dragging mevduat yıllık down also flips the result', () => {
    render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    const mSlider = screen.getByLabelText(/Mevduat yıllık faizi/i) as HTMLInputElement
    fireEvent.change(mSlider, { target: { value: '5' } })  // very low mevduat
    const resultPanel = screen.getByTestId('flip-result')
    expect(resultPanel.textContent ?? '').toMatch(/TF kazanıyor|daha ucuz/)
  })

  it('slider changes do not mutate baseInput (re-render isolation)', () => {
    const baseCopy = { ...TF_LOSES_INPUT }
    render(<FlipConditions baseInput={TF_LOSES_INPUT} />)
    const krSlider = screen.getByLabelText(/Kredi aylık faizi/i) as HTMLInputElement
    fireEvent.change(krSlider, { target: { value: '5' } })
    expect(TF_LOSES_INPUT.krFaizAylik).toBe(baseCopy.krFaizAylik)
    expect(TF_LOSES_INPUT.mevduatYillik).toBe(baseCopy.mevduatYillik)
  })
})
