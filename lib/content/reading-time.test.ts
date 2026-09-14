import { describe, expect, it } from 'vitest'
import { readingTime } from './reading-time'

describe('readingTime', () => {
  it('rounds up, so a short piece is never zero minutes', () => {
    expect(readingTime('one two three')).toBe(1)
    expect(readingTime('')).toBe(1)
  })

  it('counts at 200 words a minute', () => {
    expect(readingTime(Array(200).fill('word').join(' '))).toBe(1)
    expect(readingTime(Array(201).fill('word').join(' '))).toBe(2)
    expect(readingTime(Array(2800).fill('word').join(' '))).toBe(14)
  })

  it('does not count runs of whitespace as words', () => {
    expect(readingTime('  one \n\n\n  two   \t three  ')).toBe(1)
  })
})
