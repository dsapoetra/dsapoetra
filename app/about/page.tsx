import type { Metadata } from 'next'
import Image from 'next/image'
import Markdown from '@/components/markdown'
import { loadAbout } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const about = await loadAbout()
  return { title: about.title }
}

export default async function AboutPage() {
  const about = await loadAbout()

  return (
    <main className="page wrap wrap--read">
      <div className="about__head">
        {/*
          No photo yet renders the dashed placeholder from board 1k rather than
          collapsing the layout. It holds the space it will occupy and states
          what is missing, which is the honest version of an empty slot.
        */}
        {about.photo ? (
          <Image
            className="about__photo"
            src={about.photo}
            alt={about.photoAlt ?? ''}
            width={96}
            height={120}
          />
        ) : (
          <div className="about__photo about__photo--empty" aria-hidden="true">
            photo
          </div>
        )}
        <h1 className="page-title">{about.title}</h1>
      </div>

      <div className="prose">
        <Markdown source={about.body} />
      </div>
    </main>
  )
}
