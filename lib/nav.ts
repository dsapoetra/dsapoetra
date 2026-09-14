/**
 * The four nav items, in order, and which URLs each of them owns.
 *
 * A poem lives at `/poems/hujan-di-bintaro`, not under `/writing`, because the
 * short URL is the better one to share. But it is still a page of the Writing
 * wing, and the nav has to say so while you read it. `owns` is what makes that
 * true without hard-coding the relationship into every template.
 */
export type NavItem = {
  href: string
  label: string
  /** Extra path prefixes that mark this item active. */
  owns?: string[]
}

export const nav: NavItem[] = [
  { href: '/work', label: 'Work', owns: ['/notes'] },
  { href: '/writing', label: 'Writing', owns: ['/poems', '/stories', '/reading'] },
  { href: '/about', label: 'About' },
  { href: '/now', label: 'Now' },
]

/**
 * Which nav item `pathname` belongs to, or `null` on the homepage.
 *
 * The homepage marks nothing: it is the two wings side by side and belongs to
 * neither. Matching is by path segment, so `/notes` owning a route can never
 * accidentally claim a future `/notebooks`.
 */
export function activeHref(pathname: string): string | null {
  const owner = nav.find((item) =>
    [item.href, ...(item.owns ?? [])].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  )
  return owner?.href ?? null
}
