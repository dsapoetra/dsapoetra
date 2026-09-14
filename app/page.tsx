import Link from 'next/link'
import { loadHome } from '@/lib/content'

export default async function HomePage() {
  const home = await loadHome()

  return (
    <main className="home wrap wrap--home">
      {/*
        The two sentences are one paragraph and two faces. The <em> is not
        emphasis in the usual sense and the stylesheet strips its italic; it is
        the hook the serif hangs on, and using a real element keeps the
        sentence a single readable run for a screen reader.
      */}
      <p className="home__lead">
        {home.lead} <em>{home.leadSerif}</em>
      </p>

      <div className="home__wings">
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
