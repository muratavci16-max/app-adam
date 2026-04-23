// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import OptimizerBanner from '../../components/optimizer/OptimizerBanner'
import HeroSection from '../../components/home/HeroSection'
import KarsilastirmaClient from '../../components/hesaplama/KarsilastirmaClient'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))
vi.mock('../../components/ui/AdBanner', () => ({
  default: () => null,
}))

describe('OptimizerBanner — standalone', () => {
  it('renders a link to /optimizasyon with all 7 pre-fill params', () => {
    const { container } = render(
      <OptimizerBanner
        tutar={1_800_000}
        pesinat={300_000}
        varlikTuru="konut"
        orgPct={8.5}
        krFaizAylik={2.49}
        mevduatYillik={40}
      />
    )
    const link = container.querySelector('a')!
    const href = link.getAttribute('href') ?? ''
    expect(href).toMatch(/^\/optimizasyon\?/)
    const params = new URLSearchParams(href.split('?')[1])
    expect(params.get('mode')).toBe('taksit')
    expect(params.get('tutar')).toBe('1800000')
    expect(params.get('pesinat')).toBe('300000')
    expect(params.get('varlikTuru')).toBe('konut')
    expect(params.get('orgPct')).toBe('8.5')
    expect(params.get('krFaiz')).toBe('2.49')
    expect(params.get('mevduatYillik')).toBe('40')
  })

  it('shows the "Hangi vade daha uygun?" hook copy', () => {
    render(
      <OptimizerBanner
        tutar={1_800_000}
        pesinat={300_000}
        varlikTuru="konut"
        orgPct={8.5}
        krFaizAylik={2.49}
        mevduatYillik={40}
      />
    )
    expect(screen.getByText(/Hangi vade daha uygun\?/)).toBeTruthy()
  })
})

describe('HeroSection — optimizer CTA', () => {
  const slides = [
    {
      badge: 'Tekno',
      baslik: 'Test başlık',
      vurgu: 'Test',
      aciklama: 'Test açıklama.',
      stats: [],
    },
  ]

  it('shows "En Uygun Vadeyi Bul" CTA linking to /optimizasyon with varlıkTürü + kr_faiz', () => {
    const { container } = render(<HeroSection slides={slides as any} />)
    const links = Array.from(container.querySelectorAll('a'))
    const optimizerLink = links.find(a => a.textContent?.includes('En Uygun Vadeyi Bul'))
    expect(optimizerLink).toBeTruthy()
    const href = optimizerLink!.getAttribute('href') ?? ''
    expect(href).toMatch(/^\/optimizasyon\?/)
    expect(href).toMatch(/varlikTuru=konut/)
    expect(href).toMatch(/kr_faiz=/)
  })
})

describe('KarsilastirmaClient — optimizer banner appears when sonuc is available', () => {
  it('renders OptimizerBanner after sonuc computes', async () => {
    const { findByText } = render(<KarsilastirmaClient />)
    // sonuc is computed client-side; banner should appear after effect runs.
    const hook = await findByText(/Hangi vade daha uygun\?/)
    expect(hook).toBeTruthy()
  })
})
