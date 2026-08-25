import Link from 'next/link'

const links = [
  { href: '/ulasan', label: 'Ulasan' },
  { href: '/puisi', label: 'Puisi' },
  { href: '/cerita', label: 'Cerita' },
]

export default function SiteNav() {
  return (
    <header className="border-b border-rule">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-5xl items-baseline justify-between px-6 py-5"
      >
        <Link href="/" className="font-mono text-sm tracking-tight text-ink">
          dsapoetra
        </Link>
        <ul className="flex gap-6 font-sans text-sm">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-muted transition-colors hover:text-accent focus-visible:text-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
