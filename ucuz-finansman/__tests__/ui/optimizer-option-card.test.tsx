// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OptionCard from '../../components/optimizer/OptionCard'
import type { OptimizeOption } from '../../lib/tf-optimize'

function makeOption(over: Partial<OptimizeOption> = {}): OptimizeOption {
  return {
    vade: 25,
    tutar: 1_800_000,
    pesinat: 300_000,
    taksit: 60_000,
    teslimAy: 9,
    kalanVade: 17,
    krediIhtiyaci: 700_000,
    esdegerBankaTaksiti: 51_000,
    delta: -150_000,
    tfDahaUcuz: true,
    feasible: true,
    ...over,
  }
}

describe('OptionCard — basic render', () => {
  it('shows vade and derived-value label for mode=taksit', () => {
    const option = makeOption()
    render(<OptionCard option={option} mode="taksit" rank={1} tfAlwaysExpensive={false} />)
    expect(screen.getByText(/25 ay vade/)).toBeTruthy()
    expect(screen.getByText(/Aylık Taksit/)).toBeTruthy()
  })

  it('shows tutar as derived value for mode=tutar', () => {
    const option = makeOption({ tutar: 3_000_000 })
    const { container } = render(
      <OptionCard option={option} mode="tutar" rank={1} tfAlwaysExpensive={false} />
    )
    expect(container.textContent ?? '').toMatch(/Toplam Tutar/)
  })

  it('shows pesinat as derived value for mode=pesinat', () => {
    const option = makeOption({ pesinat: 250_000 })
    const { container } = render(
      <OptionCard option={option} mode="pesinat" rank={1} tfAlwaysExpensive={false} />
    )
    expect(container.textContent ?? '').toMatch(/Peşinat/)
  })

  it('rank labels differ by position', () => {
    const option = makeOption()
    const { container: c1 } = render(
      <OptionCard option={option} mode="taksit" rank={1} tfAlwaysExpensive={false} />
    )
    expect(c1.textContent ?? '').toMatch(/En İyi/)

    const { container: c2 } = render(
      <OptionCard option={option} mode="taksit" rank={2} tfAlwaysExpensive={false} />
    )
    expect(c2.textContent ?? '').toMatch(/2\. Sıra/)
  })
})

describe('OptionCard — badges', () => {
  it('green "TF X daha ucuz" badge when tfDahaUcuz and market is not always-expensive', () => {
    const option = makeOption({ tfDahaUcuz: true, delta: -150_000 })
    const { container } = render(
      <OptionCard option={option} mode="taksit" rank={1} tfAlwaysExpensive={false} />
    )
    expect(container.textContent ?? '').toMatch(/TF.*daha ucuz/i)
    expect(container.textContent ?? '').not.toMatch(/Banka.*daha ucuz/i)
  })

  it('red "Banka X daha ucuz" badge when tfAlwaysExpensive even if delta < 0', () => {
    const option = makeOption({ tfDahaUcuz: true, delta: -10_000 })
    const { container } = render(
      <OptionCard option={option} mode="taksit" rank={1} tfAlwaysExpensive={true} />
    )
    expect(container.textContent ?? '').toMatch(/Banka.*daha ucuz/i)
  })

  it('red badge when tfDahaUcuz is false', () => {
    const option = makeOption({ tfDahaUcuz: false, delta: 150_000 })
    const { container } = render(
      <OptionCard option={option} mode="taksit" rank={1} tfAlwaysExpensive={false} />
    )
    expect(container.textContent ?? '').toMatch(/Banka.*daha ucuz/i)
  })
})

describe('OptionCard — "Neden?" footer', () => {
  it('cites teslim ayı and kalan vade', () => {
    const option = makeOption({ teslimAy: 9, kalanVade: 17 })
    const { container } = render(
      <OptionCard option={option} mode="taksit" rank={1} tfAlwaysExpensive={false} />
    )
    expect(container.textContent ?? '').toMatch(/Neden\?/)
    expect(container.textContent ?? '').toMatch(/9\. ayda/)
    expect(container.textContent ?? '').toMatch(/17 ay/)
  })

  it('copy differs between favorable and unfavorable markets', () => {
    const favorable = render(
      <OptionCard option={makeOption({ tfDahaUcuz: true })} mode="taksit" rank={1} tfAlwaysExpensive={false} />
    ).container.textContent ?? ''
    const alwaysExpensive = render(
      <OptionCard option={makeOption({ tfDahaUcuz: true })} mode="taksit" rank={1} tfAlwaysExpensive={true} />
    ).container.textContent ?? ''
    expect(favorable).not.toBe(alwaysExpensive)
    expect(alwaysExpensive).toMatch(/en az farkı/i)
  })
})

describe('OptionCard — Detaylı incele CTA', () => {
  it('renders only when onDetailClick is provided', () => {
    const { container: withCta } = render(
      <OptionCard option={makeOption()} mode="taksit" rank={1} tfAlwaysExpensive={false} onDetailClick={() => {}} />
    )
    expect(withCta.textContent ?? '').toMatch(/Detaylı incele/)

    const { container: noCta } = render(
      <OptionCard option={makeOption()} mode="taksit" rank={1} tfAlwaysExpensive={false} />
    )
    expect(noCta.textContent ?? '').not.toMatch(/Detaylı incele/)
  })

  it('calls onDetailClick when clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <OptionCard option={makeOption()} mode="taksit" rank={1} tfAlwaysExpensive={false} onDetailClick={onClick} />
    )
    await user.click(screen.getByText(/Detaylı incele/))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
