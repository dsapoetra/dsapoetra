import { loadLatest } from '@/lib/content/latest'
import { renderFeed } from '@/lib/rss'
import { site } from '@/lib/site'

export const dynamic = 'force-static'

export async function GET() {
  const items = await loadLatest(50)

  const xml = renderFeed({
    title: site.name,
    description: 'Puisi, cerita pendek, dan ulasan buku.',
    feedUrl: `${site.url}/rss.xml`,
    siteUrl: site.url,
    items: items.map((item) => ({
      title: item.title,
      url: `${site.url}${item.href}`,
      date: item.date,
      description: item.blurb,
    })),
  })

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
