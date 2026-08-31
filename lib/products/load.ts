import { cache } from 'react'
import { z } from 'zod'
import { readCollection, type Entry } from '@/lib/content/load'
import type { Product } from '@/lib/products/types'

/**
 * Frontmatter for one file in `content/produk/`.
 *
 * The blurb is the file's BODY, not a frontmatter field — a product's
 * description is prose, and prose belongs below the `---` where it is
 * comfortable to write and to edit.
 */
const productSchema = z.object({
  title: z.string('title wajib diisi').trim().min(1, 'title wajib diisi'),
  kind: z.string('kind wajib diisi').trim().min(1, 'kind wajib diisi'),
  /*
   * Whole rupiah. The trap this guards is `price: 49.000` — YAML reads that as
   * the float 49, which IS an integer to JavaScript, so it would sail through
   * as a price of Rp 49 and nobody would notice until someone bought it. Any
   * non-zero price below a thousand is almost certainly that mistake, so it is
   * rejected with the message that names it.
   */
  price: z
    .number('price harus berupa angka')
    .int('price harus bilangan bulat')
    .min(0, 'price tidak boleh negatif')
    .refine(
      (value) => value === 0 || value >= 1000,
      'price ditulis dalam rupiah penuh tanpa titik — mis. 49000, bukan 49.000'
    ),
  cover: z.object(
    {
      tone: z.enum(['ink', 'accent', 'highlight'], {
        message: 'cover.tone harus ink, accent, atau highlight',
      }),
      // Trimmed: a YAML block scalar (`caption: |`) keeps its trailing
      // newline, which would render as a blank line inside the cover.
      caption: z
        .string('cover.caption wajib diisi')
        .trim()
        .min(1, 'cover.caption wajib diisi'),
    },
    'cover wajib diisi'
  ),
  /**
   * Shelf position. Optional — a file without one sorts after everything that
   * has one, so adding a product does not force renumbering the rest.
   */
  order: z.number().int().optional(),
  buyUrl: z.url('buyUrl harus berupa URL lengkap').optional(),
})

type ProductFrontmatter = z.infer<typeof productSchema>

/**
 * Shelf order: `order` ascending, then slug, so the sequence is stable and does
 * not depend on how the filesystem happens to hand back directory entries.
 */
function byShelfOrder(
  a: Entry<ProductFrontmatter>,
  b: Entry<ProductFrontmatter>
): number {
  const left = a.order ?? Number.MAX_SAFE_INTEGER
  const right = b.order ?? Number.MAX_SAFE_INTEGER
  if (left !== right) return left - right
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
}

export const loadProducts = cache(async function loadProducts(): Promise<
  Product[]
> {
  const entries = await readCollection('produk', productSchema, byShelfOrder)

  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    kind: entry.kind,
    price: entry.price,
    cover: entry.cover,
    order: entry.order ?? Number.MAX_SAFE_INTEGER,
    ...(entry.buyUrl ? { buyUrl: entry.buyUrl } : {}),
    // Collapsed to a single line: the card and the basket both render it as
    // plain text, so a wrapped paragraph in the file must not become a wrapped
    // paragraph in the markup.
    blurb: entry.body.replace(/\s+/g, ' ').trim(),
  }))
})

/**
 * Whether the shop is worth showing at all.
 *
 * Every shop surface keys off this one check — the homepage section, the nav
 * entry, the footer link, the sitemap row, and `/toko` and `/keranjang`
 * themselves — so emptying `content/produk/` removes all of them together
 * rather than leaving a link to an empty shelf.
 */
export async function hasShop(): Promise<boolean> {
  return (await loadProducts()).length > 0
}

/** Just the slugs, for the nav badge — see `basketCount`. */
export async function loadProductSlugs(): Promise<string[]> {
  return (await loadProducts()).map((product) => product.slug)
}
