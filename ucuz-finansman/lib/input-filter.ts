/**
 * Filter raw input for a Turkish-locale currency text input.
 *
 * Rules during typing (dots are auto-inserted on blur via `toLocaleString`, so the
 * user does NOT need to type them):
 *   - Keep only digits, one leading minus (first char only), and one comma (decimal separator)
 *   - Strip all dots (thousand separators — added automatically on blur)
 *   - Strip all other characters
 *
 * Note on pasted English-style numbers: `filterCurrencyInput('123000.00')` returns
 * `'12300000'` because the dot is treated as a thousand-separator noise character and
 * stripped. If a user intended a decimal value, they must type comma (Turkish locale).
 * On blur, the input `'12300000'` will be formatted to `'12.300.000'`.
 */
// TL currency precision: 2 decimal digits max (kuruş).
export const CURRENCY_MAX_DECIMALS = 2

export function filterCurrencyInput(raw: string): string {
  // First: strip everything except digits, commas, and minus signs (also strips dots).
  let out = raw.replace(/[^\d,\-]/g, '')

  // Minus only at position 0 — drop any minus that isn't the very first character.
  out = out.replace(/(?!^)-/g, '')

  // Only one comma allowed — keep the first, strip the rest. Truncate decimals to 2 digits
  // (TL kuruş precision).
  const firstCommaIdx = out.indexOf(',')
  if (firstCommaIdx !== -1) {
    const before = out.slice(0, firstCommaIdx + 1)
    const after = out.slice(firstCommaIdx + 1).replace(/,/g, '').slice(0, CURRENCY_MAX_DECIMALS)
    out = before + after
  }

  // Strip leading zeros from the integer part: "00000" → "0", "0100" → "100".
  // Preserve a single "0" when it's followed by a comma (e.g. "0,5") or is the whole value.
  out = stripLeadingZeros(out)

  return out
}

function stripLeadingZeros(s: string): string {
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  if (!body.startsWith('0') || body.length <= 1) return s

  // Find first non-zero digit
  let i = 0
  while (i < body.length && body[i] === '0') i++

  // If all zeros or next char is comma, keep a single "0"
  if (i === body.length || body[i] === ',') {
    return (neg ? '-' : '') + '0' + body.slice(i)
  }
  return (neg ? '-' : '') + body.slice(i)
}

/**
 * @deprecated Use `filterCurrencyInput` instead.
 * Kept for backwards compatibility with callers that imported the old name.
 * Delegates to `filterCurrencyInput` so behavior is consistent across the app.
 */
export function stripNonNumericChars(raw: string): string {
  return filterCurrencyInput(raw)
}

// Characters allowed to be directly typed into the currency input.
// Dots are intentionally excluded — they are formatting noise during typing and
// are auto-inserted on blur via `toLocaleString('tr-TR')`.
export const CURRENCY_INPUT_CHAR_REGEX = /^[\d,\-]$/

/**
 * @deprecated Use `CURRENCY_INPUT_CHAR_REGEX` instead.
 * Old name kept as an alias for callers/tests that still import it.
 * Note: semantics changed — dots are now rejected. This matches the new onBeforeInput
 * behavior and keeps the regex in sync with the filter.
 */
export const NUMERIC_CHAR_REGEX = CURRENCY_INPUT_CHAR_REGEX

// React onBeforeInput handler that cancels if the inserted character is invalid.
// Pass this to <input onBeforeInput={...}> for immediate keystroke prevention.
export function numericOnlyBeforeInput(e: React.FormEvent<HTMLInputElement>) {
  const ev = e as unknown as InputEvent
  // ev.data is null for deletion / composition events; let those through.
  if (ev.data == null) return
  // Reject any insertion containing a forbidden character.
  for (const ch of ev.data) {
    if (!CURRENCY_INPUT_CHAR_REGEX.test(ch)) {
      e.preventDefault()
      return
    }
  }
}

/**
 * Insert Turkish thousand separators (".") every 3 digits into the integer part.
 * Input should be output of `filterCurrencyInput` (digits, optional leading "-",
 * optional one comma with up to 2 decimal digits after).
 *
 * Examples:
 *   formatCurrencyDisplay("")           → ""
 *   formatCurrencyDisplay("2000")       → "2.000"
 *   formatCurrencyDisplay("2000000")    → "2.000.000"
 *   formatCurrencyDisplay("2000000,5")  → "2.000.000,5"
 *   formatCurrencyDisplay("2000000,50") → "2.000.000,50"
 *   formatCurrencyDisplay("-5000")      → "-5.000"
 *   formatCurrencyDisplay(",")          → ","       (trailing-comma-only OK during typing)
 *   formatCurrencyDisplay("-")          → "-"
 */
export function formatCurrencyDisplay(filtered: string): string {
  if (filtered === '' || filtered === '-' || filtered === ',' || filtered === '-,') return filtered
  const isNegative = filtered.startsWith('-')
  const body = isNegative ? filtered.slice(1) : filtered
  const commaIdx = body.indexOf(',')
  const intPart = commaIdx === -1 ? body : body.slice(0, commaIdx)
  const decPart = commaIdx === -1 ? '' : body.slice(commaIdx)
  const intFormatted = insertThousandSeparators(intPart)
  return (isNegative ? '-' : '') + intFormatted + decPart
}

function insertThousandSeparators(intStr: string): string {
  if (intStr.length <= 3) return intStr
  const out: string[] = []
  for (let i = 0; i < intStr.length; i++) {
    if (i > 0 && (intStr.length - i) % 3 === 0) out.push('.')
    out.push(intStr[i])
  }
  return out.join('')
}

/**
 * Map a cursor position from the raw input (pre-format) to the corresponding
 * position in the formatted display. Counts non-dot chars before the raw cursor,
 * then finds the index in the formatted string where the same count of non-dot
 * chars precedes.
 *
 * Examples:
 *   mapCursorToFormatted("2000", 4, "2.000")    → 5  (end → end)
 *   mapCursorToFormatted("2000", 2, "2.000")    → 3  (after 2 digits → "2.0|00")
 *   mapCursorToFormatted("12345678", 4, "12.345.678") → 5  (after "1234" → "12.34|5.678")
 */
export function mapCursorToFormatted(rawInput: string, rawCursor: number, formatted: string): number {
  let sig = 0
  for (let i = 0; i < Math.min(rawCursor, rawInput.length); i++) {
    if (rawInput[i] !== '.') sig++
  }
  let count = 0
  for (let i = 0; i <= formatted.length; i++) {
    if (count === sig) return i
    if (i < formatted.length && formatted[i] !== '.') count++
  }
  return formatted.length
}
