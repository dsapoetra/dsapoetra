import { describe, it, expect } from 'vitest'
import { readingTimeMinutes } from '@/lib/content/reading-time'

describe('readingTimeMinutes', () => {
  it('rounds up to at least one minute', () => {
    expect(readingTimeMinutes('satu dua tiga')).toBe(1)
  })

  it('estimates at 200 words per minute', () => {
    const text = Array.from({ length: 400 }, () => 'kata').join(' ')
    expect(readingTimeMinutes(text)).toBe(2)
  })

  it('returns one minute for empty text', () => {
    expect(readingTimeMinutes('')).toBe(1)
  })
})
