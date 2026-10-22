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

type Role = Awaited<ReturnType<typeof loadExperience>>[number]

/** One labelled list of roles. Renders nothing when the list is empty. */
function RoleSection({ label, roles }: { label: string; roles: Role[] }) {
  if (roles.length === 0) return null

  return (
    <section className="creation__section">
      <h2 className="label">{label}</h2>
      <div className="stack">
        {roles.map((role) => (
          <article key={role.slug} className="role">
            <span className="role__period">{role.period}</span>
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
          </article>
        ))}
      </div>
    </section>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await loadCreationPage()
  return { title: page.title, description: page.intro }
}

export default async function CreationPage() {
  /*
   * Five independent reads, so they run together rather than one after
   * another. None of them needs the others.
   */
  const [page, experience, caseStudies, projects, notes] = await Promise.all([
    loadCreationPage(),
    loadExperience(),
    loadCaseStudies(),
    loadProjects(),
    loadNotes(),
  ])

  // A role is Leading if its title says so; everything else is Building.
  const isLeading = (role: Role) => /manager|lead/i.test(role.role)
  const leading = experience.filter(isLeading)
  const building = experience.filter((role) => !isLeading(role))

  return (
    <main className="creation wrap wrap--creation">
      <div className="creation__intro">
        <h1 className="page-title">{page.title}</h1>
        <p>{page.intro}</p>
      </div>

      {/*
        The page is balanced across the seam: Leading on the Angel side (the
        manager and lead roles), Building on the Demon side (the engineering
        roles, then case studies, projects and notes). Grouped this way the
        two halves carry about the same amount of content, so neither runs
        long. Each half carries its side's palette whatever the page theme,
        the same way the homepage hero does.
      */}
      <div className="creation__balance">
        <div className="creation__side side-angel">
          <RoleSection label="Leading" roles={leading} />
        </div>

        <div className="creation__side side-demon">
          <RoleSection label="Building" roles={building} />

          {caseStudies.length > 0 && (
            <section className="creation__section">
              <h2 className="label">Case studies</h2>
              <div className="creation__cards">
                {caseStudies.map((study) => (
                  <SideCard
                    key={study.slug}
                    side="demon"
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
            <section className="creation__section">
              <h2 className="label">Projects</h2>
              <div className="creation__cards">
                {projects.map((project) => (
                  <SideCard
                    key={project.slug}
                    side="demon"
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
            <section className="creation__section">
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
        </div>
      </div>
    </main>
  )
}
