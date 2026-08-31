import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * The rule-under-a-heading pattern the homepage uses for its major sections:
 * a serif heading on the left, an optional quiet link on the right, and a full
 * ink rule underneath. Distinct from `SectionLabel`, which is the small coral
 * tag used for minor labels — this one opens a section, that one names a field.
 */
export default function SectionHeading({
  children,
  href,
  action,
  className,
}: {
  children: ReactNode
  /** Destination for the right-hand link. Omit both to render the heading alone. */
  href?: string
  /** Text of the right-hand link. */
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-ink pb-2.5${
        className ? ` ${className}` : ''
      }`}
    >
      <h2 className="text-2xl font-medium">{children}</h2>
      {href && action ? (
        <Link
          href={href}
          className="shrink-0 font-sans text-[13px] text-muted transition-colors hover:text-accent focus-visible:text-accent"
        >
          {action}
        </Link>
      ) : null}
    </div>
  )
}
