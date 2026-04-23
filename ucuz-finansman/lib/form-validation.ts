// Form input validation helpers
// These are pure functions kept free of UI/DOM concerns so they can be unit tested.

import { parseInput } from './hesaplamalar'

/**
 * Validates a raw string as a positive (strictly > 0) finite number.
 * Accepts Turkish-formatted numbers ("1.000.000,5" -> 1000000.5).
 * Returns null if the string does not represent a positive finite number.
 *
 * Uses the strict `parseInput(_, false)` parser so partial matches
 * (e.g. "6q000", "123abc") are rejected instead of silently truncated.
 */
export function validatePositiveNumber(raw: string): number | null {
  if (raw == null) return null
  const n = parseInput(raw, false)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/**
 * Validates a raw string as an integer within [min, max] (inclusive).
 * Non-integer values are floored before bounds checking.
 * Returns null on NaN/non-finite or out-of-range input.
 */
export function validateIntInRange(raw: string, min: number, max: number): number | null {
  if (raw == null) return null
  const n = parseFloat(raw)
  if (!Number.isFinite(n)) return null
  const rounded = Math.floor(n)
  if (rounded < min || rounded > max) return null
  return rounded
}
