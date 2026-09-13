'use client'

import Link from 'next/link'
import { useState } from 'react'
import { basketLines, basketTotal, type Product } from '@/lib/products/types'
import { formatIDR } from '@/lib/format'
import { useBasket } from '@/components/basket'

export default function BasketView({
  products,
  paymentReady,
}: {
  products: Product[]
  /**
   * Whether DOKU credentials are configured on the server. Computed there and
   * passed down, because the client must never see the credentials themselves —
   * only whether they exist.
   */
  paymentReady: boolean
}) {
  const { quantities, ready, setQuantity, remove, clear } = useBasket()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function checkout(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/doku/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Slugs and quantities only. Prices are read from content/produk/ on
        // the server — nothing here is trusted to say what anything costs.
        body: JSON.stringify({ items: quantities, email, name: name || undefined }),
      })

      const data: { paymentUrl?: string; error?: string } = await response.json()

      if (!response.ok || !data.paymentUrl) {
        setError(data.error ?? 'Gagal membuka halaman pembayaran.')
        setSubmitting(false)
        return
      }

      // Leaving the site for DOKU's hosted page. `submitting` is deliberately
      // left true: the button stays disabled through the navigation so a second
      // click cannot open a second payment page.
      window.location.href = data.paymentUrl
    } catch {
      setError('Tidak bisa menghubungi server. Periksa koneksi kamu.')
      setSubmitting(false)
    }
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

      {paymentReady ? (
        <form onSubmit={checkout} className="mt-10 border-t border-rule pt-8">
          <h2 className="text-2xl font-medium">Ke pembayaran</h2>
          <p className="mt-3 max-w-prose-measure leading-relaxed text-muted">
            Tautan unduhan dikirim ke email ini setelah pembayaran diterima, jadi
            pastikan alamatnya benar.
          </p>

          <div className="mt-6 flex flex-col gap-4 sm:max-w-md">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="font-sans text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@contoh.com"
                className="rounded-sm border border-rule bg-card px-4 py-2.5 font-sans text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="nama" className="font-sans text-sm">
                Nama <span className="text-muted">(opsional)</span>
              </label>
              <input
                id="nama"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-sm border border-rule bg-card px-4 py-2.5 font-sans text-base"
              />
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-6 rounded-sm border border-accent bg-card p-4 leading-relaxed text-accent"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-8 rounded-sm bg-ink px-6 py-3 font-sans text-sm text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {submitting ? 'Membuka pembayaran…' : `Bayar ${formatIDR(total)}`}
          </button>

          <p className="mt-4 font-mono text-[11px] text-muted">
            Pembayaran diproses oleh DOKU.
          </p>
        </form>
      ) : (
        /*
          No DOKU credentials on the server. The basket still works; it just
          says so plainly rather than showing a button that goes nowhere.
        */
        <p className="mt-8 rounded-sm border border-rule bg-card p-5 leading-relaxed text-muted">
          Pembayaran belum tersambung. Isi <code className="font-mono">DOKU_CLIENT_ID</code>{' '}
          dan <code className="font-mono">DOKU_SECRET_KEY</code> di environment
          untuk mengaktifkan checkout.
        </p>
      )}
    </div>
  )
}
