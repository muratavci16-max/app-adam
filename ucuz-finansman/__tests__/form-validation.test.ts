import { describe, it, expect } from 'vitest'
import { validatePositiveNumber, validateIntInRange } from '../lib/form-validation'

describe('validatePositiveNumber', () => {
  it('accepts a plain positive number', () => {
    expect(validatePositiveNumber('1500')).toBe(1500)
  })

  it('accepts a positive decimal with comma (tr-TR)', () => {
    expect(validatePositiveNumber('2,5')).toBe(2.5)
  })

  it('rejects zero', () => {
    expect(validatePositiveNumber('0')).toBeNull()
  })

  it('rejects negative numbers', () => {
    expect(validatePositiveNumber('-1')).toBeNull()
    expect(validatePositiveNumber('-100,50')).toBeNull()
  })

  it('rejects NaN / non-numeric strings', () => {
    expect(validatePositiveNumber('abc')).toBeNull()
    expect(validatePositiveNumber('xyz123')).toBeNull()
  })

  it('rejects empty string', () => {
    expect(validatePositiveNumber('')).toBeNull()
  })

  it('accepts "1.000" Turkish thousands format as 1000', () => {
    expect(validatePositiveNumber('1.000')).toBe(1000)
  })

  it('accepts "2.000.000" Turkish thousands as 2000000', () => {
    expect(validatePositiveNumber('2.000.000')).toBe(2000000)
  })

  it('accepts "1.000,50" (thousands + decimal) as 1000.5', () => {
    expect(validatePositiveNumber('1.000,50')).toBe(1000.5)
  })

  it('rejects Infinity', () => {
    expect(validatePositiveNumber('Infinity')).toBeNull()
  })

  it('rejects "6q000" (partial parse)', () => {
    expect(validatePositiveNumber('6q000')).toBe(null)
  })
  it('rejects "123abc"', () => {
    expect(validatePositiveNumber('123abc')).toBe(null)
  })
  it('rejects "12.3.4"', () => {
    expect(validatePositiveNumber('12.3.4')).toBe(null)
  })
  it('accepts "1.000" (Turkish thousands) as 1000', () => {
    expect(validatePositiveNumber('1.000')).toBe(1000)
  })
  it('accepts "1.000.000" as 1000000', () => {
    expect(validatePositiveNumber('1.000.000')).toBe(1000000)
  })
  it('accepts "1.000,50" as 1000.5', () => {
    expect(validatePositiveNumber('1.000,50')).toBe(1000.5)
  })
})

describe('validateIntInRange', () => {
  it('accepts value in range', () => {
    expect(validateIntInRange('12', 1, 360)).toBe(12)
  })

  it('accepts boundary values (min and max inclusive)', () => {
    expect(validateIntInRange('1', 1, 360)).toBe(1)
    expect(validateIntInRange('360', 1, 360)).toBe(360)
  })

  it('rejects value below min', () => {
    expect(validateIntInRange('0', 1, 360)).toBeNull()
    expect(validateIntInRange('-5', 1, 360)).toBeNull()
  })

  it('rejects value above max', () => {
    expect(validateIntInRange('361', 1, 360)).toBeNull()
    expect(validateIntInRange('9999', 1, 360)).toBeNull()
  })

  it('floors non-integer input before range check', () => {
    expect(validateIntInRange('3.5', 1, 360)).toBe(3)
    expect(validateIntInRange('359.99', 1, 360)).toBe(359)
  })

  it('rejects NaN / non-numeric strings', () => {
    expect(validateIntInRange('abc', 1, 360)).toBeNull()
    expect(validateIntInRange('', 1, 360)).toBeNull()
  })

  it('rejects floor that pushes value out of range', () => {
    // 0.5 floors to 0 which is below min of 1
    expect(validateIntInRange('0.5', 1, 360)).toBeNull()
  })
})
