import SectionLabel from '@/components/section-label'
import { formatDateId } from '@/lib/format'
import { loadNovel } from '@/lib/content/novel'

/**
 * The novel strip: a sentence, then one square per chapter.
 *
 * The squares are decoration — the sentence above them already says "bab 3 dari
 * 24 selesai" — so the grid is hidden from assistive tech rather than read out
 * as twenty-four anonymous elements.
 *
 * Renders nothing when `content/novel.mdx` is absent; deleting that file is how
 * the block is switched off.
 */
export default async function NovelProgress({ className }: { className?: string }) {
  const novel = await loadNovel()
  if (!novel) return null

  return (
    <section
      className={`rounded-sm border border-rule bg-card p-5${className ? ` ${className}` : ''}`}
    >
      <SectionLabel as="h2">Novel · {novel.status}</SectionLabel>

      <p className="mt-3 text-lg leading-relaxed">
        Bab {novel.chaptersDone} dari {novel.chaptersTotal} selesai.
      </p>

      {novel.chaptersTotal > 0 ? (
        <div aria-hidden="true" className="mt-3.5 flex flex-wrap gap-[3px]">
          {Array.from({ length: novel.chaptersTotal }, (_, index) => (
            <span
              key={index}
              className={
                index < novel.chaptersDone
                  ? 'h-[11px] w-[11px] bg-highlight'
                  : 'h-[11px] w-[11px] border border-rule'
              }
            />
          ))}
        </div>
      ) : null}

      {novel.note ? (
        <p className="mt-3 leading-relaxed text-muted">{novel.note}</p>
      ) : null}

      <p className="mt-3 font-mono text-[11px] text-muted">
        Diperbarui <time dateTime={novel.updated}>{formatDateId(novel.updated)}</time>
      </p>
    </section>
  )
}
