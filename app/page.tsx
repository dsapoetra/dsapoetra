import Link from 'next/link'
import type { Metadata } from 'next'
import { loadLatest, labelFor } from '@/lib/content/latest'
import { site } from '@/lib/site'
import SectionLabel from '@/components/section-label'
import JsonLd from '@/components/json-ld'
import AskMe from '@/components/ask-me'

export const metadata: Metadata = {
  title: 'dsapoetra',
  description: 'Puisi, cerita pendek, dan ulasan buku dari Jakarta.',
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.personalName || site.name,
  url: site.url,
  address: {
    '@type': 'PostalAddress',
    addressLocality: site.city,
  },
}

export default async function Home() {
  const items = await loadLatest(10)

  return (
    // The container is wider than the rest of the site so the sidebar has
    // somewhere to sit, but the reading column below keeps the same
    // prose measure every other page uses — only the page widens, not the text.
    <div className="mx-auto max-w-5xl px-6 py-20">
      <JsonLd data={personJsonLd} />

      <div className="lg:flex lg:items-start lg:gap-14">
        <div className="min-w-0 max-w-prose-measure lg:flex-1">
      <h1 className="text-3xl leading-tight">
        {site.personalName || site.name}
      </h1>

      <div className="mt-6 space-y-4 text-lg leading-8">
        <p>
          Saya menulis puisi dan cerita pendek, sedang menggarap novel, dan
          menuliskan ulasan buku-buku yang saya baca. Sudah {site.yearsWriting} tahun
          ini, dari {site.city}.
        </p>
        {site.detail ? <p>{site.detail}</p> : null}
        <p className="text-muted">
          Sehari-hari saya membangun perangkat lunak. Menulis yang membuat sisanya
          masuk akal.
        </p>
      </div>

      <SectionLabel as="h2" className="mt-16">
        Terbaru
      </SectionLabel>

      {items.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada tulisan.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block">
                <SectionLabel as="p">
                  {labelFor(item.kind)}
                  {' · '}
                  <time dateTime={item.date}>{item.date}</time>
                </SectionLabel>
                <h3 className="mt-1 text-xl leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent">
                  {item.title}
                </h3>
                {item.blurb ? (
                  <p className="mt-1 leading-7 text-muted">{item.blurb}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
        </div>

        <AskMe className="mt-16 lg:sticky lg:top-20 lg:mt-0 lg:w-60 lg:shrink-0" />
      </div>
    </div>
  )
}
