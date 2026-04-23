// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OptimizerClient from '../../components/optimizer/OptimizerClient'

// Stub Next.js navigation
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}))

// Stub chart to avoid canvas in jsdom
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="delta-chart-stub" />,
}))

describe('OptimizerClient — mount + mode selector', () => {
  it('renders the three mode options', () => {
    render(<OptimizerClient />)
    expect(screen.getByText(/Tutar'ı bul/)).toBeTruthy()
    expect(screen.getByText(/Taksit'i bul/)).toBeTruthy()
    expect(screen.getByText(/Peşinat'ı bul/)).toBeTruthy()
  })

  it('defaults to "Taksit\'i bul" mode (taksit input disabled)', () => {
    render(<OptimizerClient />)
    const taksitLabel = screen.getByText(/Aylık Taksit/)
    // When a mode's field is disabled, we tag it with the "Optimizer hesaplıyor" suffix
    expect(taksitLabel.textContent ?? '').toMatch(/Optimizer hesaplıyor/)
  })

  it('switching to "Tutar\'ı bul" disables tutar input instead', async () => {
    const user = userEvent.setup()
    render(<OptimizerClient />)
    await user.click(screen.getByText(/Tutar'ı bul/))
    const tutarLabel = screen.getByText(/Toplam Finansman Tutarı/)
    expect(tutarLabel.textContent ?? '').toMatch(/Optimizer hesaplıyor/)
    // And taksit is no longer the derived one
    const taksitLabel = screen.getByText(/Aylık Taksit/)
    expect(taksitLabel.textContent ?? '').not.toMatch(/Optimizer hesaplıyor/)
  })
})

describe('OptimizerClient — empty state when inputs missing', () => {
  it('shows "Bekleniyor" empty state before any inputs', () => {
    render(<OptimizerClient />)
    expect(screen.getByText(/Bekleniyor/)).toBeTruthy()
  })
})

describe('OptimizerClient — result rendering', () => {
  async function fillModeB(user: ReturnType<typeof userEvent.setup>) {
    // Mode B default: need tutar + peşinat (both text inputs via useNumericInputState)
    const textInputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    const tutar = textInputs[0]
    const pesinat = textInputs[1]
    await user.clear(tutar)
    await user.type(tutar, '1800000')
    await user.clear(pesinat)
    await user.type(pesinat, '300000')
  }

  it('Current TR market (r_m=40 > r_b=2.49) triggers tfAlwaysExpensive UX', async () => {
    const user = userEvent.setup()
    render(<OptimizerClient />)
    await fillModeB(user)

    // FlipConditions should appear (its slider labels are unique)
    expect(screen.getByLabelText(/Kredi aylık faizi/i)).toBeTruthy()
    // Collapsed "Yine de en az kayıp eden..." details should be present
    expect(screen.getByText(/Yine de en az kayıp eden/)).toBeTruthy()
  })

  it('High r_b / low r_m market produces the favorable-market UX with 3 cards', async () => {
    const user = userEvent.setup()
    const { container } = render(<OptimizerClient />)
    await fillModeB(user)

    // Market inputs are type=number (spinbutton role). Grab them by DOM order.
    const numberInputs = container.querySelectorAll<HTMLInputElement>('input[type="number"]')
    // Order: orgPct, krFaizAylik, mevduatYillik
    const krFaiz = numberInputs[1]
    const mevduat = numberInputs[2]
    await user.clear(krFaiz)
    await user.type(krFaiz, '4.5')
    await user.clear(mevduat)
    await user.type(mevduat, '10')

    // Headline appears only in favorable mode
    expect(screen.getByText(/En Uygun 3 Yapılandırma/)).toBeTruthy()
  })
})

describe('OptimizerClient — "Detaylı incele" push to /karsilastirma', () => {
  it('navigates with all 7 URL params', async () => {
    pushMock.mockClear()
    const user = userEvent.setup()
    render(<OptimizerClient />)

    const textInputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    await user.clear(textInputs[0])
    await user.type(textInputs[0], '1800000')
    await user.clear(textInputs[1])
    await user.type(textInputs[1], '300000')
    // Keep it in tfAlwaysExpensive — cards are inside <details> but still rendered.
    const clickables = screen.getAllByText(/Detaylı incele/)
    expect(clickables.length).toBeGreaterThan(0)
    await user.click(clickables[0])

    expect(pushMock).toHaveBeenCalled()
    const url = pushMock.mock.calls[0][0] as string
    expect(url).toMatch(/^\/karsilastirma\?/)
    const params = new URLSearchParams(url.split('?')[1])
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
