import { MDXRemote } from 'next-mdx-remote-client/rsc'
import InstagramReviewCard from './instagram-review-card'

/**
 * A figure inside an article body.
 *
 * With `src` it renders the image. Without one it renders the dashed
 * placeholder from board 1e, captioned with what the diagram is meant to show.
 * That is the point: an undrawn diagram stays visible as a hole in the piece
 * instead of quietly vanishing, so it gets drawn.
 *
 *     <Diagram caption="Proxy routing between the monolith and the services" />
 *     <Diagram src="/diagrams/routing.svg" caption="Proxy routing" />
 */
function Diagram({
  src,
  caption,
  alt,
}: {
  src?: string
  caption: string
  alt?: string
}) {
  if (!src) {
    return (
      <div className="diagram" role="img" aria-label={`Diagram: ${caption}`}>
        Diagram: {caption}
      </div>
    )
  }

  return (
    <figure className="diagram diagram--image">
      {/* Plain <img>: these are author-supplied files of unknown dimensions
          sitting in a fixed measure, and next/image buys nothing here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt ?? caption} />
    </figure>
  )
}

function InstagramReview({
  src,
  href,
  alt,
  label,
}: {
  src?: string
  href: string
  alt?: string
  label?: string
}) {
  return <InstagramReviewCard url={href} cover={src} label={label} title={alt} />
}

const components = { Diagram, InstagramReview, InstagramReviewCard }

/**
 * Renders a markdown body.
 *
 * Every element is styled by the `.prose` class on the wrapper rather than by
 * a components map, so the same markdown renders in the Work wing's sans and
 * the Writing wing's serif depending only on where it is placed. A components
 * map would hard-code one wing's type into the renderer.
 */
export default function Markdown({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />
}
