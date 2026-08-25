import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { loadPoems, loadPoem } from '@/lib/content/load'

export async function generateStaticParams() {
  const poems = await loadPoems()
  return poems.map((poem) => ({ slug: poem.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const poem = await loadPoem(slug)
  if (!poem) return {}
  return { title: `${poem.title} — dsapoetra` }
}

export default async function PoemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const poem = await loadPoem(slug)

  if (!poem) notFound()

  return (
    <article className="mx-auto max-w-verse-measure px-6 py-24">
      <h1 className="mb-10 text-2xl leading-snug">{poem.title}</h1>
      <div className="whitespace-pre-wrap text-lg leading-9">{poem.body}</div>
    </article>
  )
}
