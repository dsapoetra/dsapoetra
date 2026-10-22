import type { Metadata } from 'next'
import Link from 'next/link'
import Markdown from '@/components/markdown'
import SideCard from '@/components/side-card'
import { isoDate } from '@/lib/content/dates'
import {
  loadCaseStudies,
  loadExperience,
  loadNotes,
  loadProjects,
  loadCreationPage,
} from '@/lib/content'

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadCreationPage()
  return { title: page.title, description: page.intro }
}

export default async function CreationPage() {
  /*
   * Four independent reads, so they run together rather than one after
   * another. Awaiting them in sequence would make the page as slow as the sum
   * of four directory walks for no reason: none of them needs the others.
   */
  const [page, experience, caseStudies, projects, notes] = await Promise.all([
    loadCreationPage(),
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

      {/*
        Case studies and projects share the homepage's side cards. Neither has
        a tag that says which side it is on, so they alternate.
      */}
      {caseStudies.length > 0 && (
        <section className="section">
          <h2 className="label">Case studies</h2>
          <div className="side-cards">
            {caseStudies.map((study, i) => (
              <SideCard
                key={study.slug}
                side={i % 2 ? 'demon' : 'angel'}
                title={study.title}
                meta={`${study.minutes} min read`}
                body={study.summary}
                href={`/creation/${study.slug}`}
                cta="Read the case study"
              />
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="section">
          <h2 className="label">Projects</h2>
          <div className="side-cards">
            {projects.map((project, i) => (
              <SideCard
                key={project.slug}
                side={i % 2 ? 'demon' : 'angel'}
                title={project.name}
                body={project.summary}
                tags={project.tags}
                href={project.link?.href}
                cta={project.link && `View on ${project.link.label}`}
              />
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
