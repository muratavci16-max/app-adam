// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import KarsilastirmaClient from '../../components/hesaplama/KarsilastirmaClient'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))
vi.mock('../../components/ui/AdBanner', () => ({
  default: () => null,
}))

describe('T1 — Ara-dönem ödeme tooltip (Yön. m. 21/3 son cümle)', () => {
  it('adds an anti-prepayment tooltip on the taksit input label', () => {
    render(<KarsilastirmaClient />)
    const label = screen.getByText(/Başlangıç Taksit/)
    const title = label.getAttribute('title') ?? ''
    expect(title).toMatch(/tahsisat.*tarihini öne çekmez/i)
    expect(title).toMatch(/21\/3/)
  })

  it('includes an info affordance (ⓘ) next to the label', () => {
    const { container } = render(<KarsilastirmaClient />)
    // The label carries the aria-hidden info marker
    expect(container.textContent ?? '').toMatch(/Başlangıç Taksit.*ⓘ/)
  })
})
