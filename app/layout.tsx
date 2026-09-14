import type { Metadata } from 'next'
import Script from 'next/script'
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import SiteHeader from '@/components/site-header'
import SiteFooter from '@/components/site-footer'
import { loadSite } from '@/lib/content'
import { THEME_BOOT_SCRIPT } from '@/lib/theme'

/*
 * Three faces, one per job, and no more.
 *
 * Plus Jakarta Sans is the Work wing and all apparatus: nav, meta, labels.
 * Newsreader is the Writing wing, and carries an italic because a story needs
 * one. JetBrains Mono is for things that are read as VALUES rather than as
 * language: dates, tech tags, reading times.
 *
 * `next/font` self-hosts all three at build time, so there is no request to
 * fonts.googleapis.com at runtime and no flash of fallback text. Each one is
 * bound to the CSS variable the stylesheet already names, which is what lets
 * globals.css stay pure CSS with no knowledge of Next.
 */
const sans = Plus_Jakarta_Sans({
  variable: '--sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const serif = Newsreader({
  variable: '--serif',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadSite()

  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.name,
      template: `%s · ${site.name}`,
    },
    description: site.description,
    openGraph: {
      type: 'website',
      siteName: site.name,
      title: site.name,
      description: site.description,
      url: site.url,
    },
  }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const site = await loadSite()

  return (
    /*
     * `suppressHydrationWarning` is required and is scoped to this one
     * element: the boot script below sets `data-theme` on <html> before React
     * hydrates, so the server markup and the live DOM differ here by design.
     * React would otherwise warn on every page load.
     */
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/*
          Injected into the initial HTML and run before any Next.js code, so a
          stored light or dark choice is on the document before the browser
          paints. Anything later (an effect, a deferred script) lands a frame
          after the wrong theme has already been shown.

          `next/script` rather than a bare <script> tag: React never executes a
          raw script element it renders, and logs an error saying so. The `id`
          is required for an inline script.
        */}
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SiteHeader name={site.name} shortName={site.shortName} />
        <div className="site-content" id="content">
          {children}
        </div>
        <SiteFooter site={site} />
      </body>
    </html>
  )
}
