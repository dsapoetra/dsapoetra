import Link from 'next/link'
import type { Metadata } from 'next'
import { loadPoems } from '@/lib/content/load'

export const metadata: Metadata = {
  title: 'Puisi — dsapoetra',
  description: 'Kumpulan puisi.',
}

export default async function PuisiIndex() {
  const poems = await loadPoems()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <h1 className="inline-block bg-highlight px-2 py-1 font-mono text-xs uppercase tracking-widest text-on-highlight">Puisi</h1>

      {poems.length === 0 ? (
        <p className="mt-8 text-muted">Belum ada puisi di sini.</p>
      ) : (
        <ul className="mt-8 divide-y divide-rule">
          {poems.map((poem) => (
            <li key={poem.slug}>
              <Link
                href={`/puisi/${poem.slug}`}
                className="block py-4 text-xl transition-colors hover:text-accent focus-visible:text-accent"
              >
                {poem.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
