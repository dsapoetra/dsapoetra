import type { Metadata } from 'next'
import { loadSekarang } from '@/lib/content/sekarang'
import MdxContent from '@/components/mdx-content'
import SectionLabel from '@/components/section-label'

export const metadata: Metadata = {
  title: 'Sekarang — dsapoetra',
  description: 'Apa yang sedang saya tulis, baca, dan kerjakan.',
}

export default async function SekarangPage() {
  const sekarang = await loadSekarang()

  return (
    <div className="mx-auto max-w-prose-measure px-6 py-16">
      <SectionLabel>Sekarang</SectionLabel>

      {sekarang === null ? (
        <p className="mt-8 text-muted">Belum diisi.</p>
      ) : (
        <>
          <p className="mt-2 mb-10 font-mono text-xs text-muted">
            Diperbarui <time dateTime={sekarang.updated}>{sekarang.updated}</time>
          </p>
          <MdxContent source={sekarang.body} />
        </>
      )}
    </div>
  )
}
