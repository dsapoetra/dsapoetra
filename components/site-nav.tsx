import { loadProductSlugs } from '@/lib/products/load'
import BasketLink from '@/components/basket-link'
import NavLinks from '@/components/nav-links'
import { sheets } from '@/lib/site'

/**
 * The header band across the top of every sheet: drawing number on the left,
 * the sheet index on the right, a hairline underneath. It stays put while the
 * sheet scrolls, the way a title strip does on a drawing board.
 */
export default async function SiteNav() {
  const slugs = await loadProductSlugs()
  const shop = slugs.length > 0
  const bound = sheets.filter((sheet) => (sheet.shopOnly ? shop : true))

  return (
    <header className="sticky top-0 z-10 border-b border-rule bg-paper">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4 font-mono text-xs tracking-[0.06em] sm:px-8"
      >
        <NavLinks sheets={bound} shop={shop}>
          {/*
            The basket sits inside the same list so it keeps its place in the
            reading and tab order, but only when there is something to buy —
            an always-empty basket is furniture, not navigation.
          */}
          {shop ? <BasketLink slugs={slugs} /> : null}
        </NavLinks>
      </nav>
    </header>
  )
}
