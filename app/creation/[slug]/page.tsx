import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from '@/components/markdown'
import { loadCaseStudies, loadCaseStudy } from '@/lib/content'

export async function generateStaticParams() {
  const studies = await loadCaseStudies()
  return studies.map((study) => ({ slug: study.slug }))
}

/*
 * The set of case studies is fixed at build time, because it is a set of
 * files. Anything else under /creation/ is a typo, and should 404 immediately
 * rather than be rendered on demand and then 404 anyway.
 */
export const dynamicParams = false

export async function generateMetadata({
  params,
}: PageProps<'/creation/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const study = await loadCaseStudy(slug)
  if (!study) return {}

  return {
    title: study.title,
    description: study.summary,
    openGraph: {
      type: 'article',
      title: study.title,
      description: study.summary,
      publishedTime: study.date,
    },
  }
}

export default async function CaseStudyPage({
  params,
}: PageProps<'/creation/[slug]'>) {
  const { slug } = await params
  const study = await loadCaseStudy(slug)
  if (!study) notFound()

  const context = Object.entries(study.context)

  return (
    <main className="article wrap wrap--read">
      <div className="article__head">
        <Link href="/creation" className="back-link">
          ← Creation / Case studies
        </Link>
        <h1 className="page-title">{study.title}</h1>
        <div className="article__meta">
          <time dateTime={study.date}>{study.date}</time>
          <span>{study.minutes} min read</span>
        </div>
      </div>

      {context.length > 0 && (
        <dl className="context">
          {context.map(([term, description]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="prose">
        <Markdown source={study.body} />
      </div>

      {study.reflection && (
        <section className="reflection">
          <h2>What I&rsquo;d do differently</h2>
          <div className="prose">
            <Markdown source={study.reflection} />
          </div>
        </section>
      )}
    </main>
  )
}
