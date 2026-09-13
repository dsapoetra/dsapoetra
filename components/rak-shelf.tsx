'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { BookStatus, SpineBook } from '@/lib/content/rak'
import { toneStyle } from './rak-tone'

/**
 * The shelf on `/ulasan` — 125 books drawn as stacks lying flat.
 *
 * Client-side only because of what it holds: which filter is on, and whether
 * the full list is open. The books themselves, their order and their geometry
 * all arrive as props from the server, so nothing here decides what a book
 * looks like — it only decides which ones are dimmed.
 *
 * The page opens on TWO stacks, not on all eight phases. A list of 125 books is
 * a list nobody reads; the ten sitting on the pile and the ones already
 * finished are the two questions a reader actually has. The full grid is behind
 * a toggle because it is an archive, and an archive should be available, not
 * unavoidable.
 */

/** How many books sit on the pile at once. Finish one, the next slides on. */
const QUEUE_SIZE = 10

type StatusFilter = BookStatus | 'all'

const STATUSES: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'Semua' },
  { key: 'finished', label: 'Selesai' },
  { key: 'reading', label: 'Sedang dibaca' },
  { key: 'paused', label: 'Ditunda' },
  { key: 'queued', label: 'Antre' },
]

const LANGS: Array<{ key: 'en' | 'id'; label: string }> = [
  { key: 'en', label: 'Inggris' },
  { key: 'id', label: 'Indonesia' },
]

export type ShelfPhase = { label: string; books: SpineBook[] }

export default function RakShelf({ phases }: { phases: ShelfPhase[] }) {
  const [status, setStatus] = useState<StatusFilter>('all')
  const [lang, setLang] = useState<'en' | 'id' | null>(null)
  const [viewAll, setViewAll] = useState(false)

  const books = phases.flatMap((phase) => phase.books)
  const matches = (book: SpineBook) =>
    (status === 'all' || book.status === status) && (!lang || book.lang === lang)

  const finished = books.filter((book) => book.status === 'finished')
  const unfinished = books.filter((book) => book.status !== 'finished')
  const queue = unfinished.slice(0, QUEUE_SIZE)
  const visible = books.filter(matches)

  return (
    <>
      <div className="mt-14 grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-start gap-x-14 gap-y-16">
        <Stack
          heading="Antrean"
          count={`${queue.length} dari ${unfinished.length} tersisa`}
          note="Sepuluh buku sekaligus. Selesaikan satu, yang berikutnya naik ke tumpukan."
          books={queue}
        />
        <Stack
          heading="Sudah selesai"
          count={`${finished.length} / ${books.length}`}
          note="Yang terbaru di atas. Klik salah satu untuk catatannya."
          /*
           * Reversed, so the most recently finished book is the one on top of
           * the pile — which is where you would actually have put it down.
           */
          books={finished.slice().reverse()}
        />
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-dashed border-rule pt-6">
        <span className="drafting-label">
          {books.length} buku · {phases.length} fase
        </span>
        <button
          type="button"
          onClick={() => setViewAll((open) => !open)}
          aria-expanded={viewAll}
          className="drafting-label rounded-sm border border-rule px-3.5 py-2 transition-colors hover:border-muted hover:text-ink"
        >
          {viewAll ? 'Sembunyikan daftar lengkap' : 'Lihat daftar lengkap'}
        </button>
      </div>

      {viewAll ? (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
            <FilterGroup label="Status">
              {STATUSES.map((filter) => (
                <Pill
                  key={filter.key}
                  on={status === filter.key}
                  onClick={() => setStatus(filter.key)}
                >
                  {filter.label}
                </Pill>
              ))}
            </FilterGroup>

            <FilterGroup label="Bahasa">
              {LANGS.map((filter) => (
                <Pill
                  key={filter.key}
                  on={lang === filter.key}
                  /* Toggling, not selecting: both off means both shown. */
                  onClick={() => setLang((on) => (on === filter.key ? null : filter.key))}
                >
                  {filter.label}
                </Pill>
              ))}
            </FilterGroup>

            <span
              aria-live="polite"
              className="font-mono text-[11px] tracking-[0.06em] text-muted sm:ml-auto"
            >
              {visible.length} / {books.length} BUKU · {finished.length} SELESAI
            </span>
          </div>

          <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,460px),1fr))] items-end gap-x-14 gap-y-16">
            {phases.map((phase) => (
              <Stack
                key={phase.label}
                heading={phase.label}
                count={`${phase.books.filter((b) => b.status === 'finished').length} / ${phase.books.length} selesai`}
                books={phase.books}
                dim={(book) => !matches(book)}
              />
            ))}
          </div>

          <ul className="mt-7 flex list-none flex-wrap gap-x-7 gap-y-3 p-0 font-mono text-[11px] tracking-[0.06em] text-muted">
            <Legend swatch={<span className="inline-block h-[3px] w-3.5 bg-ink" />}>
              Garis di bawah = masih dibaca
            </Legend>
            <Legend
              swatch={<span className="inline-block h-2.5 w-3.5 border border-muted" />}
            >
              Garis luar = belum mulai
            </Legend>
            <Legend
              swatch={
                <span className="inline-block h-2.5 w-3.5 bg-[var(--cover-accent)]" />
              }
            >
              Pita = bahasa Indonesia
            </Legend>
            <Legend>Redup = di luar filter</Legend>
          </ul>
        </>
      ) : null}
    </>
  )
}

/** One pile: a heading, a count, and books resting on a board. */
function Stack({
  heading,
  count,
  note,
  books,
  dim,
}: {
  heading: string
  count: string
  note?: string
  books: SpineBook[]
  /** Which books sit outside the current filter. Omitted where none can. */
  dim?: (book: SpineBook) => boolean
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2.5">
        <h2 className="m-0 text-xl font-medium">{heading}</h2>
        <span className="font-mono text-[11px] tracking-[0.06em] whitespace-nowrap text-muted">
          {count}
        </span>
      </div>

      {note ? (
        <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-muted">{note}</p>
      ) : null}

      <div className="relative mt-6 pt-4">
        <div className="flex flex-col items-center px-10">
          {books.map((book) => (
            <Spine key={book.slug} book={book} dimmed={dim ? dim(book) : false} />
          ))}
        </div>
        {/* The board they rest on, and the batten under its front edge. */}
        <div className="mx-2 h-2.5 rounded-[1px] bg-muted shadow-[0_14px_28px_rgba(0,0,0,0.5)]" />
        <div className="mx-[18px] h-1.5 bg-rule" />
      </div>
    </section>
  )
}

function Spine({ book, dimmed }: { book: SpineBook; dimmed: boolean }) {
  const { spine } = book
  const reading = book.status === 'reading' || book.status === 'paused'

  return (
    <Link
      href={`/ulasan/${book.slug}`}
      title={`${book.title} — ${book.author}`}
      /*
        Not `overflow-hidden`: the cut pages are drawn by a pseudo-element that
        sits OUTSIDE the right edge, and clipping the spine clips them away.
        The author label does its own truncating instead.
      */
      className="rak-spine z-[1] box-border flex max-w-[calc(100%-40px)] flex-none items-center justify-between gap-4 border px-4.5 text-left"
      style={{
        ...toneStyle(book),
        width: `${spine.len}px`,
        height: `${spine.thick}px`,
        opacity: dimmed ? 0.14 : 1,
        ['--spine-shift' as string]: `${spine.shift}px`,
        ['--spine-rot' as string]: `${spine.rot}deg`,
      }}
    >
      {/*
        The title never shrinks and never truncates — a spine you cannot read
        is not a book. The author gives way first.
      */}
      <span
        className="flex-none leading-none whitespace-nowrap"
        style={{
          fontSize: `${spine.fs}px`,
          fontWeight: spine.weight,
          textTransform: spine.caps ? 'uppercase' : 'none',
        }}
      >
        {book.title}
      </span>
      <span className="min-w-0 flex-initial overflow-hidden font-mono text-[9px] tracking-[0.08em] text-ellipsis uppercase opacity-85">
        {book.authorShort}
      </span>

      {book.lang === 'id' ? (
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 w-3 bg-[var(--cover-accent)]"
        />
      ) : null}

      {reading ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{ background: 'color-mix(in srgb, var(--paper) 18%, transparent)' }}
        >
          <span
            className="block h-full bg-paper"
            style={{ width: `${book.pct ?? 0}%` }}
          />
        </span>
      ) : null}
    </Link>
  )
}

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      <span className="drafting-label mr-2">{label}</span>
      {children}
    </div>
  )
}

function Pill({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
        on
          ? 'border-muted bg-highlight text-on-highlight'
          : 'border-rule text-ink-soft hover:border-muted hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}

function Legend({
  swatch,
  children,
}: {
  swatch?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-2 uppercase">
      {swatch ? <span aria-hidden>{swatch}</span> : null}
      {children}
    </li>
  )
}
