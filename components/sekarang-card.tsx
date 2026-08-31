import Link from 'next/link'
import SectionLabel from '@/components/section-label'
import { formatDateId } from '@/lib/format'
import { loadSekarang, summarizeSekarang } from '@/lib/content/sekarang'

/**
 * The homepage's condensed view of `/sekarang`. Renders nothing when the
 * content file is missing or has no headings to summarize — an empty card
 * would say less than no card.
 */
export default async function SekarangCard({ className }: { className?: string }) {
  const sekarang = await loadSekarang()
  if (!sekarang) return null

  const lines = summarizeSekarang(sekarang.body)
  if (lines.length === 0) return null

  return (
    <section className={`rounded-sm border border-rule bg-card p-5${className ? ` ${className}` : ''}`}>
      <SectionLabel as="h2">Sekarang</SectionLabel>

      <dl className="mt-3 space-y-1.5 leading-relaxed">
        {lines.map((line) => (
          <div key={line.label} className="flex gap-2">
            <dt className="shrink-0">{line.label}:</dt>
            <dd className={line.pending ? 'text-muted' : undefined}>{line.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 font-mono text-[11px] text-muted">
        <time dateTime={sekarang.updated}>{formatDateId(sekarang.updated)}</time>
        {' · '}
        <Link
          href="/sekarang"
          className="transition-colors hover:text-accent focus-visible:text-accent"
        >
          selengkapnya
        </Link>
      </p>
    </section>
  )
}
