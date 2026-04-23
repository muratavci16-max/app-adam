// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import YasalBilgiPaneli from '../../components/hesaplama/YasalBilgiPaneli'

describe('E1 — Cayma hakkı disclosure (YasalBilgiPaneli)', () => {
  it('renders three accordion items', () => {
    render(<YasalBilgiPaneli />)
    expect(screen.getByText('14 Günlük Cayma Hakkı')).toBeTruthy()
    expect(screen.getByText('Mevduat Sigortası Kapsamı Dışındadır')).toBeTruthy()
    expect(screen.getByText('Sözleşme Tipi ve Teslim Şartları')).toBeTruthy()
  })

  it('cayma body reveals required disclosure substrings when expanded', async () => {
    const user = userEvent.setup()
    const { container } = render(<YasalBilgiPaneli />)
    await user.click(screen.getByText('14 Günlük Cayma Hakkı'))
    const text = container.textContent ?? ''
    expect(text).toMatch(/14 gün/)
    expect(text).toMatch(/iade/)
    expect(text).toMatch(/organizasyon ücreti dahil/i)
    expect(text).toMatch(/Kanun 6361 m\. 39\/A/)
  })

  it('mevduat sigortası body mentions the explicit exclusion', async () => {
    const user = userEvent.setup()
    const { container } = render(<YasalBilgiPaneli />)
    await user.click(screen.getByText('Mevduat Sigortası Kapsamı Dışındadır'))
    const text = container.textContent ?? ''
    expect(text).toMatch(/mevduat sigortası.*kapsamında değildir/i)
    expect(text).toMatch(/Kanun 6361 m\. 50\/A/)
  })

  it('sözleşme tipi body explains the three-gate rule', async () => {
    const user = userEvent.setup()
    const { container } = render(<YasalBilgiPaneli />)
    await user.click(screen.getByText('Sözleşme Tipi ve Teslim Şartları'))
    const text = container.textContent ?? ''
    expect(text).toMatch(/tasarrufun %40/)
    expect(text).toMatch(/sözleşme süresinin %40/)
    expect(text).toMatch(/150 gün \+ 5 ödeme/)
    expect(text).toMatch(/m\. 21\/3/)
  })

  it('only one panel is open at a time', async () => {
    const user = userEvent.setup()
    const { container } = render(<YasalBilgiPaneli />)
    await user.click(screen.getByText('14 Günlük Cayma Hakkı'))
    expect(container.textContent ?? '').toMatch(/14 gün/)
    await user.click(screen.getByText('Mevduat Sigortası Kapsamı Dışındadır'))
    const text2 = container.textContent ?? ''
    // Mevduat panel now open
    expect(text2).toMatch(/mevduat sigortası/i)
    // Cayma body no longer in DOM
    expect(text2).not.toMatch(/cezai şart ödemeksizin/)
  })
})
