import { describe, it, expect } from 'vitest'
import {
  filterCurrencyInput,
  stripNonNumericChars,
  CURRENCY_INPUT_CHAR_REGEX,
  NUMERIC_CHAR_REGEX,
  formatCurrencyDisplay,
  mapCursorToFormatted,
} from '../lib/input-filter'

describe('filterCurrencyInput', () => {
  it('strips letters', () => {
    expect(filterCurrencyInput('6q000')).toBe('6000')
  })
  it('strips dots (thousand separators - auto-inserted on blur)', () => {
    expect(filterCurrencyInput('1.000.000')).toBe('1000000')
    expect(filterCurrencyInput('123.456,78')).toBe('123456,78')
  })
  it('allows only one comma', () => {
    expect(filterCurrencyInput('12,3,4')).toBe('12,34')
  })
  it('allows minus only at start', () => {
    expect(filterCurrencyInput('-500')).toBe('-500')
    expect(filterCurrencyInput('5-00')).toBe('500')
  })
  it('strips mixed invalid chars and caps decimals to 2', () => {
    // Letters and dots stripped first → raw "12345000"; then comma at original position 3 →
    // "123,45000" → truncated to 2 decimals → "123,45"
    expect(filterCurrencyInput('abc.123,45.00xyz')).toBe('123,45')
  })
  it('stripping 123000.00 gives 12300000 (no decimal point)', () => {
    // Old confusing case: user pastes "123000.00" thinking dot is decimal.
    // With thousand-separator-stripping, dots are stripped → "12300000".
    // This is the CORRECT behavior per Turkish locale — if they wanted decimal, they should type comma.
    expect(filterCurrencyInput('123000.00')).toBe('12300000')
  })
  it('caps decimals to 2 digits (TL kuruş precision)', () => {
    expect(filterCurrencyInput('20,0000023120003')).toBe('20,00')
    expect(filterCurrencyInput('100,999')).toBe('100,99')
    expect(filterCurrencyInput('50,1')).toBe('50,1')
    expect(filterCurrencyInput('50,12')).toBe('50,12')
    expect(filterCurrencyInput('50,')).toBe('50,')
  })
  it('strips leading zeros', () => {
    expect(filterCurrencyInput('00000')).toBe('0')          // all zeros collapse to single 0
    expect(filterCurrencyInput('00.000')).toBe('0')          // dots stripped + leading zeros collapsed
    expect(filterCurrencyInput('0100')).toBe('100')          // "0100" → "100"
    expect(filterCurrencyInput('01')).toBe('1')              // "01" → "1"
    expect(filterCurrencyInput('0')).toBe('0')               // single zero preserved
    expect(filterCurrencyInput('0,5')).toBe('0,5')           // zero before decimal preserved
    expect(filterCurrencyInput('00,5')).toBe('0,5')          // multi-zero before decimal collapsed
    expect(filterCurrencyInput('-00')).toBe('-0')            // negative multi-zero
    expect(filterCurrencyInput('-0100')).toBe('-100')        // negative with leading zeros
  })
  it('strips emoji and Arabic digits', () => {
    expect(filterCurrencyInput('💰100')).toBe('100')
    expect(filterCurrencyInput('١٠٠')).toBe('')
  })
  it('empty stays empty', () => {
    expect(filterCurrencyInput('')).toBe('')
  })
})

describe('stripNonNumericChars (deprecated alias)', () => {
  it('delegates to filterCurrencyInput', () => {
    // Same semantics — dots are stripped now.
    expect(stripNonNumericChars('6q000')).toBe('6000')
    expect(stripNonNumericChars('1.000,50')).toBe('1000,50')
    expect(stripNonNumericChars('-500')).toBe('-500')
    expect(stripNonNumericChars('')).toBe('')
  })
})

describe('CURRENCY_INPUT_CHAR_REGEX', () => {
  it('accepts digits', () => expect(CURRENCY_INPUT_CHAR_REGEX.test('5')).toBe(true))
  it('accepts comma', () => expect(CURRENCY_INPUT_CHAR_REGEX.test(',')).toBe(true))
  it('rejects dot (formatting noise during typing)', () =>
    expect(CURRENCY_INPUT_CHAR_REGEX.test('.')).toBe(false))
  it('accepts minus', () => expect(CURRENCY_INPUT_CHAR_REGEX.test('-')).toBe(true))
  it('rejects letters', () => expect(CURRENCY_INPUT_CHAR_REGEX.test('q')).toBe(false))
  it('rejects space', () => expect(CURRENCY_INPUT_CHAR_REGEX.test(' ')).toBe(false))
})

describe('NUMERIC_CHAR_REGEX (deprecated alias)', () => {
  it('is the same as CURRENCY_INPUT_CHAR_REGEX', () => {
    expect(NUMERIC_CHAR_REGEX).toBe(CURRENCY_INPUT_CHAR_REGEX)
  })
})

describe('formatCurrencyDisplay', () => {
  it('empty stays empty', () => expect(formatCurrencyDisplay('')).toBe(''))
  it('3 or fewer digits unchanged', () => {
    expect(formatCurrencyDisplay('1')).toBe('1')
    expect(formatCurrencyDisplay('999')).toBe('999')
  })
  it('inserts separators every 3 digits', () => {
    expect(formatCurrencyDisplay('1000')).toBe('1.000')
    expect(formatCurrencyDisplay('12345')).toBe('12.345')
    expect(formatCurrencyDisplay('1234567')).toBe('1.234.567')
    expect(formatCurrencyDisplay('2000123')).toBe('2.000.123')
  })
  it('preserves decimal part', () => {
    expect(formatCurrencyDisplay('1000,5')).toBe('1.000,5')
    expect(formatCurrencyDisplay('1234567,89')).toBe('1.234.567,89')
  })
  it('handles leading minus', () => {
    expect(formatCurrencyDisplay('-1000')).toBe('-1.000')
    expect(formatCurrencyDisplay('-')).toBe('-')
  })
  it('handles trailing comma during typing', () => {
    expect(formatCurrencyDisplay('1000,')).toBe('1.000,')
    expect(formatCurrencyDisplay(',')).toBe(',')
  })
})

describe('mapCursorToFormatted', () => {
  it('end-of-typing: cursor at end of formatted', () => {
    expect(mapCursorToFormatted('2000', 4, '2.000')).toBe(5)
    expect(mapCursorToFormatted('2000123', 7, '2.000.123')).toBe(9)
  })
  it('middle: cursor maps by non-dot digit count', () => {
    // "2000" pos 2 → after 2 digits → "2.0|00" → position 3
    expect(mapCursorToFormatted('2000', 2, '2.000')).toBe(3)
    // "12345678" pos 4 → after 4 digits → "12.34|5.678" → position 5
    expect(mapCursorToFormatted('12345678', 4, '12.345.678')).toBe(5)
  })
  it('start: cursor at 0 stays at 0', () => {
    expect(mapCursorToFormatted('2000', 0, '2.000')).toBe(0)
  })
  it('works with existing dot in raw input', () => {
    // If user's DOM already has a dot (from prior format), that dot counts as skip.
    // "2.000" cursor at 5 (end). Non-dot count = 4. Formatted "2.000" pos for 4 non-dot: end = 5.
    expect(mapCursorToFormatted('2.000', 5, '2.000')).toBe(5)
  })
})
