import Link from 'next/link'
import type { Metadata } from 'next'
import SectionLabel from '@/components/section-label'
import ClearBasket from './clear-basket'

export const metadata: Metadata = {
  title: 'Pesanan diterima — dsapoetra',
  // A confirmation page carrying somebody's order reference has no business
  // in a search index.
  robots: { index: false, follow: false },
}

/**
 * Where DOKU sends the buyer back to.
 *
 * This page is NOT proof of payment — anyone can open it with any `inv` in the
 * URL. The real record is the notification DOKU signs and posts to
 * `/api/doku/notification`, and the DOKU Back Office. So the wording here is
 * careful: the order was placed, and confirmation follows once payment is seen.
 */
export default async function SelesaiPage({
  searchParams,
}: PageProps<'/toko/selesai'>) {
  const params = await searchParams
  const raw = params.inv
  const invoice = typeof raw === 'string' ? raw : undefined

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <SectionLabel>Terima kasih</SectionLabel>
      <ClearBasket />

      <p className="mt-8 text-lg leading-8">
        Pesanan kamu sudah masuk. Begitu pembayaran diterima, tautan unduhannya
        saya kirim ke email yang kamu isi tadi.
      </p>

      {invoice ? (
        <p className="mt-6 leading-relaxed text-muted">
          Nomor pesanan{' '}
          {/*
            Rendered as text, never as a link or as HTML: it arrives from the
            query string, so it is a stranger's input on our own page.
          */}
          <span className="font-mono text-ink">{invoice}</span>. Simpan nomor ini
          kalau perlu menanyakan pesanan.
        </p>
      ) : null}

      <p className="mt-6 leading-relaxed text-muted">
        Belum sampai dalam 1×24 jam? Balas ke email saya dengan nomor pesanan di
        atas dan saya cek.
      </p>

      <div className="mt-10 flex flex-wrap gap-3 font-sans text-sm">
        <Link
          href="/toko"
          className="rounded-sm border border-rule px-5 py-3 transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
        >
          Kembali ke toko
        </Link>
        <Link
          href="/"
          className="rounded-sm border border-rule px-5 py-3 transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
        >
          Beranda
        </Link>
      </div>
    </div>
  )
}
