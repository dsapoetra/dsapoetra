import Link from 'next/link'
import { hasShop } from '@/lib/products/load'

const LINK_CLASSES = 'transition-colors hover:text-accent focus-visible:text-accent'

export default async function SiteFooter() {
  const year = new Date().getFullYear()
  const shop = await hasShop()

  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-7 font-mono text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} dsapoetra</p>
        <nav aria-label="Navigasi footer" className="flex gap-5">
          {shop ? (
            <Link href="/toko" className={LINK_CLASSES}>
              Toko
            </Link>
          ) : null}
          <Link href="/tulisan" className={LINK_CLASSES}>
            Tulisan
          </Link>
          <Link href="/sekarang" className={LINK_CLASSES}>
            Sekarang
          </Link>
          <Link href="/rss.xml" className={LINK_CLASSES}>
            RSS
          </Link>
        </nav>
      </div>
    </footer>
  )
}
