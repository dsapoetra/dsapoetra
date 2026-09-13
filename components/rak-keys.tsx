'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * ← / → to walk the shelf, Esc to put the book back.
 *
 * Renders nothing. The links it shadows are all on the page already — the
 * prev/next row and the back button — so this is an accelerator for someone
 * reading through a phase, never the only way to get anywhere.
 *
 * Typing is left alone: a key pressed inside a field or on a focused control
 * belongs to that control.
 */
export default function RakKeys({
  prevHref,
  nextHref,
  backHref,
}: {
  prevHref: string
  nextHref: string
  backHref: string
}) {
  const router = useRouter()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target as HTMLElement | null
      if (
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target?.tagName ?? '')
      ) {
        return
      }

      if (event.key === 'ArrowLeft') router.push(prevHref)
      else if (event.key === 'ArrowRight') router.push(nextHref)
      else if (event.key === 'Escape') router.push(backHref)
      else return

      event.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router, prevHref, nextHref, backHref])

  return null
}
