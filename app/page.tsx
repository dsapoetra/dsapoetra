import Link from 'next/link'
import type { Metadata } from 'next'
import { loadLatest, labelFor } from '@/lib/content/latest'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'dsapoetra',
  description: 'Puisi, cerita pendek, dan ulasan buku dari Jakarta.',
}

export default async function Home() {
  const items = await loadLatest(10)

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-20">
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

      <h2 className="mt-16 inline-block bg-highlight px-2 py-1 font-mono text-xs uppercase tracking-widest text-on-highlight">
        Terbaru
      </h2>

      {items.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada tulisan.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="group block">
                <p className="inline-block bg-highlight px-2 py-1 font-mono text-xs uppercase tracking-widest text-on-highlight">
                  {labelFor(item.kind)}
                  {' · '}
                  <time dateTime={item.date}>{item.date}</time>
                </p>
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
  )
}
