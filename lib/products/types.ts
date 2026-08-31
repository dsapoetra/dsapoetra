/**
 * Shop types and basket arithmetic.
 *
 * NOTHING IN THIS FILE MAY TOUCH THE FILESYSTEM. The basket runs in the
 * browser, so it imports from here; `lib/products/load.ts` is the half that
 * reads `content/produk/` and only ever runs on the server. Every function
 * below therefore takes the catalogue as an argument rather than reaching for
 * it, which also makes them trivially testable.
 */

/**
 * Cover treatment. There is no product photography, so a cover is a flat block
 * of one of the site's cover colours with a caption laid over it — honest
 * (nothing is mocked up as a photo that does not exist) and free of image
 * weight. See the cover palette note in `app/globals.css`.
 */
export type ProductTone = 'ink' | 'accent' | 'highlight'

export type Product = {
  /** URL segment, taken from the filename. Unique, lowercase, hyphenated. */
  slug: string
  title: string
  /** Kind line above the title, e.g. `E-book · PDF + EPUB`. */
  kind: string
  /** One or two sentences — the body of the `.mdx` file. */
  blurb: string
  /** Whole rupiah. Formatted for display by `formatIDR`. */
  price: number
  cover: { tone: ProductTone; caption: string }
  /** Shelf position. Lower comes first; ties fall back to the slug. */
  order: number
  /**
   * This product's own checkout page, if it has one.
   *
   * When set, "Beli" links straight there and the product never enters the
   * basket. When absent, the product goes in the basket and checkout is
   * `site.checkoutUrl`.
   */
  buyUrl?: string
}

/** A basket, as stored: `{ slug: quantity }`. */
export type Quantities = Record<string, number>

/** Most anyone can want of one digital thing. Also the storage clamp. */
export const MAX_QUANTITY = 99

export function findProduct(
  products: Product[],
  slug: string
): Product | undefined {
  return products.find((product) => product.slug === slug)
}

/**
 * Normalizes a basket read from browser storage against the slugs that
 * currently exist.
 *
 * Unknown slugs are dropped rather than thrown on: the basket is restored from
 * the visitor's own browser, and a product deleted from `content/produk/` since
 * their last visit must not break the page. Non-positive, fractional and
 * non-finite quantities go the same way.
 */
export function sanitizeQuantities(
  slugs: string[],
  raw: Record<string, unknown>
): Quantities {
  const known = new Set(slugs)
  const quantities: Quantities = {}

  for (const [slug, value] of Object.entries(raw)) {
    if (!known.has(slug)) continue
    const quantity = Math.floor(Number(value))
    if (Number.isFinite(quantity) && quantity > 0) {
      quantities[slug] = Math.min(quantity, MAX_QUANTITY)
    }
  }

  return quantities
}

/** The basket's line items, in shelf order, skipping anything unknown. */
export function basketLines(
  products: Product[],
  quantities: Quantities
): Array<{ product: Product; quantity: number; subtotal: number }> {
  return products
    .filter((product) => {
      const quantity = quantities[product.slug]
      return Number.isFinite(quantity) && quantity > 0
    })
    .map((product) => {
      const quantity = Math.floor(quantities[product.slug])
      return { product, quantity, subtotal: product.price * quantity }
    })
}

export function basketTotal(products: Product[], quantities: Quantities): number {
  return basketLines(products, quantities).reduce(
    (total, line) => total + line.subtotal,
    0
  )
}

/**
 * Total number of items, for the badge in the nav.
 *
 * Takes slugs rather than whole products on purpose: the badge is rendered on
 * every page, and this way the nav ships a list of short strings to the browser
 * instead of the entire catalogue with its blurbs.
 */
export function basketCount(slugs: string[], quantities: Quantities): number {
  const known = new Set(slugs)
  let count = 0

  for (const [slug, quantity] of Object.entries(quantities)) {
    if (!known.has(slug)) continue
    if (Number.isFinite(quantity) && quantity > 0) count += Math.floor(quantity)
  }

  return count
}
