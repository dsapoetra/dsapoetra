import Link from 'next/link'
import { loadProductSlugs } from '@/lib/products/load'
import BasketLink from '@/components/basket-link'

const links = [
  { href: '/', label: 'Beranda' },
  { href: '/toko', label: 'Toko', shopOnly: true },
  { href: '/tulisan', label: 'Tulisan' },
  { href: '/sekarang', label: 'Sekarang' },
]

export default async function SiteNav() {
  const slugs = await loadProductSlugs()
  const shop = slugs.length > 0

  return (
    <header className="border-b border-rule">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4"
      >
        <Link href="/" className="font-mono text-sm tracking-tight text-ink">
          dsapoetra
        </Link>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 font-sans text-sm">
          {links
            .filter((link) => (link.shopOnly ? shop : true))
            .map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-muted transition-colors hover:text-accent focus-visible:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}

          {/*
            The basket lives inside the same list so it keeps its place in the
            reading and tab order, but only when there is something to buy —
            an always-empty basket is furniture, not navigation.
          */}
          {shop ? (
            <li>
              <BasketLink slugs={slugs} />
            </li>
          ) : null}
        </ul>
      </nav>
    </header>
  )
}
