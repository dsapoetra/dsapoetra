import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from '@/components/markdown'
import InstagramReviewCard from '@/components/instagram-review-card'
import { longDate } from '@/lib/content/dates'
import { loadReadingNote, loadReadingNotes } from '@/lib/content'

export async function generateStaticParams() {
  const notes = await loadReadingNotes()
  return notes.map((note) => ({ slug: note.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: PageProps<'/reading/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const note = await loadReadingNote(slug)
  if (!note) return {}

  return {
    title: note.title,
    openGraph: {
      type: 'article',
      title: note.title,
      publishedTime: note.date,
    },
  }
}

/*
 * A reading note is set like a story, not like a case study: it belongs to the
 * Writing wing and is read the same way. It reuses the story measure and the
 * serif, and differs only in having no reading time and no pager.
 */
export default async function ReadingNotePage({
  params,
}: PageProps<'/reading/[slug]'>) {
  const { slug } = await params
  const note = await loadReadingNote(slug)
  if (!note) notFound()

  return (
    <main className="story wrap wrap--story" lang={note.lang}>
      <div className="story__head">
        <Link href="/writing" className="back-link">
          ← Writing / Notes
        </Link>
        <h1 className="story__title">{note.title}</h1>
        <span className="piece-date">
          <time dateTime={note.date}>{longDate(note.date)}</time>
        </span>
      </div>

      <div className="story__body prose">
        <Markdown source={note.body} />
        {note.instagramUrl ? (
          <InstagramReviewCard
            url={note.instagramUrl}
            cover={note.instagramCover}
            label={note.instagramLabel}
            title={note.title}
          />
        ) : null}
      </div>
    </main>
  )
}
