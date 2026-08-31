import Link from 'next/link'
import type { Metadata } from 'next'
import { loadLatest, groupByYear } from '@/lib/content/latest'
import SectionLabel from '@/components/section-label'
import SectionHeading from '@/components/section-heading'
import StreamList from '@/components/stream-list'

export const metadata: Metadata = {
  title: 'Tulisan — dsapoetra',
  description: 'Semua puisi, cerita pendek, dan ulasan buku, per tahun.',
}

const COLLECTIONS = [
  { href: '/puisi', label: 'Puisi' },
  { href: '/cerita', label: 'Cerita' },
  { href: '/ulasan', label: 'Ulasan' },
]

export default async function TulisanPage() {
  const items = await loadLatest()
  const years = groupByYear(items)

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <SectionLabel>Tulisan</SectionLabel>

      <p className="mt-6 max-w-prose-measure text-lg leading-8">
        Semuanya di satu tempat, terbaru dulu. {items.length} tulisan.
      </p>

      {/*
        The per-kind indexes are the reason the nav can carry one "Tulisan"
        entry instead of three — they have to be reachable from here.
      */}
      <nav
        aria-label="Per jenis tulisan"
        className="mt-6 flex flex-wrap gap-3 font-sans text-sm"
      >
        {COLLECTIONS.map((collection) => (
          <Link
            key={collection.href}
            href={collection.href}
            className="rounded-sm border border-rule px-4 py-2 transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
          >
            {collection.label}
          </Link>
        ))}
      </nav>

      {years.length === 0 ? (
        <p className="mt-12 text-muted">Belum ada tulisan.</p>
      ) : (
        years.map((group) => (
          <section key={group.year} className="mt-12">
            <SectionHeading>{group.year}</SectionHeading>
            <StreamList items={group.items} className="mt-2" />
          </section>
        ))
      )}
    </div>
  )
}
