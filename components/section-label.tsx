import type { ReactNode } from 'react'

const BASE_CLASSES =
  'inline-block bg-highlight px-2 py-1 font-mono text-xs uppercase tracking-widest text-on-highlight'

type SectionLabelProps = {
  children: ReactNode
  /** Element to render as. Defaults to `h1`; pass `h2` or `p` to match the call site's semantics. */
  as?: 'h1' | 'h2' | 'p'
  /** Extra classes for layout concerns (e.g. spacing) that belong to the call site, not this component. */
  className?: string
}

export default function SectionLabel({ children, as: Tag = 'h1', className }: SectionLabelProps) {
  return <Tag className={className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES}>{children}</Tag>
}
