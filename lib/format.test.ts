import { describe, it, expect } from 'vitest'
import { formatDateId, formatDateShortId, yearOf, formatIDR } from '@/lib/format'

describe('formatDateId', () => {
  it('renders an ISO date as Indonesian prose', () => {
    expect(formatDateId('2026-08-30')).toBe('30 Agustus 2026')
  })

  it('drops the leading zero on the day but keeps the month name intact', () => {
    expect(formatDateId('2026-01-05')).toBe('5 Januari 2026')
  })

  it('is timezone-independent — the date the author wrote is the date shown', () => {
    // The trap this guards: `new Date('2026-01-01')` is UTC midnight, which in
    // Jakarta (UTC+7) is still 1 January but in New York (UTC-5) is 31 December.
    const original = process.env.TZ
    try {
      process.env.TZ = 'America/New_York'
      expect(formatDateId('2026-01-01')).toBe('1 Januari 2026')
      process.env.TZ = 'Asia/Jakarta'
      expect(formatDateId('2026-01-01')).toBe('1 Januari 2026')
    } finally {
      process.env.TZ = original
    }
  })

  it('returns anything that is not YYYY-MM-DD untouched', () => {
    expect(formatDateId('kemarin')).toBe('kemarin')
    expect(formatDateId('2026-13-01')).toBe('2026-13-01')
  })
})

describe('formatDateShortId', () => {
  it('renders the compact dotted form with zeroes kept', () => {
    expect(formatDateShortId('2026-08-30')).toBe('30.08.2026')
    expect(formatDateShortId('2026-01-05')).toBe('05.01.2026')
  })

  it('returns a malformed value untouched', () => {
    expect(formatDateShortId('besok')).toBe('besok')
  })
})

describe('yearOf', () => {
  it('takes the year off an ISO date', () => {
    expect(yearOf('2026-08-30')).toBe('2026')
  })
})

describe('formatIDR', () => {
  it('groups thousands with a dot', () => {
    expect(formatIDR(49000)).toBe('Rp 49.000')
    expect(formatIDR(199000)).toBe('Rp 199.000')
    expect(formatIDR(1250000)).toBe('Rp 1.250.000')
  })

  it('leaves values below a thousand ungrouped', () => {
    expect(formatIDR(0)).toBe('Rp 0')
    expect(formatIDR(999)).toBe('Rp 999')
  })

  it('rounds to whole rupiah rather than showing a sub-unit', () => {
    expect(formatIDR(49000.4)).toBe('Rp 49.000')
    expect(formatIDR(49999.6)).toBe('Rp 50.000')
  })

  it('keeps the sign outside the currency prefix', () => {
    expect(formatIDR(-49000)).toBe('-Rp 49.000')
  })
})
