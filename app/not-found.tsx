import Link from 'next/link'
import SectionLabel from '@/components/section-label'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <SectionLabel>404</SectionLabel>

      <p className="mt-8 text-lg leading-8 text-muted">
        Halaman yang Anda cari tidak ditemukan.
      </p>

      <Link
        href="/"
        className="mt-8 inline-block text-accent underline-offset-4 hover:underline focus-visible:underline"
      >
        Kembali ke beranda
      </Link>
    </div>
  )
}
