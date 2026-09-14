import Link from 'next/link'

export type Piece = {
  href: string
  title: string
  /** Already joined with the site separator by the caller. */
  meta: string
  /** `id` sets the element's language so a screen reader switches voice. */
  lang?: string
}

/**
 * One labelled list in the Writing wing: Stories, Poems, or Notes.
 *
 * Renders nothing at all when the list is empty. That is the switch for a
 * whole section: delete the folder and the heading goes with it, rather than
 * leaving "Poems" standing over a gap.
 */
export default function PieceList({
  label,
  pieces,
}: {
  label: string
  pieces: Piece[]
}) {
  if (pieces.length === 0) return null

  return (
    <section className="piece-list">
      <h2 className="label">{label}</h2>
      <div className="piece-list__items">
        {pieces.map((piece) => (
          <Link key={piece.href} href={piece.href} className="piece">
            <span lang={piece.lang}>{piece.title}</span>
            <span className="piece__meta">{piece.meta}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
