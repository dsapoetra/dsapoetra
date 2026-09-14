'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { activeHref, nav } from '@/lib/nav'
import ThemeToggle from './theme-toggle'

/**
 * The header is a client component for one reason: it needs the current path
 * to mark a nav item, and in the App Router a layout's server component never
 * sees it. Nothing else here is interactive, and the name and links come in as
 * props from the server so the markdown stays the source of truth.
 */
export default function SiteHeader({
  name,
  shortName,
}: {
  name: string
  shortName: string
}) {
  const pathname = usePathname()
  const active = activeHref(pathname)

  return (
    <header className="site-header">
      <Link href="/" className="site-header__name">
        <span className="site-header__name--full">{name}</span>
        <span className="site-header__name--short">{shortName}</span>
      </Link>
      {/*
        The nav and the theme chip travel together on the right, so the header
        stays the two-part arrangement the boards drew: name on one side,
        everything else on the other.
      */}
      <div className="site-header__end">
        <nav className="site-nav" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Outside the nav: it is a page control, not a destination. */}
        <ThemeToggle />
      </div>
    </header>
  )
}
