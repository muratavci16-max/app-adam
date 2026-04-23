import { useState, useEffect, useRef } from 'react'

interface IntRangeInputOpts {
  min: number
  max: number
}

interface IntRangeInputProps {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onFocus: () => void
  isValid: boolean
}

/**
 * Hook for a bounded integer input. Supports free editing (clear + retype)
 * without snapping back on every keystroke.
 *
 * - Local string state holds whatever the user has typed (even empty, even out of range).
 * - Commits to the caller only when input parses to an integer within [min, max].
 * - `isValid` reports whether the current displayed string is a valid committed value.
 * - On blur, if current string is invalid, display snaps to the last committed value.
 * - Syncs display from external numeric changes when not focused.
 */
export function useIntRangeInput(
  numericValue: number,
  onCommit: (val: number) => void,
  opts: IntRangeInputOpts,
): IntRangeInputProps {
  const { min, max } = opts
  const [str, setStr] = useState(() => String(numericValue))
  const focusedRef = useRef(false)

  // Sync external state changes when not focused.
  useEffect(() => {
    if (focusedRef.current) return
    setStr(String(numericValue))
  }, [numericValue])

  const parsed = parseInt(str, 10)
  const isValid = Number.isFinite(parsed) && parsed >= min && parsed <= max

  return {
    value: str,
    isValid,
    onFocus: () => {
      focusedRef.current = true
    },
    onBlur: () => {
      focusedRef.current = false
      if (!isValid) {
        setStr(String(numericValue))
      }
    },
    onChange: (e) => {
      const raw = e.target.value
      setStr(raw)
      const n = parseInt(raw, 10)
      if (Number.isFinite(n) && n >= min && n <= max) {
        onCommit(n)
      }
    },
  }
}
