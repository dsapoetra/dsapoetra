import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from '@/components/markdown'
import { isoDate } from '@/lib/content/dates'
import { loadNote, loadNotes } from '@/lib/content'

export async function generateStaticParams() {
  const notes = await loadNotes()
  return notes.map((note) => ({ slug: note.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: PageProps<'/notes/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const note = await loadNote(slug)
  if (!note) return {}

  return {
    title: note.title,
    description: note.summary,
    openGraph: {
      type: 'article',
      title: note.title,
      description: note.summary,
      publishedTime: note.date,
    },
  }
}

export default async function NotePage({ params }: PageProps<'/notes/[slug]'>) {
  const { slug } = await params
  const note = await loadNote(slug)
  if (!note) notFound()

  return (
    <main className="article wrap wrap--read">
      <div className="article__head">
        <Link href="/work" className="back-link">
          ← Work / Technical notes
        </Link>
        <h1 className="page-title">{note.title}</h1>
        <div className="article__meta">
          <time dateTime={note.date}>{isoDate(note.date)}</time>
          <span>{note.minutes} min read</span>
          <span>{note.category}</span>
        </div>
      </div>

      <div className="prose">
        <Markdown source={note.body} />
      </div>
    </main>
  )
}
