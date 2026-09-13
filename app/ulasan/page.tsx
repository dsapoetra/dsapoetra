import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { loadReviews } from '@/lib/content/load'
import { loadRak, toSpineBook } from '@/lib/content/rak'
import { hasShop } from '@/lib/products/load'
import { sheetNumber } from '@/lib/site'
import SectionLabel from '@/components/section-label'
import RakShelf from '@/components/rak-shelf'

/**
 * Ulasan — the shelf.
 *
 * `/ulasan` is a detail of the Tulisan sheet, not a sheet of its own, so it
 * carries no drawing number and no title block. What it carries is the reading
 * log: `content/rak.md`, drawn as piles of books.
 *
 * Delete that file and the page falls back to the plain list of written
 * reviews it used to be — same rule as the shop and the novel strip. A thing
 * that is not there is absent, not empty.
 */
export const metadata: Metadata = {
  title: 'Ulasan — dsapoetra',
  description: 'Rak buku: yang sudah selesai, yang sedang dibaca, dan catatannya.',
}

export default async function UlasanIndex() {
  const [rak, shop] = await Promise.all([loadRak(), hasShop()])

  if (!rak) return <ReviewList />

  // The label names the sheet, and the number comes from the register — never
  // from a string here — so the nav, the wordmark and this line cannot drift.
  const number = sheetNumber('/ulasan', shop)

  return (
    <div className="mx-auto w-full max-w-[1160px] px-6 pt-16 pb-12">
      <p className="drafting-label">
        {number ? `Lembar ${number.number} — ` : ''}
        {number?.title ?? 'Ulasan'}
      </p>
      <h1 className="m-0 mt-3 max-w-[18ch] text-[clamp(34px,5vw,56px)] leading-[1.05] font-medium tracking-[-0.02em]">
        {rak.title}
      </h1>
      {rak.intro ? (
        <p className="mt-4 max-w-[52ch] leading-relaxed text-ink-soft">{rak.intro}</p>
      ) : null}

      <RakShelf
        phases={rak.phases.map((phase) => ({
          label: phase.label,
          books: phase.books.map(toSpineBook),
        }))}
      />
    </div>
  )
}

/** What `/ulasan` was before the shelf, and what it is again without `rak.md`. */
async function ReviewList() {
  const reviews = await loadReviews()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <SectionLabel>Ulasan</SectionLabel>

      {reviews.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada ulasan di sini.</p>
      ) : (
        <ul className="mt-8 space-y-10">
          {reviews.map((review) => (
            <li key={review.slug}>
              <Link href={`/ulasan/${review.slug}`} className="group flex gap-5">
                <Image
                  src={review.cover}
                  alt={`Sampul ${review.book.title}`}
                  width={80}
                  height={120}
                  className="h-[120px] w-[80px] shrink-0 rounded-sm border border-rule object-cover"
                />
                <div>
                  <h2 className="text-xl leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent">
                    {review.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {review.book.title} · {review.book.author}
                  </p>
                  <p className="mt-2 leading-7 text-muted">{review.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
