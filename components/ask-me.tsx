import SectionLabel from '@/components/section-label'
import { site } from '@/lib/site'

/**
 * Simple monochrome glyphs drawn with `currentColor`, not official brand
 * assets. Each row carries a text label beside its icon, so the glyph only has
 * to suggest the destination rather than be a trademark-accurate mark — and a
 * badly-redrawn brand logo looks worse than a clean generic one. Swap in the
 * platforms' own SVGs if you want exact fidelity.
 */
const ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  threads: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 13.2c0 1.8-1.6 3-3.4 3-1.5 0-2.6-.8-2.6-2 0-1.1 1-1.9 2.6-1.9 2.4 0 4.4 1 4.4 3.4 0 1.6-1.4 3.1-4 3.1-3 0-5-2.2-5-5.8S9.3 6.2 12.3 6.2c2 0 3.4.8 4.2 2" />
    </>
  ),
  github: (
    <>
      <path d="M9 18l-3-6 3-6" />
      <path d="M15 6l3 6-3 6" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 19l1.1-3.2A7.2 7.2 0 1 1 8.2 18.9L4 19z" />
      <path d="M9 10.5c.4 1.6 1.9 3.1 3.5 3.5" />
    </>
  ),
  discord: (
    <>
      <path d="M4 17.5C3 14 3.3 9.6 5.5 6.8 6.8 6.2 8.2 5.8 9.5 5.7l.6 1.2a12 12 0 0 1 3.8 0l.6-1.2c1.3.1 2.7.5 4 1.1 2.2 2.8 2.5 7.2 1.5 10.7-1.4 1-2.9 1.6-4.4 1.8l-.8-1.3M7.2 18.1L6.4 19.4" />
      <circle cx="9.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  email: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" />
    </>
  ),
  link: <path d="M10 13a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 5.8M14 11a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L12.5 18.2" />,
}

function Icon({ name }: { name: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {ICONS[name] ?? ICONS.link}
    </svg>
  )
}

export default function AskMe({
  className,
  layout = 'column',
}: {
  className?: string
  /**
   * `column` stacks the rows — the shape for a narrow sidebar.
   * `row` wraps them side by side, which is what the homepage wants now that
   * the block sits full-width under the bio instead of beside it.
   */
  layout?: 'column' | 'row'
}) {
  const links = site.links.filter((link) => link.href !== '')

  // Nothing configured yet — render nothing rather than an empty shell.
  if (links.length === 0) return null

  return (
    // <aside>, not <section>: this is complementary to the page, not part of
    // its argument. Spacing comes from the call site so the component does not
    // assume where it sits.
    <aside className={className}>
      <SectionLabel as="h2">Tanya apa saja</SectionLabel>

      <ul
        className={
          layout === 'row'
            ? 'mt-4 flex flex-wrap gap-3'
            : 'mt-6 space-y-3'
        }
      >
        {links.map((link) => {
          // mailto:/tel: must stay in-page; only real web destinations open a tab.
          const external = link.href.startsWith('http')

          return (
            <li key={link.label}>
              <a
                href={link.href}
                {...(external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="group flex items-center gap-4 rounded-sm border border-rule px-5 py-4 font-sans text-base text-ink transition-colors hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:text-accent"
              >
                <Icon name={link.icon} />
                <span>{link.label}</span>
                {external ? (
                  <span className="sr-only">(membuka di tab baru)</span>
                ) : null}
              </a>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
