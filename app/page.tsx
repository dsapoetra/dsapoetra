import Link from 'next/link'
import SideCard from '@/components/side-card'
import { loadHome, loadSite } from '@/lib/content'
import { longDate } from '@/lib/content/dates'
import { loadMediumPosts } from '@/lib/medium'

// Re-read the Medium feed at most once an hour, so a new post appears without
// a deploy. Must be a literal: Next reads it statically.
export const revalidate = 3600

export default async function HomePage() {
  const [home, site] = await Promise.all([loadHome(), loadSite()])
  const posts = await loadMediumPosts(site.medium)

  return (
    <main className="home">
      {/*
        The name comes first in the DOM so a screen reader meets it first; the
        grid places it on the seam between the two halves. The writing life is
        the Angel half, the working life the Demon half.
      */}
      <section className="hero" aria-labelledby="hero-name">
        <div className="hero__seam-text">
          <h1 id="hero-name" className="hero__name">
            {site.name}
          </h1>
          {home.tagline && <p className="hero__tagline">{home.tagline}</p>}
        </div>
        <p className="hero__angel">{home.leadSerif}</p>
        <p className="hero__demon">{home.lead}</p>
      </section>

      {posts.length > 0 && site.medium && (
        <section className="home__posts wrap wrap--home" aria-labelledby="posts-heading">
          <h2 id="posts-heading" className="label">
            On Medium
          </h2>
          <div className="side-cards">
            {posts.map((post) => (
              <SideCard
                key={post.href}
                side={post.side}
                title={post.title}
                meta={longDate(post.date)}
                body={post.excerpt}
                href={post.href}
                cta="Read on Medium"
              />
            ))}
          </div>
          <a
            className="home__posts-all"
            href={site.medium.replace('/feed/', '/')}
            target="_blank"
            rel="noopener"
          >
            Everything on Medium <span aria-hidden="true">↗</span>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </section>
      )}

      <div className="home__wings wrap wrap--home">
        {home.cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="wing"
          >
            <span className="wing__blurb">{card.blurb}</span>
            <span className="wing__foot">
              <span className="wing__name">{card.label}</span>
              <span className="wing__arrow" aria-hidden="true">
                →
              </span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
