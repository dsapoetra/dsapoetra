import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 font-mono text-xs text-muted sm:flex-row sm:justify-between">
        <p>dsapoetra</p>
        <Link href="/sekarang" className="hover:text-ink focus-visible:text-ink">
          Sekarang
        </Link>
      </div>
    </footer>
  )
}
