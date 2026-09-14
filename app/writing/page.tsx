import type { Metadata } from 'next'
import PieceList, { type Piece } from '@/components/piece-list'
import { longDate, meta, shortDate } from '@/lib/content/dates'
import {
  loadFeaturedPoem,
  loadPoems,
  loadReadingNotes,
  loadStories,
  loadWritingPage,
} from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadWritingPage()
  return { title: page.title, description: page.note }
}

/** `· ID` on an Indonesian piece, nothing on an English one. */
function langTag(lang: string): string | false {
  return lang === 'id' && 'ID'
}

export default async function WritingPage() {
  const [page, featured, poems, stories, reading] = await Promise.all([
    loadWritingPage(),
    loadFeaturedPoem(),
    loadPoems(),
    loadStories(),
    loadReadingNotes(),
  ])

  const storyPieces: Piece[] = stories.map((story) => ({
    href: `/stories/${story.slug}`,
    title: story.title,
    lang: story.lang,
    meta: meta(shortDate(story.date), `${story.minutes} min`, langTag(story.lang)),
  }))

  const poemPieces: Piece[] = poems.map((poem) => ({
    href: `/poems/${poem.slug}`,
    title: poem.title,
    lang: poem.lang,
    meta: meta(shortDate(poem.date), langTag(poem.lang)),
  }))

  const readingPieces: Piece[] = reading.map((note) => ({
    href: `/reading/${note.slug}`,
    title: note.title,
    lang: note.lang,
    meta: meta(shortDate(note.date), langTag(note.lang)),
  }))

  const hasAnything =
    featured !== null ||
    storyPieces.length > 0 ||
    poemPieces.length > 0 ||
    readingPieces.length > 0

  return (
    <main className="writing wrap wrap--writing">
      {featured && (
        <article className="featured" lang={featured.lang}>
          <div className="featured__head">
            <span className="label">
              {meta('Newest', 'Poem', longDate(featured.date))}
            </span>
            <h1 className="writing__title">{featured.title}</h1>
          </div>
          {/*
            The poem's own line breaks come straight out of the file. See the
            note on `.poem` in globals.css for why this is `pre-line` rather
            than markup: the breaks are the poem, and markdown would eat them.
          */}
          <div
            className={`poem${featured.align === 'center' ? ' poem--center' : ''}`}
          >
            {featured.body}
          </div>
        </article>
      )}

      {!featured && <h1 className="writing__title">{page.title}</h1>}

      {page.note && <p className="writing__note">{page.note}</p>}

      <PieceList label="Stories" pieces={storyPieces} />
      <PieceList label="Poems" pieces={poemPieces} />
      <PieceList label="Notes" pieces={readingPieces} />

      {!hasAnything && <p className="empty">Nothing published here yet.</p>}
    </main>
  )
}
