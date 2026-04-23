// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OptimizerClient from '../../components/optimizer/OptimizerClient'

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="chart-stub" />,
}))

describe('Optimizer — E2E happy path', () => {
  it('Mode B: fill tutar + peşinat → see 3 option cards → click Detaylı incele → all 7 URL params carry through', async () => {
    pushMock.mockClear()
    const user = userEvent.setup()
    render(<OptimizerClient />)

    // 1. Default mode is Taksit'i bul — confirm via disabled-field label
    expect(screen.getByText(/Aylık Taksit/).textContent).toMatch(/Optimizer hesaplıyor/)

    // 2. Fill inputs via DOM order: [tutar, peşinat, taksit(disabled), org%, kr%, mevduat%]
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    await user.clear(inputs[0])
    await user.type(inputs[0], '1800000')
    await user.clear(inputs[1])
    await user.type(inputs[1], '300000')

    // 3. Bend market to favorable regime (high kredi, low mevduat)
    //    so we exercise the "not tfAlwaysExpensive" branch.
    await user.clear(inputs[4])  // kr faiz
    await user.type(inputs[4], '4.5')
    await user.clear(inputs[5])  // mevduat yıllık
    await user.type(inputs[5], '10')

    // 4. "En Uygun 3 Yapılandırma" headline must appear
    expect(screen.getByText(/En Uygun 3 Yapılandırma/)).toBeTruthy()

    // 5. 3 option cards must be present
    expect(screen.queryByTestId('option-card-rank-1')).toBeTruthy()
    expect(screen.queryByTestId('option-card-rank-2')).toBeTruthy()
    expect(screen.queryByTestId('option-card-rank-3')).toBeTruthy()

    // 6. Full-sweep chart stub is mounted
    expect(screen.getAllByTestId('chart-stub').length).toBeGreaterThan(0)

    // 7. Yasal panel is mounted
    expect(screen.getByText(/Yasal Bilgilendirme/)).toBeTruthy()
    expect(screen.getByText(/Vade Üst Sınırı/)).toBeTruthy()

    // 8. Click "Detaylı incele" on rank 1 → push to /karsilastirma with all 7 params
    const detailBtns = screen.getAllByText(/Detaylı incele/)
    await user.click(detailBtns[0])
    expect(pushMock).toHaveBeenCalled()
    const url = pushMock.mock.calls[0][0] as string
    expect(url).toMatch(/^\/karsilastirma\?/)
    const params = new URLSearchParams(url.split('?')[1])
    // All 7 required params
    expect(params.get('tutar')).toBeTruthy()
    expect(params.get('pesinat')).toBeTruthy()
    expect(params.get('taksit')).toBeTruthy()
    expect(params.get('months')).toBeTruthy()
    expect(params.get('varlikTuru')).toBeTruthy()
    expect(params.get('orgPct')).toBeTruthy()
    expect(params.get('kr_faiz')).toBeTruthy()
    expect(params.get('mevduat_y')).toBeTruthy()
  })
})
