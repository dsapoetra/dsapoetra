import { describe, expect, it } from 'vitest'
import { longDate } from './dates'

describe('date formatting', () => {
  it('writes prose dates with no leading zero', () => {
    expect(longDate('2026-09-06')).toBe('6 September 2026')
    expect(longDate('2026-01-01')).toBe('1 January 2026')
  })

  /*
   * The bug this guards against: `new Date("2026-01-01")` is UTC midnight, and
   * reading it back with any local-time getter west of Greenwich returns 31
   * December 2025. Formatting must not depend on where the build runs.
   */
  it('does not shift the day across timezones', () => {
    expect(longDate('2026-01-01')).toBe('1 January 2026')
    expect(longDate('2026-12-31')).toBe('31 December 2026')
  })
})
