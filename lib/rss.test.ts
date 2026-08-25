import { describe, it, expect } from 'vitest'
import { renderFeed } from '@/lib/rss'

const base = {
  title: 'dsapoetra',
  description: 'Tulisan terbaru.',
  feedUrl: 'https://dsapoetra.com/rss.xml',
  siteUrl: 'https://dsapoetra.com',
}

describe('renderFeed', () => {
  it('produces a channel with the given metadata', () => {
    const xml = renderFeed({ ...base, items: [] })
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>dsapoetra</title>')
    expect(xml).toContain('<link>https://dsapoetra.com</link>')
  })

  it('escapes XML-significant characters in titles', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'Ruang & Waktu <catatan>', url: 'https://dsapoetra.com/a', date: '2026-08-01' }],
    })
    expect(xml).toContain('Ruang &amp; Waktu &lt;catatan&gt;')
    expect(xml).not.toContain('Ruang & Waktu <catatan>')
  })

  it('escapes descriptions too', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'A', url: 'https://dsapoetra.com/a', date: '2026-08-01', description: 'satu & dua' }],
    })
    expect(xml).toContain('satu &amp; dua')
  })

  it('emits an RFC-822 pubDate', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'A', url: 'https://dsapoetra.com/a', date: '2026-08-01' }],
    })
    expect(xml).toMatch(/<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/)
  })

  it('uses the url as a stable guid', () => {
    const xml = renderFeed({
      ...base,
      items: [{ title: 'A', url: 'https://dsapoetra.com/a', date: '2026-08-01' }],
    })
    expect(xml).toContain('<guid isPermaLink="true">https://dsapoetra.com/a</guid>')
  })
})
