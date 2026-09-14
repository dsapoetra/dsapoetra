export default function InstagramReviewCard({
  url,
  cover,
  label = 'WATCH THE REVIEW ↗',
  title,
}: {
  url: string
  cover?: string
  label?: string
  title?: string
}) {
  return (
    <div className="review-card-wrapper">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="review-card"
        aria-label={title ? `Watch review for ${title} on Instagram` : label}
      >
        {cover ? (
          <div className="review-card__frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt={title ? `Cover review for ${title}` : 'Instagram review thumbnail'}
              className="review-card__img"
              loading="lazy"
            />
          </div>
        ) : null}
        <span className="review-card__btn">{label}</span>
      </a>
    </div>
  )
}
