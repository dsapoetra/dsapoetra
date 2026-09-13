import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * One boxed item on a sheet — a review, a story, a poem.
 *
 * Three states, and they mean three different things:
 *
 *   `featured`  the newest item in its column, filled so the eye lands there
 *   `plain`     everything after it
 *   `pending`   a dashed box standing in for work that does not exist yet
 *
 * `pending` is not an empty state to be styled away. A blueprint shows the part
 * that has not been built yet as a dashed outline, and that is exactly what an
 * unwritten review is. It renders without a link, because there is nothing to
 * open.
 */
export default function SheetCard({
  code,
  meta,
  title,
  children,
  href,
  variant = 'plain',
}: {
  /** Item number in its column, e.g. `R-01`. */
  code: string
  /** The rest of the mono line: kind, date, status. */
  meta?: ReactNode
  title: string
  /** The blurb. */
  children?: ReactNode
  href?: string
  variant?: 'featured' | 'plain' | 'pending'
}) {
  const border =
    variant === 'pending'
      ? 'border-dashed border-muted'
      : variant === 'featured'
        ? 'border-muted bg-card'
        : 'border-rule'

  const body = (
    <>
      <div className="font-mono text-[11px] tracking-[0.08em] text-muted uppercase">
        {code}
        {meta ? <> · {meta}</> : null}
      </div>
      <div
        className={`text-xl leading-snug font-bold ${
          variant === 'pending' ? 'text-muted' : 'text-ink'
        }`}
      >
        {title}
      </div>
      {children ? (
        <p className="text-ink-soft m-0 leading-relaxed text-pretty">{children}</p>
      ) : null}
    </>
  )

  const classes = `flex flex-col gap-1.5 border px-6 py-5 ${border}`

  if (!href) {
    return <article className={classes}>{body}</article>
  }

  return (
    <Link
      href={href}
      className={`${classes} transition-colors hover:border-ink`}
    >
      {body}
    </Link>
  )
}
