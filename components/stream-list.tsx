import Link from 'next/link'
import Image from 'next/image'
import { labelFor, type StreamItem } from '@/lib/content/latest'
import { formatDateId } from '@/lib/format'

/**
 * The mixed stream of poems, stories and reviews as a ruled list.
 *
 * Poems carry the accent on their kind line — they are the site's main output,
 * and the colour is what makes a page of otherwise identical rows scannable.
 * Reviews show their book cover; nothing else has artwork, so the thumbnail is
 * rendered per row rather than as a reserved column that sits empty most of the
 * time.
 */
export default function StreamList({
  items,
  className,
}: {
  items: StreamItem[]
  className?: string
}) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex gap-4 border-b border-rule py-4"
          >
            {item.cover ? (
              <Image
                src={item.cover}
                alt=""
                width={52}
                height={78}
                className="h-[78px] w-[52px] shrink-0 rounded-sm border border-rule object-cover"
              />
            ) : null}

            <span className="min-w-0">
              <span
                className={`font-mono text-[11px] uppercase tracking-widest ${
                  item.kind === 'puisi' ? 'text-accent' : 'text-muted'
                }`}
              >
                {labelFor(item.kind)}
                {' · '}
                <time dateTime={item.date}>{formatDateId(item.date)}</time>
              </span>
              <span className="mt-1 block text-xl leading-snug transition-colors group-hover:text-accent group-focus-visible:text-accent">
                {item.title}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
