import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadStories, loadStory } from '@/lib/content/load'
import { readingTimeMinutes } from '@/lib/content/reading-time'
import MdxContent from '@/components/mdx-content'

export async function generateStaticParams() {
  const stories = await loadStories()
  return stories.map((story) => ({ slug: story.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const story = await loadStory(slug)
  if (!story) return {}
  return { title: `${story.title} — dsapoetra`, description: story.excerpt }
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await loadStory(slug)

  if (!story) notFound()

  return (
    <article className="mx-auto max-w-prose-measure px-6 py-20">
      <h1 className="text-3xl leading-tight">{story.title}</h1>
      <p className="mt-3 mb-12 font-mono text-xs text-muted">
        <time dateTime={story.date}>{story.date}</time>
        {' · '}
        {readingTimeMinutes(story.body)} menit baca
      </p>
      <MdxContent source={story.body} />
    </article>
  )
}
