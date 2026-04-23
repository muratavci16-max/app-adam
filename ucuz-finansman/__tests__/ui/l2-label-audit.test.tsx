// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import KarsilastirmaClient from '../../components/hesaplama/KarsilastirmaClient'

// Next.js hooks we need to stub for this client-only test
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

// AdBanner relies on env vars we don't care about here
vi.mock('../../components/ui/AdBanner', () => ({
  default: () => null,
}))

describe('L2 — IRR/faiz label audit', () => {
  it('does not render any "TF ... etkin/eşdeğer ... faiz" compound on the page', () => {
    const { container } = render(<KarsilastirmaClient />)
    // Forbidden pattern: TF followed (within 20 chars) by "etkin" or "eşdeğer",
    // followed by aylık/yıllık followed by "faiz"
    const forbidden = /tf.{0,20}(etkin|eşdeğer)\s+(aylık|yıllık)\s+faiz/i
    expect(container.textContent ?? '').not.toMatch(forbidden)
  })

  it('renders the new "Maliyet Oranı" labels for TF reference rates', () => {
    const { container } = render(<KarsilastirmaClient />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/TF Aylık Maliyet Oranı/)
    expect(text).toMatch(/TF Yıllık Maliyet Oranı/)
  })

  it('keeps the banner copy as "Maliyet Karşılaştırma Analizi" (no "Etkin Faiz Analizi")', () => {
    const { container } = render(<KarsilastirmaClient />)
    const text = container.textContent ?? ''
    expect(text).toMatch(/Maliyet Karşılaştırma Analizi/)
    expect(text).not.toMatch(/Etkin Faiz Analizi/)
  })

  it('renames "Organizasyon / Hizmet Ücreti" to "Organizasyon Ücreti"', () => {
    const { container } = render(<KarsilastirmaClient />)
    const text = container.textContent ?? ''
    expect(text).not.toMatch(/Organizasyon\s*\/\s*Hizmet Ücreti/)
    expect(text).toMatch(/Organizasyon Ücreti/)
  })
})
