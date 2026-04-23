// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { useNumericInputState } from '../../lib/useNumericInputState'
import { numericOnlyBeforeInput } from '../../lib/input-filter'

function TestInput({ initial = 0, onNumeric }: { initial?: number; onNumeric?: (n: number) => void }) {
  const [n, setN] = useState(initial)
  const input = useNumericInputState(n, val => {
    setN(val)
    onNumeric?.(val)
  })
  return (
    <input
      data-testid="num"
      type="text"
      inputMode="decimal"
      onBeforeInput={numericOnlyBeforeInput}
      {...input}
    />
  )
}

describe('useNumericInputState (UI behavior)', () => {
  it('rejects letters at keystroke', async () => {
    const user = userEvent.setup()
    const onNumeric = vi.fn()
    render(<TestInput onNumeric={onNumeric} />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input,'6q000')
    // Letter 'q' should never land in the value; display is formatted with separator
    expect(input.value).toBe('6.000')
    expect(onNumeric).toHaveBeenLastCalledWith(6000)
  })

  it('strips dots during typing (thousand-separator noise) and reformats', async () => {
    const user = userEvent.setup()
    render(<TestInput />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input,'123.456')
    // Typed dots are stripped from the raw value, then display is reformatted
    expect(input.value).toBe('123.456')
  })

  it('allows only one comma', async () => {
    const user = userEvent.setup()
    render(<TestInput />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input,'12,3,4')
    expect(input.value).toBe('12,34')
  })

  it('formats with thousand separators as user types', async () => {
    const user = userEvent.setup()
    render(<TestInput />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input, '2000')
    expect(input.value).toBe('2.000')
  })

  it('formats larger numbers', async () => {
    const user = userEvent.setup()
    render(<TestInput />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input, '2000123')
    expect(input.value).toBe('2.000.123')
  })

  it('preserves decimal during typing', async () => {
    const user = userEvent.setup()
    render(<TestInput initial={0} />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input, '1234,56')
    expect(input.value).toBe('1.234,56')
  })

  it('cursor stays at the end after format change', async () => {
    const user = userEvent.setup()
    render(<TestInput />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input, '2000')
    // After typing, display is "2.000" (5 chars), cursor should be at 5
    expect(input.selectionStart).toBe(5)
  })

  it('reformats on blur', async () => {
    const user = userEvent.setup()
    render(<TestInput />)
    const input = screen.getByTestId('num') as HTMLInputElement
    await user.click(input)
    await user.clear(input)
    await user.type(input,'60000')
    fireEvent.blur(input)
    expect(input.value).toBe('60.000')
  })

  it('external state change reformats the display', async () => {
    // Render a parent that can change state externally
    function ExternalDriver() {
      const [n, setN] = useState(100)
      const input = useNumericInputState(n, setN)
      return (
        <>
          <input data-testid="num" type="text" {...input} onBeforeInput={numericOnlyBeforeInput} />
          <button data-testid="ext" onClick={() => setN(5000)}>external</button>
        </>
      )
    }
    render(<ExternalDriver />)
    const input = screen.getByTestId('num') as HTMLInputElement
    expect(input.value).toBe('100')
    const btn = screen.getByTestId('ext')
    await userEvent.setup().click(btn)
    expect(input.value).toBe('5.000')
  })
})
