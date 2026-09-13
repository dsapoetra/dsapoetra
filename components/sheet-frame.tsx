import type { ReactNode } from 'react'

/**
 * The drawing frame: a hairline border with a heavier tick at each corner.
 *
 * The ticks are what make the border read as a *drawn* frame rather than a CSS
 * box, so they are not decoration to be dropped on small screens — they are the
 * cheapest part of the whole design and the most load-bearing.
 *
 * Sections inside are separated by their own dashed rule; the frame itself
 * never draws an internal line.
 */
export default function SheetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative border border-muted">
      <Tick className="-top-px -left-px border-t-2 border-l-2" />
      <Tick className="-top-px -right-px border-t-2 border-r-2" />
      <Tick className="-bottom-px -left-px border-b-2 border-l-2" />
      <Tick className="-bottom-px -right-px border-b-2 border-r-2" />
      {children}
    </div>
  )
}

function Tick({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute h-3.5 w-3.5 border-ink ${className}`}
    />
  )
}
