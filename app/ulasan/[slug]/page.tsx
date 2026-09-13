import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadReviews, loadReview, type Review } from '@/lib/content/load'
import { loadRak, type ShelfBook } from '@/lib/content/rak'
import { readingTimeMinutes } from '@/lib/content/reading-time'
import { formatDateId } from '@/lib/format'
import { site } from '@/lib/site'
import { toneStyle } from '@/components/rak-tone'
import MdxContent from '@/components/mdx-content'
import VideoCard from '@/components/video-card'
import JsonLd from '@/components/json-ld'
import RakKeys from '@/components/rak-keys'

/**
 * One book on the shelf.
 *
 * Every book in `content/rak.md` has a page, not only the ones that have been
 * written about — 125 pages, of which a handful carry prose. That is the point:
 * the page is the book's place on the site, and a book with no notes yet says
 * so, rather than 404-ing and making the shelf full of dead links.
 *
 * The review, when there is one, comes from `content/ulasan/<slug>.mdx` and is
 * joined on by slug in `loadRak`. Neither file knows about the other.
 */

const STATUS_LABEL = {
  finished: 'Selesai',
  reading: 'Sedang dibaca',
  paused: 'Ditunda',
  queued: 'Antre',
} as const

/**
 * Filled for a book that is done, outlined in full ink while it is open, and
 * outlined in the rule for one that is stalled or unopened — so the chip reads
 * at a glance in the same three weights the shelf uses.
 */
const STATUS_CHIP = {
  finished: 'border-highlight bg-highlight text-on-highlight',
  reading: 'border-ink text-ink',
  paused: 'border-rule text-muted',
  queued: 'border-rule text-muted',
} as const

const EMPTY_NOTE = {
  queued: 'Belum mulai. Catatannya menyusul kalau sudah.',
  reading: 'Masih dibaca. Catatannya menyusul kalau saya selesai, atau kalau saya menyerah.',
  paused: 'Berhenti di tengah. Catatannya menyusul kalau saya kembali ke sini.',
  finished: 'Sudah selesai dibaca, tapi catatannya belum ditulis.',
} as const

export async function generateStaticParams() {
  const [rak, reviews] = await Promise.all([loadRak(), loadReviews()])

  // The union, not just the shelf: a review written before its book was added
  // to rak.md — or written while rak.md does not exist at all — still has a
  // page. Nothing that was once published stops resolving.
  const slugs = new Set([
    ...(rak?.books ?? []).map((book) => book.slug),
    ...reviews.map((review) => review.slug),
  ])

  return [...slugs].map((slug) => ({ slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [book, review] = await Promise.all([findBook(slug), loadReview(slug)])
  if (!book && !review) return {}

  const title = review?.title ?? book?.title ?? ''
  const description =
    review?.excerpt ??
    (book ? `${book.title} — ${book.author}. ${EMPTY_NOTE[book.status]}` : '')

  return {
    title: `${title} — dsapoetra`,
    description,
    alternates: review?.canonicalUrl ? { canonical: review.canonicalUrl } : undefined,
  }
}

async function findBook(slug: string): Promise<ShelfBook | null> {
  const rak = await loadRak()
  return rak?.books.find((book) => book.slug === slug) ?? null
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [rak, review] = await Promise.all([loadRak(), loadReview(slug)])
  const book = rak?.books.find((entry) => entry.slug === slug) ?? null

  if (!book && !review) notFound()

  const title = book?.title ?? review!.book.title
  const author = book?.author ?? review!.book.author
  const status = book?.status ?? 'finished'
  const phase = book?.phase ?? 'Ulasan'
  const lang = book?.lang ?? 'id'
  // `book.cover` already prefers the review's own `cover:` field; the second
  // half is for the case where rak.md is gone and only the review is left.
  const cover = book?.cover ?? review?.cover ?? null
  const progress = status === 'reading' || status === 'paused' ? (book?.pct ?? 0) : null

  const books = rak?.books ?? []
  const at = book ? book.index : -1
  const prev = at >= 0 ? books[(at - 1 + books.length) % books.length] : null
  const next = at >= 0 ? books[(at + 1) % books.length] : null
  const rail = book ? books.filter((entry) => entry.phase === book.phase) : []

  const meta = [
    ...(review?.tags ?? []),
    review ? formatDateId(review.date) : null,
    review ? `${readingTimeMinutes(review.body)} menit baca` : null,
    lang === 'id' ? 'Bahasa Indonesia' : 'Bahasa Inggris',
  ].filter(Boolean)

  return (
    <div className="rak-enter mx-auto grid w-full max-w-[1160px] grid-cols-[56px_minmax(0,1fr)] gap-6 px-6 pt-12 pb-16">
      {review ? <JsonLd data={jsonLdFor(review)} /> : null}
      {prev && next ? (
        <RakKeys
          prevHref={`/ulasan/${prev.slug}`}
          nextHref={`/ulasan/${next.slug}`}
          backHref="/ulasan"
        />
      ) : null}

      <aside className="flex flex-col gap-5 pt-1.5">
        <Link
          href="/ulasan"
          aria-label="Kembali ke rak"
          className="flex h-9 w-9 items-center justify-center rounded-sm border border-rule text-muted transition-colors hover:border-muted hover:text-ink"
        >
          <span aria-hidden>←</span>
        </Link>

        {/*
          One dash per book in this phase — the shelf in miniature, so you can
          see where in the pile you are without going back to it.
        */}
        {rail.length > 1 ? (
          <nav aria-label={`Buku lain di ${phase}`} className="flex flex-col gap-2 pl-1">
            {rail.map((entry) => (
              <Link
                key={entry.slug}
                href={`/ulasan/${entry.slug}`}
                title={entry.title}
                aria-label={entry.title}
                aria-current={entry.slug === slug ? 'page' : undefined}
                className={`h-[3px] rounded-[1px] transition-all hover:bg-ink ${
                  entry.slug === slug ? 'w-9 bg-muted' : 'w-[22px] bg-rule'
                }`}
              />
            ))}
          </nav>
        ) : null}
      </aside>

      <article className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-start gap-x-14 gap-y-10">
        <div className="w-[min(100%,380px)]">
          {cover ? (
            <Image
              src={cover}
              alt={`Sampul ${title}`}
              width={380}
              height={570}
              /*
               * `object-contain` on the card colour, not `object-cover`: these
               * covers come from a catalogue and their proportions vary, and
               * cropping a book cover to fit a 2:3 box eats the title off the
               * top of the tall ones. Letterboxed on the card reads as a book
               * photographed against the sheet; cropped reads as a mistake.
               */
              className="aspect-[2/3] w-full rounded-sm border border-rule bg-card object-contain shadow-[-10px_0_0_-4px_var(--card),0_24px_40px_rgba(0,0,0,0.5)]"
            />
          ) : (
            /*
              No photograph, so the cover is set rather than shown: the book's
              own spine colour, its phase at the head and its author at the
              foot. An empty grey box would say the site is broken; this says
              the book has no cover on file.
            */
            <div
              className="flex aspect-[2/3] w-full flex-col justify-between rounded-sm px-6 py-7 shadow-[-10px_0_0_-4px_var(--card),0_24px_40px_rgba(0,0,0,0.5)]"
              style={book ? toneStyle(book) : undefined}
            >
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase opacity-80">
                {phase}
              </span>
              <span className="text-[clamp(26px,3vw,38px)] leading-[1.05] font-bold tracking-[-0.02em]">
                {title}
              </span>
              <span className="font-mono text-xs tracking-[0.06em] uppercase">
                {author}
              </span>
            </div>
          )}
        </div>

        <div className="max-w-[60ch]">
          <p className="drafting-label">{phase}</p>
          <p className="mt-3.5 text-[15px] text-ink-soft">{author}</p>
          <h1 className="m-0 mt-1 text-[clamp(30px,4vw,46px)] leading-[1.05] font-medium tracking-[-0.02em]">
            {title}
          </h1>
          {meta.length > 0 ? (
            <p className="mt-3.5 font-mono text-xs leading-relaxed tracking-[0.04em] text-muted">
              {meta.join(' · ')}
            </p>
          ) : null}

          <div className="mt-5 flex items-center gap-3">
            <span
              className={`rounded-sm border px-2.5 py-1 font-mono text-[11px] tracking-[0.1em] uppercase ${STATUS_CHIP[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
            {progress !== null ? (
              <>
                <span className="h-[3px] max-w-[220px] flex-1 rounded-sm bg-rule">
                  <span
                    className="block h-full rounded-sm bg-muted"
                    style={{ width: `${progress}%` }}
                  />
                </span>
                <span className="font-mono text-[11px] text-muted">{progress}%</span>
              </>
            ) : null}
          </div>

          {review ? (
            <>
              <h2 className="mt-10 mb-3.5 text-2xl leading-tight font-medium">
                {review.title}
              </h2>
              <div className="text-ink-soft">
                <MdxContent source={review.body} />
              </div>
              {review.videoUrl ? (
                <VideoCard url={review.videoUrl} bookTitle={title} />
              ) : null}
            </>
          ) : (
            <p className="mt-10 rounded-sm border border-dashed border-rule px-5 py-4 text-sm leading-relaxed text-muted">
              {EMPTY_NOTE[status]}
            </p>
          )}

          {prev && next ? (
            <nav className="mt-14 flex justify-between gap-4 border-t border-rule pt-4 font-mono text-[11px] tracking-[0.06em] uppercase">
              <Link href={`/ulasan/${prev.slug}`} className="text-muted hover:text-ink">
                ← {prev.title}
              </Link>
              <Link
                href={`/ulasan/${next.slug}`}
                className="text-right text-muted hover:text-ink"
              >
                {next.title} →
              </Link>
            </nav>
          ) : null}
        </div>
      </article>
    </div>
  )
}

function jsonLdFor(review: Review) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Book',
      name: review.book.title,
      author: { '@type': 'Person', name: review.book.author },
    },
    datePublished: review.date,
    author: { '@type': 'Person', name: site.personalName || site.name },
  }
}
