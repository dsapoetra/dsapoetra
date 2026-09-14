import type { Metadata } from 'next'
import Link from 'next/link'
import Markdown from '@/components/markdown'
import { isoDate } from '@/lib/content/dates'
import {
  loadCaseStudies,
  loadExperience,
  loadNotes,
  loadProjects,
  loadWorkPage,
} from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadWorkPage()
  return { title: page.title, description: page.intro }
}

export default async function WorkPage() {
  /*
   * Four independent reads, so they run together rather than one after
   * another. Awaiting them in sequence would make the page as slow as the sum
   * of four directory walks for no reason: none of them needs the others.
   */
  const [page, experience, caseStudies, projects, notes] = await Promise.all([
    loadWorkPage(),
    loadExperience(),
    loadCaseStudies(),
    loadProjects(),
    loadNotes(),
  ])

  return (
    <main className="work wrap wrap--work">
      <div className="work__intro">
        <h1 className="page-title">{page.title}</h1>
        <p>{page.intro}</p>
      </div>

      {experience.length > 0 && (
        <section className="section">
          <h2 className="label">Experience</h2>
          <div className="stack">
            {experience.map((role) => (
              <article key={role.slug} className="role">
                <div className="role__body">
                  <div className="role__head">
                    <strong className="role__company">{role.company}</strong>
                    <span className="role__title">{role.role}</span>
                  </div>
                  {role.summary && <p className="role__summary">{role.summary}</p>}
                  {role.body && (
                    <div className="prose">
                      <Markdown source={role.body} />
                    </div>
                  )}
                  {role.scope && <p className="role__scope">{role.scope}</p>}
                </div>
                <span className="role__period">{role.period}</span>
              </article>
            ))}
          </div>
        </section>
      )}

      {caseStudies.length > 0 && (
        <section className="section">
          <h2 className="label">Case studies</h2>
          <div className="cards">
            {caseStudies.map((study) => (
              <Link
                key={study.slug}
                href={`/work/${study.slug}`}
                className="card"
              >
                <span className="stack" style={{ gap: 8 }}>
                  <span className="card__title">{study.title}</span>
                  <span className="card__summary">{study.summary}</span>
                </span>
                <span className="mono">{study.minutes} min read</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="section">
          <h2 className="label">Projects</h2>
          <div className="stack">
            {projects.map((project) => (
              <article key={project.slug} className="project">
                {project.link ? (
                  <a href={project.link.href} className="project__name">
                    {project.name}
                  </a>
                ) : (
                  <span className="project__name">{project.name}</span>
                )}
                <div className="project__body">
                  <span>{project.summary}</span>
                  {project.tags.length > 0 && (
                    <span className="tags">
                      {project.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </span>
                  )}
                </div>
                {project.link && (
                  <a href={project.link.href} className="project__link">
                    {project.link.label} →
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {notes.length > 0 && (
        <section className="section">
          <h2 className="label">Technical notes</h2>
          <div className="stack">
            {notes.map((note) => (
              <Link key={note.slug} href={`/notes/${note.slug}`} className="note-row">
                <span className="note-row__date">{isoDate(note.date)}</span>
                <span>{note.title}</span>
                <span className="note-row__category">{note.category}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
