import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { longDate } from '@/lib/content/dates'
import { loadPoem, loadPoems } from '@/lib/content'

export async function generateStaticParams() {
  const poems = await loadPoems()
  return poems.map((poem) => ({ slug: poem.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: PageProps<'/poems/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const poem = await loadPoem(slug)
  if (!poem) return {}

  return {
    title: poem.title,
    openGraph: {
      type: 'article',
      title: poem.title,
      publishedTime: poem.date,
    },
  }
}

export default async function PoemPage({ params }: PageProps<'/poems/[slug]'>) {
  const { slug } = await params
  const poem = await loadPoem(slug)
  if (!poem) notFound()

  return (
    <main className="poem-page wrap wrap--poem" lang={poem.lang}>
      <div className="poem-page__head">
        <h1 className="piece-title">{poem.title}</h1>
        <span className="piece-date">
          <time dateTime={poem.date}>{longDate(poem.date)}</time>
          {poem.lang === 'id' && ' · Bahasa Indonesia'}
        </span>
      </div>

      {/*
        A poem never goes through the markdown renderer. Its line and stanza
        breaks are the work itself, and markdown would collapse single breaks
        into spaces and turn a stanza into a paragraph. `pre-line` keeps the
        file exactly as the author typed it.
      */}
      <div className={`poem${poem.align === 'center' ? ' poem--center' : ''}`}>
        {poem.body}
      </div>
    </main>
  )
}
