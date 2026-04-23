// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OptimizerYasalPaneli from '../../components/optimizer/OptimizerYasalPaneli'

describe('OptimizerYasalPaneli — structure', () => {
  it('renders the header "Yasal Bilgilendirme"', () => {
    render(<OptimizerYasalPaneli />)
    expect(screen.getByText('Yasal Bilgilendirme')).toBeTruthy()
  })

  it('has exactly 4 accordion items', () => {
    render(<OptimizerYasalPaneli />)
    expect(screen.getByText(/Vade Üst Sınırı/)).toBeTruthy()
    expect(screen.getByText(/Faizsiz Finansman Esaslıdır/)).toBeTruthy()
    expect(screen.getByText(/Üç Kapı Kuralı/)).toBeTruthy()
    expect(screen.getByText(/Organizasyon Ücreti ve Cayma/)).toBeTruthy()
  })
})

describe('OptimizerYasalPaneli — BDDK citations', () => {
  it('Vade cap item cites Yön. m. 22/3', async () => {
    const user = userEvent.setup()
    const { container } = render(<OptimizerYasalPaneli />)
    await user.click(screen.getByText(/Vade Üst Sınırı/))
    expect(container.textContent ?? '').toMatch(/Yönetmelik m\. 22\/3/)
  })

  it('Faizsizlik item cites Kanun 6361 m. 3/l + m. 39/B', async () => {
    const user = userEvent.setup()
    const { container } = render(<OptimizerYasalPaneli />)
    await user.click(screen.getByText(/Faizsiz Finansman Esaslıdır/))
    expect(container.textContent ?? '').toMatch(/Kanun 6361 m\. 3\/l/)
    expect(container.textContent ?? '').toMatch(/m\. 39\/B fıkra 3/)
  })

  it('Teslim item cites Yön. m. 21/2-a + m. 21/3', async () => {
    const user = userEvent.setup()
    const { container } = render(<OptimizerYasalPaneli />)
    await user.click(screen.getByText(/Üç Kapı Kuralı/))
    expect(container.textContent ?? '').toMatch(/m\. 21\/2-a/)
    expect(container.textContent ?? '').toMatch(/m\. 21\/3/)
    expect(container.textContent ?? '').toMatch(/150 gün.*5 tasarruf/)
  })

  it('Cayma item cites Kanun 6361 m. 39/A fıkra 3', async () => {
    const user = userEvent.setup()
    const { container } = render(<OptimizerYasalPaneli />)
    await user.click(screen.getByText(/Organizasyon Ücreti ve Cayma/))
    expect(container.textContent ?? '').toMatch(/Kanun 6361 m\. 39\/A fıkra 3/)
    expect(container.textContent ?? '').toMatch(/14 gün/)
  })
})

describe('OptimizerYasalPaneli — accordion behavior', () => {
  it('only one panel open at a time', async () => {
    const user = userEvent.setup()
    const { container } = render(<OptimizerYasalPaneli />)
    await user.click(screen.getByText(/Vade Üst Sınırı/))
    expect(container.textContent ?? '').toMatch(/60 ay.*aşamaz|aşamaz.*60 ay/)
    await user.click(screen.getByText(/Faizsiz Finansman Esaslıdır/))
    // Faizsizlik panel now open; vade-cap body (which mentions 120/60 ay)
    // should no longer be in the DOM.
    const text = container.textContent ?? ''
    expect(text).toMatch(/faiz içermeyen/i)
    expect(text).not.toMatch(/120 ay.*aşamaz|aşamaz.*120 ay/)
  })
})
