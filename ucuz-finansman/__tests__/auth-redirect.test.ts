import { describe, it, expect } from 'vitest'

// Pure helper: extract this logic into a new exported function in AuthClient OR create
// a new helper file at lib/auth-redirect.ts with a function resolveRedirect(raw: string | null): string
// that returns:
// - a valid relative path (starts with /, not //) → the path itself
// - else → '/hesaplamarim'

import { resolveRedirect } from '../lib/auth-redirect'

describe('resolveRedirect', () => {
  it('valid internal path returned as-is', () => {
    expect(resolveRedirect('/admin')).toBe('/admin')
  })
  it('null returns default', () => {
    expect(resolveRedirect(null)).toBe('/hesaplamarim')
  })
  it('external URL rejected', () => {
    expect(resolveRedirect('https://evil.com')).toBe('/hesaplamarim')
  })
  it('protocol-relative rejected', () => {
    expect(resolveRedirect('//evil.com/path')).toBe('/hesaplamarim')
  })
  it('non-prefix path rejected', () => {
    expect(resolveRedirect('admin')).toBe('/hesaplamarim')
  })
})
