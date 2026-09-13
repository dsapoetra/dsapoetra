import { describe, it, expect } from 'vitest'
import { newInvoiceNumber, looksLikeInvoiceNumber } from '@/lib/doku/invoice'

describe('newInvoiceNumber', () => {
  it('fits DOKU\'s strictest channel limit of 30 characters', () => {
    expect(newInvoiceNumber().length).toBe(21)
    expect(newInvoiceNumber().length).toBeLessThanOrEqual(30)
  })

  it('contains no symbols — KKI rejects them', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(newInvoiceNumber()).toMatch(/^[A-Z0-9]+$/)
    }
  })

  it('carries the order date, so it is legible in the DOKU Back Office', () => {
    expect(newInvoiceNumber(new Date('2026-08-31T10:00:00Z'))).toMatch(/^INV20260831/)
  })

  it('is unique across a burst on the same day', () => {
    const now = new Date('2026-08-31T10:00:00Z')
    const seen = new Set(Array.from({ length: 2000 }, () => newInvoiceNumber(now)))
    expect(seen.size).toBe(2000)
  })

  it('avoids the letters that misread when typed by hand', () => {
    const tails = Array.from({ length: 200 }, () => newInvoiceNumber().slice(11))
    expect(tails.join('')).not.toMatch(/[ILOU]/)
  })

  it('draws uniformly from the alphabet rather than biasing the first symbols', () => {
    // A naive `byte % 32` would over-represent the first 8 letters, because 256
    // is not a multiple of 32. Masking to 5 bits is what keeps this even.
    const counts = new Map<string, number>()
    for (let i = 0; i < 4000; i += 1) {
      for (const char of newInvoiceNumber().slice(11)) {
        counts.set(char, (counts.get(char) ?? 0) + 1)
      }
    }
    const frequencies = [...counts.values()]
    expect(counts.size).toBe(32)
    // 40,000 draws over 32 symbols ≈ 1250 each; a modulo bias would put the
    // first eight at roughly double the rest, far outside this band.
    expect(Math.max(...frequencies) / Math.min(...frequencies)).toBeLessThan(1.5)
  })
})

describe('looksLikeInvoiceNumber', () => {
  it('accepts what the generator produces', () => {
    expect(looksLikeInvoiceNumber(newInvoiceNumber())).toBe(true)
  })

  it('rejects anything else', () => {
    expect(looksLikeInvoiceNumber('INV-20210231-0001')).toBe(false)
    expect(looksLikeInvoiceNumber('')).toBe(false)
    expect(looksLikeInvoiceNumber('INV20260831ILOU123456')).toBe(false)
  })
})
