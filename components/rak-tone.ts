import type { CSSProperties } from 'react'
import type { SpineBook } from '@/lib/content/rak'

/**
 * What a book is printed on.
 *
 * Four surfaces, all of them already in the palette: three papers for a book
 * that has been opened, and the card colour — outlined in the drafting blue —
 * for one that has not. The outline is the whole signal. A queued book is not a
 * different *kind* of book, it is a book with nothing written in it yet, so it
 * is drawn as an empty box rather than given a fifth colour.
 *
 * Shared by the shelf and by the generated cover on a review page, so a book
 * with no cover photograph is the same colour in both places.
 */
const TONES = {
  ink: { background: 'var(--ink)', color: 'var(--paper)' },
  accent: { background: 'var(--muted)', color: 'var(--paper)' },
  paper: { background: 'var(--ink-soft)', color: 'var(--paper)' },
} as const

const QUEUED = {
  background: 'var(--card)',
  color: 'var(--ink-soft)',
  borderColor: 'var(--muted)',
} as const

export function toneStyle(book: Pick<SpineBook, 'status' | 'spine'>): CSSProperties {
  if (book.status === 'queued') return { ...QUEUED }

  return {
    ...TONES[book.spine.tone],
    borderColor: 'color-mix(in srgb, var(--paper) 35%, transparent)',
  }
}
