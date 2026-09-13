'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { sheetNumber, type Sheet } from '@/lib/site'

/**
 * The drawing number and the nav row.
 *
 * Client-side because both halves depend on which sheet you are looking at:
 * the wordmark reads `DWG-003 · DSAPOETRA` on sheet three, and the matching
 * nav item is the only one in full ink with a rule under it. A blueprint
 * always tells you which sheet you are holding.
 *
 * A sub-page — a poem, a review — belongs to its parent sheet, so `/puisi/x`
 * still marks TULISAN and still reads DWG-003.
 */
export default function NavLinks({
  sheets,
  shop,
  children,
}: {
  sheets: Sheet[]
  shop: boolean
  /** The basket, slotted in after the last link so it keeps its tab order. */
  children?: ReactNode
}) {
  const pathname = usePathname()
  const current = currentSheet(sheets, pathname)
  const number = current ? sheetNumber(current.href, shop) : null

  return (
    <>
      <Link
        href="/"
        className="text-ink transition-colors hover:text-ink hover:underline"
      >
        {number ? `${number.dwg} · ` : ''}DSAPOETRA
      </Link>

      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {sheets.map((sheet) => {
          const active = sheet.href === current?.href
          return (
            <li key={sheet.href}>
              <Link
                href={sheet.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'border-b border-muted pb-0.5 text-ink'
                    : 'text-muted transition-colors hover:text-ink'
                }
              >
                {sheet.label.toUpperCase()}
              </Link>
            </li>
          )
        })}
        {children ? <li>{children}</li> : null}
      </ul>
    </>
  )
}

/**
 * The sheet a path belongs to: an exact match first, then the sheet whose own
 * href or `owns` prefix the path sits under. `/` never matches as a prefix —
 * every path starts with it, so it would swallow the whole site.
 */
export function currentSheet(sheets: Sheet[], pathname: string): Sheet | undefined {
  const exact = sheets.find((sheet) => sheet.href === pathname)
  if (exact) return exact

  return sheets.find((sheet) =>
    [sheet.href, ...(sheet.owns ?? [])].some(
      (prefix) => prefix !== '/' && pathname.startsWith(`${prefix}/`)
    )
  )
}
