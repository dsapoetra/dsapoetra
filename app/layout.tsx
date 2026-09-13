import type { Metadata } from 'next'
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import SiteNav from '@/components/site-nav'
import SiteFooter from '@/components/site-footer'

/*
 * The blueprint runs on two faces and no more: Space Grotesk for everything
 * that is read, JetBrains Mono for everything that is *labelled* — sheet
 * numbers, section marks, title-block fields. See the note in globals.css
 * about why `--font-serif` still resolves to the grotesk.
 */
const space = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  display: 'swap',
})

const mono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://dsapoetra.com'),
  title: 'dsapoetra',
  description: 'Puisi, cerita, dan ulasan buku.',
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: 'dsapoetra' }],
    },
  },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="id"
      className={`${space.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="blueprint-grid min-h-full flex flex-col text-ink font-serif">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
