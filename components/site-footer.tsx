import Link from 'next/link'
import { hasShop } from '@/lib/products/load'
import { site } from '@/lib/site'

const LINK_CLASSES = 'text-muted transition-colors hover:text-ink'

/**
 * The strip below the sheet: who drew it on the left, where to reach them on
 * the right. Deliberately thinner and quieter than the title block inside the
 * sheet — this is the margin of the page, not part of the drawing.
 */
export default async function SiteFooter() {
  const year = new Date().getFullYear()
  const shop = await hasShop()

  return (
    <footer className="border-t border-rule">
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5 font-mono text-[11px] tracking-[0.06em] text-muted sm:px-8">
        <span>© {year} DSAPOETRA</span>

        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-5">
          {shop ? (
            <Link href="/toko" className={LINK_CLASSES}>
              TOKO
            </Link>
          ) : null}
          <Link href="/tulisan" className={LINK_CLASSES}>
            TULISAN
          </Link>
          <Link href="/sekarang" className={LINK_CLASSES}>
            SEKARANG
          </Link>
          <Link href="/rss.xml" className={LINK_CLASSES}>
            RSS
          </Link>
          {site.links.map((link) => (
            <a key={link.href} href={link.href} className={LINK_CLASSES}>
              {link.label.toUpperCase()}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
