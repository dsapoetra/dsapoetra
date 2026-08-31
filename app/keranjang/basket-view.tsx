'use client'

import Link from 'next/link'
import { basketLines, basketTotal, type Product } from '@/lib/products/types'
import { formatIDR } from '@/lib/format'
import { site } from '@/lib/site'
import { useBasket } from '@/components/basket'

export default function BasketView({ products }: { products: Product[] }) {
  const { quantities, ready, setQuantity, remove, clear } = useBasket()
  const lines = basketLines(products, quantities)
  const total = basketTotal(products, quantities)

  // The basket only exists in the visitor's browser, so on the server — and on
  // the very first client render — there is nothing to show yet. Saying so
  // beats flashing "keranjang kosong" at someone who has three things in it.
  if (!ready) {
    return <p className="mt-8 text-muted">Membuka keranjang…</p>
  }

  if (lines.length === 0) {
    return (
      <div className="mt-8">
        <p className="text-lg leading-8">Keranjang masih kosong.</p>
        <Link
          href="/toko"
          className="mt-6 inline-block rounded-sm border border-rule px-5 py-3 font-sans text-sm transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
        >
          Lihat toko
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <ul className="border-t border-rule">
        {lines.map(({ product, quantity, subtotal }) => (
          <li
            key={product.slug}
            className="flex flex-wrap items-baseline gap-x-6 gap-y-3 border-b border-rule py-5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
                {product.kind}
              </p>
              <h2 className="mt-1 text-xl leading-snug">{product.title}</h2>
              <p className="mt-1 font-mono text-sm text-muted">
                {formatIDR(product.price)} per barang
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor={`jumlah-${product.slug}`}
                className="font-sans text-sm text-muted"
              >
                Jumlah
              </label>
              <input
                id={`jumlah-${product.slug}`}
                type="number"
                min={1}
                max={99}
                inputMode="numeric"
                value={quantity}
                onChange={(event) =>
                  setQuantity(product.slug, Number(event.target.value))
                }
                className="w-16 rounded-sm border border-rule bg-card px-2 py-1.5 text-center font-mono text-sm"
              />
            </div>

            <span className="w-28 shrink-0 text-right font-mono">
              {formatIDR(subtotal)}
            </span>

            <button
              type="button"
              onClick={() => remove(product.slug)}
              aria-label={`Hapus ${product.title} dari keranjang`}
              className="font-sans text-sm text-muted transition-colors hover:text-accent focus-visible:text-accent"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-4">
        <button
          type="button"
          onClick={clear}
          className="font-sans text-sm text-muted transition-colors hover:text-accent focus-visible:text-accent"
        >
          Kosongkan keranjang
        </button>
        <p className="text-xl">
          Total <span className="ml-3 font-mono">{formatIDR(total)}</span>
        </p>
      </div>

      {site.checkoutUrl ? (
        <a
          href={site.checkoutUrl}
          className="mt-8 inline-block rounded-sm bg-ink px-6 py-3 font-sans text-sm text-paper transition-opacity hover:opacity-85"
        >
          Lanjut ke pembayaran
        </a>
      ) : (
        /*
          No payment provider is wired up yet. Rather than show a button that
          goes nowhere, the basket says so plainly — see `site.checkoutUrl`.
        */
        <p className="mt-8 rounded-sm border border-rule bg-card p-5 leading-relaxed text-muted">
          Pembayaran belum tersambung. Isi <code className="font-mono">checkoutUrl</code>{' '}
          di <code className="font-mono">lib/site.ts</code> untuk mengarahkan
          keranjang ke halaman pembayaran.
        </p>
      )}
    </div>
  )
}
