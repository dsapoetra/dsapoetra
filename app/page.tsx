import Image from 'next/image'
import type { Metadata } from 'next'
import { loadLatest, groupByYear } from '@/lib/content/latest'
import { loadProducts } from '@/lib/products/load'
import { site } from '@/lib/site'
import JsonLd from '@/components/json-ld'
import AskMe from '@/components/ask-me'
import SectionHeading from '@/components/section-heading'
import ProductCard from '@/components/product-card'
import StreamList from '@/components/stream-list'
import NovelProgress from '@/components/novel-progress'
import SekarangCard from '@/components/sekarang-card'

export const metadata: Metadata = {
  title: 'dsapoetra',
  description: 'Puisi, cerita pendek, dan ulasan buku dari Jakarta.',
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.personalName || site.name,
  url: site.url,
  // Now genuinely sourced — a real image exists, so this is no longer a claim
  // without a basis. Absolute, because consumers of JSON-LD do not resolve
  // relative paths.
  image: `${site.url}${site.avatar}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: site.city,
  },
}

export default async function Home() {
  const [items, products] = await Promise.all([loadLatest(), loadProducts()])
  const latest = items.slice(0, 4)

  // "Arsip 2026 (4)" — the newest year present and how much is in it, taken
  // from the content itself rather than hardcoded, so it cannot drift.
  const newestYear = groupByYear(items)[0]

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <JsonLd data={personJsonLd} />

      {/* Identity: portrait beside the bio, the largest thing on the page. */}
      <section className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
        <Image
          src={site.avatar}
          alt={`Foto ${site.personalName || site.name}`}
          width={200}
          height={200}
          priority
          className="h-[140px] w-[140px] shrink-0 rounded-sm border border-rule object-cover sm:h-[200px] sm:w-[200px]"
        />

        <div className="min-w-0 flex-1">
          <h1 className="max-w-[22ch] text-3xl leading-tight tracking-tight sm:text-[40px]">
            Puisi, cerita, ulasan buku. Penulis, <em>programmer</em>, dari{' '}
            <strong className="font-semibold">{site.city}</strong>.
          </h1>

          <div className="mt-6 max-w-prose-measure space-y-3.5 text-lg leading-8">
            <p>
              Saya menulis puisi dan cerita pendek, sedang menggarap novel, dan
              menuliskan ulasan buku-buku yang saya baca. Sudah {site.yearsWriting}{' '}
              tahun ini, dari {site.city}.
            </p>
            {site.detail ? <p>{site.detail}</p> : null}
            <p className="text-muted">
              Sehari-hari saya membangun perangkat lunak. Menulis yang membuat
              sisanya masuk akal.
            </p>
          </div>
        </div>
      </section>

      {/* "Tanya apa saja" — a row here, not the sidebar it used to be. */}
      <AskMe className="mt-12" layout="row" />

      {products.length > 0 ? (
        <section className="mt-16">
          <SectionHeading href="/toko" action="Semua produk →">
            Yang saya jual
          </SectionHeading>
          <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-muted">
            Beberapa hal yang sudah selesai saya kerjakan dan bisa dibawa pulang.
            Unduhan langsung setelah bayar.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Writing, with the running state of things alongside it. */}
      <div className="mt-16 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
        <section className="min-w-0 lg:flex-1">
          <SectionHeading
            {...(newestYear
              ? {
                  href: '/tulisan',
                  action: `Arsip ${newestYear.year} (${newestYear.items.length}) →`,
                }
              : {})}
          >
            Tulisan terbaru
          </SectionHeading>

          {latest.length === 0 ? (
            <p className="mt-6 text-muted">Belum ada tulisan.</p>
          ) : (
            <StreamList items={latest} className="mt-2" />
          )}
        </section>

        <div className="flex flex-col gap-4 lg:w-[280px] lg:shrink-0">
          <NovelProgress />
          <SekarangCard />
        </div>
      </div>
    </div>
  )
}
