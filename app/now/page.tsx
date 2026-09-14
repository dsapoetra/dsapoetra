import type { Metadata } from 'next'
import Markdown from '@/components/markdown'
import { isoDate } from '@/lib/content/dates'
import { loadNow } from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const now = await loadNow()
  return { title: now.title, description: now.lead }
}

export default async function NowPage() {
  const now = await loadNow()

  return (
    <main className="page now wrap wrap--read">
      <div className="now__head">
        <h1 className="page-title">{now.title}</h1>
        <span className="mono">
          Updated <time dateTime={now.updated}>{isoDate(now.updated)}</time>
        </span>
      </div>

      <p className="now__lead">{now.lead}</p>

      {/* Anything below the big sentence is optional detail, in normal prose. */}
      {now.body && (
        <div className="prose">
          <Markdown source={now.body} />
        </div>
      )}

      {now.footnote && <p className="now__footnote">{now.footnote}</p>}
    </main>
  )
}
