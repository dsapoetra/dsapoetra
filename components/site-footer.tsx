import type { Site } from '@/lib/content'

/**
 * Location on the left, contact on the right, one hairline above.
 *
 * On mobile the two swap order (`column-reverse` in the stylesheet) so the
 * links, which are the reason anyone looks at a footer, sit above the place
 * name rather than below it.
 */
export default function SiteFooter({ site }: { site: Site }) {
  return (
    <footer className="site-footer">
      <span>{site.location}</span>
      <nav aria-label="Elsewhere">
        {site.links.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  )
}
