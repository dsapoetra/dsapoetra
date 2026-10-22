import Link from 'next/link'
import { loadHome, loadSite } from '@/lib/content'

export default async function HomePage() {
  const [home, site] = await Promise.all([loadHome(), loadSite()])

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

      <div className="home__wings wrap wrap--home">
        {home.cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`wing wing--${card.wing}`}
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
