import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadReviews, loadReview } from '@/lib/content/load'
import { readingTimeMinutes } from '@/lib/content/reading-time'
import MdxContent from '@/components/mdx-content'
import VideoCard from '@/components/video-card'

export async function generateStaticParams() {
  const reviews = await loadReviews()
  return reviews.map((review) => ({ slug: review.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const review = await loadReview(slug)
  if (!review) return {}

  return {
    title: `${review.title} — dsapoetra`,
    description: review.excerpt,
    alternates: review.canonicalUrl ? { canonical: review.canonicalUrl } : undefined,
  }
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const review = await loadReview(slug)

  if (!review) notFound()

  return (
    <article className="mx-auto max-w-prose-measure px-6 py-20">
      <h1 className="text-3xl leading-tight">{review.title}</h1>

      <p className="mt-3 font-mono text-xs text-muted">
        {review.book.title} · {review.book.author}
      </p>
      <p className="mt-1 mb-12 font-mono text-xs text-muted">
        <time dateTime={review.date}>{review.date}</time>
        {' · '}
        {readingTimeMinutes(review.body)} menit baca
      </p>

      {review.videoUrl ? (
        <VideoCard url={review.videoUrl} bookTitle={review.book.title} />
      ) : null}

      <MdxContent source={review.body} />
    </article>
  )
}
