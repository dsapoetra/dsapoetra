'use client'

import Link from 'next/link'
import { basketCount } from '@/lib/products/types'
import { useBasket } from '@/components/basket'

/**
 * The basket entry in the nav. The count is rendered only once the stored
 * basket has been read on the client — before that it shows a dash, which
 * occupies the same space as a digit so the nav does not shift when it arrives.
 *
 * Takes the catalogue's slugs, not its products: this renders on every page, so
 * shipping short strings instead of every blurb keeps the payload small — and
 * it still lets a product deleted from `content/produk/` drop out of the count.
 */
export default function BasketLink({ slugs }: { slugs: string[] }) {
  const { quantities, ready } = useBasket()
  const count = basketCount(slugs, quantities)

  return (
    <Link
      href="/keranjang"
      className="flex items-center gap-2 rounded-sm border border-rule px-3.5 py-1.5 text-ink transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2 3h3l2.6 12.1a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
      </svg>
      <span>Keranjang</span>
      <span className="font-mono text-xs text-muted" aria-hidden="true">
        {ready ? count : '–'}
      </span>
      <span className="sr-only">
        {ready ? `${count} barang di keranjang` : 'memuat isi keranjang'}
      </span>
    </Link>
  )
}
