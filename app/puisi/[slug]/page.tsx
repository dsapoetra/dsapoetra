import { Fragment } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadPoems, loadPoem } from '@/lib/content/load'

// A poem's line structure carries meaning and must reach the accessibility
// tree, not just the CSS box model — so it is split into real markup
// (paragraphs per stanza, <br /> per line) rather than relying on
// `white-space: pre-wrap` alone. This never goes through MDX; see the poem
// page's role as the deliberately separate, non-markdown rendering path.
function splitIntoStanzas(body: string): string[][] {
  const normalized = body.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  return normalized.split(/\n{2,}/).map((stanza) => stanza.split('\n'))
}

export async function generateStaticParams() {
  const poems = await loadPoems()
  return poems.map((poem) => ({ slug: poem.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const poem = await loadPoem(slug)
  if (!poem) return {}
  return { title: `${poem.title} — dsapoetra` }
}

export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const poem = await loadPoem(slug)

  if (!poem) notFound()

  const stanzas = splitIntoStanzas(poem.body)

  return (
    <article className="mx-auto max-w-verse-measure px-6 py-24">
      <h1 className="mb-10 text-2xl leading-snug">{poem.title}</h1>
      <div className="text-lg leading-9">
        {stanzas.map((lines, stanzaIndex) => (
          <p key={stanzaIndex} className="whitespace-pre-wrap mb-9 last:mb-0">
            {lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </article>
  )
}
