import { useState, useEffect, useRef, useLayoutEffect, RefObject } from 'react'
import { parseInput } from './hesaplamalar'
import { filterCurrencyInput, formatCurrencyDisplay, mapCursorToFormatted } from './input-filter'

interface NumericInputProps {
  ref: RefObject<HTMLInputElement | null>
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onFocus: () => void
}

/**
 * Hook for a currency-style text input.
 * - Formats the display on every keystroke (Turkish thousand separators).
 * - Preserves cursor position across format-induced re-renders.
 * - Commits the parsed numeric value to the caller immediately if valid.
 * - Reformats canonical form on blur.
 * - Syncs display from external state changes (but never when the user is actively focused).
 *
 * Accepts `numericValue: number | undefined` — undefined renders an empty
 * input (used by /optimizasyon for the derived field and pre-fill state).
 */
export function useNumericInputState(
  numericValue: number | undefined,
  onCommit: (val: number) => void,
  opts: { rounded?: boolean } = {}
): NumericInputProps {
  const { rounded = true } = opts

  const formatFromNumber = (n: number | undefined): string => {
    if (n === undefined || !Number.isFinite(n)) return ''
    if (rounded) {
      return formatCurrencyDisplay(String(Math.round(n)))
    }
    // For non-rounded values, show up to 2 decimals (TL kuruş precision).
    const fixed = (Math.round(n * 100) / 100).toString()
    if (fixed.includes('.')) {
      const [i, d] = fixed.split('.')
      return formatCurrencyDisplay(i + ',' + d)
    }
    return formatCurrencyDisplay(fixed)
  }

  const [str, setStr] = useState(() => formatFromNumber(numericValue))
  const focusedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const cursorRef = useRef<number | null>(null)

  // Sync external state changes when not focused.
  useEffect(() => {
    if (focusedRef.current) return
    setStr(formatFromNumber(numericValue))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numericValue, rounded])

  // Restore cursor after any re-render that set `cursorRef`.
  useLayoutEffect(() => {
    if (cursorRef.current !== null && inputRef.current) {
      const pos = cursorRef.current
      inputRef.current.setSelectionRange(pos, pos)
      cursorRef.current = null
    }
  })

  return {
    ref: inputRef,
    value: str,
    onFocus: () => { focusedRef.current = true },
    onBlur: () => {
      focusedRef.current = false
      setStr(formatFromNumber(numericValue))
    },
    onChange: (e) => {
      const rawInput = e.target.value
      const rawCursor = e.target.selectionStart ?? rawInput.length
      const filtered = filterCurrencyInput(rawInput)
      const formatted = formatCurrencyDisplay(filtered)
      cursorRef.current = mapCursorToFormatted(rawInput, rawCursor, formatted)
      setStr(formatted)
      const parsed = parseInput(filtered, false)
      if (Number.isFinite(parsed) && parsed >= 0) {
        onCommit(parsed)
      }
    },
  }
}
