import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

export const alt = 'dsapoetra — puisi, cerita, dan ulasan buku'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
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
          DSAPOETRA
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 40, fontSize: 64, lineHeight: 1.15 }}>
          <span>Puisi, cerita pendek,</span>
          <span>dan ulasan buku.</span>
        </div>
        <div style={{ marginTop: 32, fontSize: 30, color: '#5c6470' }}>
          {site.url.replace('https://', '')}
        </div>
      </div>
    ),
    size
  )
}
