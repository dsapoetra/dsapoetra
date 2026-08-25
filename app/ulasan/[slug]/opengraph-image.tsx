import { ImageResponse } from 'next/og'
import { loadReview, loadReviews } from '@/lib/content/load'
import { site } from '@/lib/site'

export const alt = 'Sampul ulasan buku di dsapoetra, menampilkan judul ulasan serta judul dan penulis buku.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateStaticParams() {
  const reviews = await loadReviews()
  return reviews.map((review) => ({ slug: review.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const review = await loadReview(slug)

  const heading = review ? review.title : 'Ulasan buku'
  const subheading = review ? `${review.book.title} · ${review.book.author}` : site.name

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: '#f8f5ef',
          color: '#151b26',
        }}
      >
        <div
          style={{
            display: 'flex',
            background: '#ff7a59',
            color: '#151b26',
            padding: '8px 20px',
            fontSize: 28,
            letterSpacing: 4,
            alignSelf: 'flex-start',
          }}
        >
          ULASAN
        </div>
        <div style={{ marginTop: 40, fontSize: 60, lineHeight: 1.15 }}>{heading}</div>
        <div style={{ marginTop: 32, fontSize: 30, color: '#5c6470' }}>{subheading}</div>
      </div>
    ),
    size
  )
}
