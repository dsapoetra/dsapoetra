import Link from 'next/link'
import type { Side } from '@/lib/medium'

/**
 * The one card for Medium posts, projects and case studies.
 *
 * `side` puts the card on the Angel or Demon palette whatever the page theme,
 * so a list of them reads as the site's duality rather than one colour. The
 * link stretches over the whole card (see `.side-card__link::after`), and its
 * hidden suffix names the card, so a screen reader's link list says which
 * post "Read on Medium" goes to.
 */
export default function SideCard({
  side,
  title,
  meta,
  body,
  tags = [],
  href,
  cta,
}: {
  side: Side
  title: string
  meta?: string
  body?: string
  tags?: string[]
  href?: string
  cta?: string
}) {
  const external = href?.startsWith('http')
  const label = (
    <>
      {cta} <span aria-hidden="true">{external ? '↗' : '→'}</span>
      <span className="sr-only">
        : {title}
        {external && ' (opens in a new tab)'}
      </span>
    </>
  )

  return (
    <article className={`side-card side-${side}`}>
      {meta && <p className="side-card__meta">{meta}</p>}
      <h3 className="side-card__title">{title}</h3>
      {body && <p className="side-card__body">{body}</p>}
      {tags.length > 0 && (
        <p className="tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </p>
      )}
      {href &&
        (external ? (
          <a className="side-card__link" href={href} target="_blank" rel="noopener">
            {label}
          </a>
        ) : (
          <Link className="side-card__link" href={href}>
            {label}
          </Link>
        ))}
    </article>
  )
}
