import Link from 'next/link'
import type { Metadata } from 'next'
import { loadReviews } from '@/lib/content/load'

export const metadata: Metadata = {
  title: 'Ulasan — dsapoetra',
  description: 'Catatan tentang buku-buku yang saya baca.',
}

export default async function UlasanIndex() {
  const reviews = await loadReviews()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <h1 className="font-mono text-xs uppercase tracking-widest text-muted">Ulasan</h1>

      {reviews.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada ulasan di sini.</p>
      ) : (
        <ul className="mt-8 space-y-10">
          {reviews.map((review) => (
            <li key={review.slug}>
              <Link href={`/ulasan/${review.slug}`} className="group flex gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={review.cover}
                  alt={`Sampul ${review.book.title}`}
                  width={80}
                  height={120}
                  className="h-[120px] w-[80px] shrink-0 rounded-sm border border-rule object-cover"
                />
                <div>
                  <h2 className="text-xl leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent">
                    {review.title}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {review.book.title} · {review.book.author}
                  </p>
                  <p className="mt-2 leading-7 text-muted">{review.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
