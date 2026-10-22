import { describe, expect, it } from 'vitest'
import { excerpt, parseFeed, sideFor } from './medium'

/* Trimmed from the real feed at medium.com/feed/@dsapoetra. */
const FEED = `<?xml version="1.0" encoding="UTF-8"?><rss><channel>
<title><![CDATA[Stories by Dimas Saputra on Medium]]></title>
<item>
  <title><![CDATA[SOLID Principles, The “S” part]]></title>
  <link>https://medium.com/@dsapoetra/solid-s-123?source=rss-b58ad7283728------2</link>
  <category><![CDATA[software-engineering]]></category>
  <category><![CDATA[solid-principles]]></category>
  <pubDate>Sat, 09 May 2026 11:09:14 GMT</pubDate>
  <content:encoded><![CDATA[<h3>Heading</h3><p>Hi folks! Been a while&#8230;</p><figure><img src="x.png"/><figcaption>caption</figcaption></figure><p>Second &amp; last.</p>]]></content:encoded>
</item>
<item>
  <title><![CDATA[Learning how to learn]]></title>
  <link>https://medium.com/@dsapoetra/learning-456?source=rss</link>
  <category><![CDATA[learning]]></category>
  <pubDate>Tue, 16 Dec 2025 00:53:00 GMT</pubDate>
  <content:encoded><![CDATA[<p>Focus and diffuse.</p>]]></content:encoded>
</item>
<item>
  <title><![CDATA[Broken item with no date]]></title>
  <link>https://medium.com/@dsapoetra/broken</link>
</item>
</channel></rss>`

describe('parseFeed', () => {
  const posts = parseFeed(FEED)

  it('reads every complete item and skips broken ones', () => {
    expect(posts.map((p) => p.title)).toEqual(['SOLID Principles, The “S” part', 'Learning how to learn'])
  })

  it('strips the tracking query from links', () => {
    expect(posts[0].href).toBe('https://medium.com/@dsapoetra/solid-s-123')
  })

  it('turns pubDate into an ISO day', () => {
    expect(posts[1].date).toBe('2025-12-16')
  })

  it('builds a plain-text excerpt without headings or captions', () => {
    expect(posts[0].excerpt).toBe('Hi folks! Been a while… Second & last.')
  })

  it('leans technical posts Demon and the rest Angel', () => {
    expect(posts.map((p) => p.side)).toEqual(['demon', 'angel'])
  })

  it('returns nothing for something that is not a feed', () => {
    expect(parseFeed('<html>Cloudflare says no</html>')).toEqual([])
  })
})

describe('excerpt', () => {
  it('cuts long text at a word and adds an ellipsis', () => {
    const out = excerpt(`<p>${'word '.repeat(100)}</p>`, 30)
    expect(out).toBe('word word word word word word…')
  })
})

describe('sideFor', () => {
  it('matches tag prefixes', () => {
    expect(sideFor(['software-design'])).toBe('demon')
    expect(sideFor(['parenting', 'technology'])).toBe('angel')
  })

  it('falls back to the title when a post has no tags', () => {
    expect(sideFor([], 'Building a Self-Hosted AWS Cost Tracker')).toBe('demon')
    expect(sideFor([], 'Learning how to learn')).toBe('angel')
  })
})
