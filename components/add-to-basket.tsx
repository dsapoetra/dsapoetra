'use client'

import { useEffect, useState } from 'react'
import { useBasket } from '@/components/basket'

/**
 * "Beli" — puts one copy in the basket and says so.
 *
 * The confirmation replaces the label in place for a moment rather than
 * appearing as a toast: the button is where the visitor is already looking.
 *
 * The button's own accessible name stays constant (`Beli — Sunyi Hanya Angan`)
 * so it does not rename itself under a screen reader mid-interaction; the
 * confirmation is announced separately from the live region beside it.
 */
export default function AddToBasket({
  slug,
  title,
  label = 'Beli',
  className,
}: {
  slug: string
  /** Product title, so the accessible name distinguishes one row from the next. */
  title: string
  label?: string
  className?: string
}) {
  const { add } = useBasket()
  const [justAdded, setJustAdded] = useState(false)

  useEffect(() => {
    if (!justAdded) return
    const timer = window.setTimeout(() => setJustAdded(false), 1800)
    return () => window.clearTimeout(timer)
  }, [justAdded])

  return (
    <>
      <button
        type="button"
        aria-label={`${label} — ${title}`}
        onClick={() => {
          add(slug)
          setJustAdded(true)
        }}
        className={
          'rounded-sm bg-ink px-4 py-2 font-sans text-sm text-paper transition-opacity hover:opacity-85' +
          (className ? ` ${className}` : '')
        }
      >
        <span aria-hidden="true">{justAdded ? 'Masuk keranjang' : label}</span>
      </button>
      <span aria-live="polite" className="sr-only">
        {justAdded ? `${title} masuk keranjang` : ''}
      </span>
    </>
  )
}
