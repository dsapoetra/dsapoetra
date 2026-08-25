import Link from 'next/link'
import type { Metadata } from 'next'
import { loadStories } from '@/lib/content/load'
import { readingTimeMinutes } from '@/lib/content/reading-time'
import SectionLabel from '@/components/section-label'

export const metadata: Metadata = {
  title: 'Cerita — dsapoetra',
  description: 'Kumpulan cerita pendek.',
}

export default async function CeritaIndex() {
  const stories = await loadStories()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <SectionLabel>Cerita</SectionLabel>

      {stories.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada cerita di sini.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {stories.map((story) => (
            <li key={story.slug}>
              <Link href={`/cerita/${story.slug}`} className="group block">
                <h2 className="text-xl transition-colors group-hover:text-accent group-focus-visible:text-accent">
                  {story.title}
                </h2>
                <p className="mt-1 leading-7 text-muted">{story.excerpt}</p>
                <p className="mt-2 font-mono text-xs text-muted">
                  {readingTimeMinutes(story.body)} menit baca
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
