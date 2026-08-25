import { loadReviews } from '@/lib/content/load'
import { renderFeed } from '@/lib/rss'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

export async function GET() {
  const reviews = await loadReviews()

  const xml = renderFeed({
    title: `${site.name} — Ulasan`,
    description: 'Ulasan buku.',
    feedUrl: `${site.url}/ulasan/rss.xml`,
    siteUrl: site.url,
    items: reviews.map((review) => ({
      title: review.title,
      url: `${site.url}/ulasan/${review.slug}`,
      date: review.date,
      description: review.excerpt,
    })),
  })

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
