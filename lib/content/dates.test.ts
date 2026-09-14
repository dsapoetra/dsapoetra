import { describe, expect, it } from 'vitest'
import { isoDate, longDate, meta, shortDate } from './dates'

describe('date formatting', () => {
  it('keeps the ISO form exactly as written', () => {
    expect(isoDate('2026-09-02')).toBe('2026-09-02')
  })

  it('writes prose dates with no leading zero', () => {
    expect(longDate('2026-09-06')).toBe('6 September 2026')
    expect(longDate('2026-01-01')).toBe('1 January 2026')
  })

  it('drops the day for list dates', () => {
    expect(shortDate('2025-11-22')).toBe('Nov 2025')
  })

  /*
   * The bug this guards against: `new Date("2026-01-01")` is UTC midnight, and
   * reading it back with any local-time getter west of Greenwich returns 31
   * December 2025. Formatting must not depend on where the build runs.
   */
  it('does not shift the day across timezones', () => {
    expect(longDate('2026-01-01')).toBe('1 January 2026')
    expect(shortDate('2026-01-01')).toBe('Jan 2026')
    expect(longDate('2026-12-31')).toBe('31 December 2026')
  })
})

describe('meta', () => {
  it('joins with the site separator', () => {
    expect(meta('Sep 2026', '14 min')).toBe('Sep 2026 · 14 min')
  })

  it('drops empty fragments rather than leaving a dangling separator', () => {
    expect(meta('Sep 2026', false, undefined, null)).toBe('Sep 2026')
    expect(meta('Aug 2026', '9 min', 'ID')).toBe('Aug 2026 · 9 min · ID')
  })
})
