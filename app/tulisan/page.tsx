import type { Metadata } from 'next'
import Link from 'next/link'
import { loadLatest, groupByYear, labelFor, type StreamItem } from '@/lib/content/latest'
import { loadSheet } from '@/lib/content/sheet'
import { hasShop } from '@/lib/products/load'
import { sheetNumber } from '@/lib/site'
import { formatDateId } from '@/lib/format'
import SheetFrame from '@/components/sheet-frame'
import SheetCard from '@/components/sheet-card'
import TitleBlock from '@/components/title-block'
import StreamList from '@/components/stream-list'

/**
 * Sheet 3 — Tulisan.
 *
 * Two columns of recent work over the full archive. The columns are what the
 * drawing shows; the archive under them is what the site actually has, and it
 * grows past the point where two columns of boxes would still be readable.
 *
 * Every word on this sheet outside the listings comes from `content/tulisan.mdx`
 * — headline, intro, title block. See `content/README.md`.
 */
const SHEET = 'tulisan'

/** How many boxes a column shows before the archive takes over. */
const PER_COLUMN = 3

const COLLECTIONS = [
  { href: '/puisi', label: 'Puisi' },
  { href: '/cerita', label: 'Cerita' },
  { href: '/ulasan', label: 'Ulasan' },
]

const FALLBACK = {
  title: 'Tulisan',
  intro: 'Semua puisi, cerita pendek, dan ulasan buku.',
} as const

export async function generateMetadata(): Promise<Metadata> {
  const sheet = await loadSheet(SHEET)

  return {
    title: sheet?.metaTitle ?? `${sheet?.title ?? FALLBACK.title} — dsapoetra`,
    description: sheet?.description ?? FALLBACK.intro,
  }
}

export default async function TulisanPage() {
  const [items, sheet, shop] = await Promise.all([
    loadLatest(),
    loadSheet(SHEET),
    hasShop(),
  ])

  const reviews = items.filter((item) => item.kind === 'ulasan')
  const writing = items.filter((item) => item.kind !== 'ulasan')
  const years = groupByYear(items)
  const number = sheetNumber('/tulisan', shop)

  return (
    <div className="mx-auto w-full max-w-[1160px] px-6 pt-8 pb-20 sm:px-8">
      <SheetFrame>
        <header className="border-b border-dashed border-rule px-6 pt-14 pb-10 sm:px-12">
          <p className="drafting-label mb-5">
            {/*
              The label names the SHEET; the headline below is the sheet's
              copy. They are different strings on purpose — `Lembar 3 — Tulisan`
              over `Puisi, cerita, catatan bacaan.` — so the label comes from
              the register and never from the Markdown file.
            */}
            {number ? `Lembar ${number.number} — ` : ''}
            {number?.title ?? FALLBACK.title}
          </p>
          <h1 className="m-0 mb-4 max-w-[720px] text-[clamp(34px,4.5vw,54px)] leading-[1.05] font-bold tracking-tight text-pretty">
            {sheet?.title ?? FALLBACK.title}
            {sheet?.titleAccent ? (
              <> <span className="text-muted">{sheet.titleAccent}</span></>
            ) : null}
          </h1>
          <p className="text-ink-soft m-0 max-w-[600px] text-pretty">
            {sheet?.intro || FALLBACK.intro}
          </p>

          {/*
            The per-kind indexes are the reason the nav can carry one "Tulisan"
            entry instead of three — they have to be reachable from here.
          */}
          <nav
            aria-label="Per jenis tulisan"
            className="mt-8 flex flex-wrap gap-3 font-mono text-xs tracking-[0.06em]"
          >
            {COLLECTIONS.map((collection) => (
              <Link
                key={collection.href}
                href={collection.href}
                className="border border-muted px-4 py-2 uppercase transition-colors hover:border-ink hover:text-ink"
              >
                {collection.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-12 px-6 py-12 sm:px-12">
          <Column
            label="§1 Ulasan buku"
            prefix="R"
            items={reviews.slice(0, PER_COLUMN)}
            empty="Ulasan pertama akan muncul di sini."
          />
          <Column
            label="§2 Cerita & puisi"
            prefix="S"
            items={writing.slice(0, PER_COLUMN)}
            empty="Cerita dan puisi akan muncul di sini."
          />
        </div>

        {years.length > 0 ? (
          <section className="border-t border-dashed border-rule px-6 py-12 sm:px-12">
            <h2 className="drafting-label mb-6">
              §3 Arsip — {items.length} tulisan
            </h2>
            {years.map((group) => (
              <div key={group.year} className="mt-8 first:mt-0">
                <h3 className="border-b border-muted pb-2 font-mono text-xs tracking-[0.1em] text-muted">
                  {group.year}
                </h3>
                <StreamList items={group.items} className="mt-1" />
              </div>
            ))}
          </section>
        ) : null}

        <TitleBlock
          fields={[
            ...(sheet?.titleBlock ?? []),
            ...(number
              ? [{ label: 'Lembar', value: `${number.number} / ${number.total}` }]
              : []),
          ]}
        />
      </SheetFrame>
    </div>
  )
}

function Column({
  label,
  prefix,
  items,
  empty,
}: {
  label: string
  /** Item-number prefix: `R` for reviews, `S` for stories and poems. */
  prefix: string
  items: StreamItem[]
  /** Blurb for the dashed box shown when the column has nothing in it. */
  empty: string
}) {
  return (
    <section>
      <h2 className="drafting-label mb-5">{label}</h2>
      <div className="flex flex-col gap-4">
        {items.length === 0 ? (
          <SheetCard
            code={`${prefix}-01`}
            meta="Segera"
            title="Belum ada"
            variant="pending"
          >
            {empty}
          </SheetCard>
        ) : (
          items.map((item, index) => (
            <SheetCard
              key={item.href}
              code={`${prefix}-${String(index + 1).padStart(2, '0')}`}
              meta={<ItemMeta item={item} latest={index === 0} />}
              title={item.title}
              href={item.href}
              variant={index === 0 ? 'featured' : 'plain'}
            >
              {item.blurb}
            </SheetCard>
          ))
        )}
      </div>
    </section>
  )
}

/**
 * The mono line under an item's number.
 *
 * A poem shows its kind and nothing else. Its date exists only to order the
 * list — printing it would make a poem look stale for having been written in
 * March, which is the one thing a poem should never look.
 */
function ItemMeta({ item, latest }: { item: StreamItem; latest: boolean }) {
  return (
    <>
      {labelFor(item.kind)}
      {item.kind === 'puisi' ? null : (
        <> · <time dateTime={item.date}>{formatDateId(item.date)}</time></>
      )}
      {latest ? ' · Terbaru' : null}
    </>
  )
}
