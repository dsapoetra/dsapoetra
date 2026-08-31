import { describe, it, expect } from 'vitest'
import {
  findProduct,
  sanitizeQuantities,
  basketLines,
  basketTotal,
  basketCount,
  MAX_QUANTITY,
  type Product,
} from '@/lib/products/types'

function product(slug: string, price: number, order: number): Product {
  return {
    slug,
    title: slug,
    kind: 'E-book',
    blurb: 'Uji.',
    price,
    cover: { tone: 'ink', caption: 'Uji' },
    order,
  }
}

// Deliberately NOT in shelf order, so tests can tell the difference between
// "shelf order" and "the order the array happened to be in".
const A = product('a', 49000, 1)
const B = product('b', 79000, 2)
const CATALOGUE = [A, B]

describe('findProduct', () => {
  it('finds a product by slug', () => {
    expect(findProduct(CATALOGUE, 'b')).toBe(B)
  })

  it('returns undefined for a slug that is not in the catalogue', () => {
    expect(findProduct(CATALOGUE, 'tidak-ada')).toBeUndefined()
  })
})

describe('sanitizeQuantities', () => {
  const slugs = ['a', 'b']

  it('keeps known slugs with positive quantities', () => {
    expect(sanitizeQuantities(slugs, { a: 2, b: 1 })).toEqual({ a: 2, b: 1 })
  })

  it('drops a product deleted from content/produk since the last visit', () => {
    expect(sanitizeQuantities(slugs, { a: 1, 'produk-lama': 3 })).toEqual({ a: 1 })
  })

  it('drops non-positive, fractional-to-zero and non-finite quantities', () => {
    expect(
      sanitizeQuantities(slugs, { a: 0, b: -2 })
    ).toEqual({})
    expect(sanitizeQuantities(slugs, { a: Number.NaN })).toEqual({})
    expect(sanitizeQuantities(slugs, { a: 'dua' })).toEqual({})
  })

  it('floors a fractional quantity', () => {
    expect(sanitizeQuantities(slugs, { a: 2.9 })).toEqual({ a: 2 })
  })

  it('clamps an absurd stored quantity', () => {
    expect(sanitizeQuantities(slugs, { a: 100000 })).toEqual({ a: MAX_QUANTITY })
  })
})

describe('basketLines', () => {
  it('returns lines in shelf order, not the order they were added', () => {
    const lines = basketLines(CATALOGUE, { b: 1, a: 1 })
    expect(lines.map((line) => line.product.slug)).toEqual(['a', 'b'])
  })

  it('carries quantity and subtotal per line', () => {
    const [line] = basketLines(CATALOGUE, { a: 3 })
    expect(line.quantity).toBe(3)
    expect(line.subtotal).toBe(A.price * 3)
  })

  it('skips unknown and empty lines', () => {
    expect(basketLines(CATALOGUE, { 'produk-lama': 2, a: 0 })).toEqual([])
  })
})

describe('basketTotal', () => {
  it('is zero for an empty basket', () => {
    expect(basketTotal(CATALOGUE, {})).toBe(0)
  })

  it('sums price by quantity across lines', () => {
    expect(basketTotal(CATALOGUE, { a: 2, b: 1 })).toBe(A.price * 2 + B.price)
  })

  it('ignores a slug that is no longer in the catalogue', () => {
    expect(basketTotal(CATALOGUE, { a: 1, 'produk-lama': 3 })).toBe(A.price)
  })

  it('floors a fractional quantity rather than charging a fraction', () => {
    expect(basketTotal(CATALOGUE, { a: 2.7 })).toBe(A.price * 2)
  })
})

describe('basketCount', () => {
  it('counts items, not lines', () => {
    expect(basketCount(['a', 'b'], { a: 2, b: 1 })).toBe(3)
  })

  it('ignores a slug that is no longer sold, so the badge cannot lie', () => {
    expect(basketCount(['a'], { a: 1, 'produk-lama': 5 })).toBe(1)
  })

  it('is zero for an empty basket', () => {
    expect(basketCount(['a'], {})).toBe(0)
  })
})
