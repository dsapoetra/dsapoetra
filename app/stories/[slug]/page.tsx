import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from '@/components/markdown'
import { longDate, meta } from '@/lib/content/dates'
import { loadStories, loadStory, neighbours } from '@/lib/content'

export async function generateStaticParams() {
  const stories = await loadStories()
  return stories.map((story) => ({ slug: story.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: PageProps<'/stories/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const story = await loadStory(slug)
  if (!story) return {}

  return {
    title: story.title,
    openGraph: {
      type: 'article',
      title: story.title,
      publishedTime: story.date,
    },
  }
}

export default async function StoryPage({
  params,
}: PageProps<'/stories/[slug]'>) {
  const { slug } = await params
  const [story, stories] = await Promise.all([loadStory(slug), loadStories()])
  if (!story) notFound()

  const { previous, next } = neighbours(stories, slug)

  return (
    <main
      className={`story wrap wrap--story${story.dropcap ? ' story--dropcap' : ''}`}
      lang={story.lang}
    >
      <div className="story__head">
        <h1 className="story__title">{story.title}</h1>
        <span className="piece-date">
          {meta(longDate(story.date), `${story.minutes} min read`)}
        </span>
      </div>

      <div className="story__body prose">
        <Markdown source={story.body} />
      </div>

      {/*
        The list is newest first, so the entry AFTER this one in the array is
        the older piece. `previous` therefore means previously published, which
        is the one further down the list, and reversing these two is the easy
        mistake to make here.
      */}
      <nav className="pager" aria-label="More stories">
        {previous ? (
          <Link href={`/stories/${previous.slug}`}>
            <span className="pager__label">Previous</span>
            <span>{previous.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/stories/${next.slug}`}>
            <span className="pager__label">Next</span>
            <span>{next.title}</span>
          </Link>
        ) : (
          <Link href="/writing">
            <span className="pager__label">Next</span>
            <span>All stories</span>
          </Link>
        )}
      </nav>
    </main>
  )
}
