/**
 * Medium posts, read from the account's RSS feed (`medium` in content/site.md).
 *
 * Medium is the source of truth: publish there and the homepage picks the
 * post up on its next revalidation, with no commit here. The feed only ever
 * carries the newest 10 posts, so older ones drop off the site as new ones
 * arrive.
 */

export type Side = 'angel' | 'demon'

export type MediumPost = {
  title: string
  /** Canonical post URL, with Medium's `?source=rss…` tracking stripped. */
  href: string
  /** ISO date, `YYYY-MM-DD`. */
  date: string
  excerpt: string
  tags: string[]
  side: Side
}

/*
 * Technical posts lean Demon; everything else (learning, parenting, the human
 * stuff) leans Angel. Matched against the tags AND the title's words, because
 * Medium posts can go out with no tags at all. A prefix match, so
 * `software-design` and `systems` need no entry of their own.
 */
const DEMON_WORDS = ['software', 'java', 'system', 'solid', 'interface', 'abstract', 'aws', 'architecture']

export function sideFor(tags: string[], title = ''): Side {
  const words = [...tags, ...title.toLowerCase().split(/[^a-z0-9-]+/)]
  return words.some((word) => DEMON_WORDS.some((d) => word.startsWith(d))) ? 'demon' : 'angel'
}

const ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(n) ? String.fromCodePoint(n) : whole
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })
}

/** The text inside `<tag>…</tag>`, unwrapped from CDATA if it is wrapped. */
function field(item: string, tag: string): string | undefined {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))
  if (!match) return undefined
  const cdata = match[1].match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
  return cdata ? cdata[1] : decode(match[1].trim())
}

/** First paragraphs of the post as plain text, cut at a word near `max`. */
export function excerpt(html: string, max = 220): string {
  // Captions, quotes and code are not the author's prose, and make a bad
  // first line.
  const prose = html.replace(/<(figure|pre|blockquote|h[1-6])[\s\S]*?<\/\1>/gi, ' ')
  const text = decode(prose.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:–—-]+$/, '')}…`
}

/*
 * ponytail: a regex reader for Medium's own feed shape, not a general XML
 * parser. If Medium changes the feed format, swap in fast-xml-parser.
 */
export function parseFeed(xml: string): MediumPost[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  return items.flatMap((item) => {
    const title = field(item, 'title')
    const link = field(item, 'link')
    const pubDate = field(item, 'pubDate')
    if (!title || !link || !pubDate || Number.isNaN(Date.parse(pubDate))) return []

    const tags = [...item.matchAll(/<category><!\[CDATA\[([\s\S]*?)\]\]><\/category>/g)].map((m) => m[1])
    const url = new URL(link)
    url.search = ''

    return [{
      title: decode(title),
      href: url.toString(),
      date: new Date(pubDate).toISOString().slice(0, 10),
      excerpt: excerpt(field(item, 'content:encoded') ?? field(item, 'description') ?? ''),
      tags,
      side: sideFor(tags, title),
    }]
  })
}

/**
 * Fetched at build, then re-fetched at most once an hour (ISR). Any failure
 * returns no posts, and the homepage section renders nothing, rather than a
 * Medium outage breaking the build or the page.
 */
export async function loadMediumPosts(feed: string | undefined): Promise<MediumPost[]> {
  if (!feed) return []
  try {
    const res = await fetch(feed, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    return parseFeed(await res.text())
  } catch {
    return []
  }
}
