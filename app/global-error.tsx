'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          backgroundColor: '#f8f5ef',
          color: '#151b26',
          fontFamily:
            'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        }}
      >
        <main
          style={{
            maxWidth: '32rem',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#5c6470',
            }}
          >
            Terjadi kesalahan
          </p>

          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              color: '#5c6470',
            }}
          >
            Maaf, ada yang tidak beres di sisi kami. Silakan coba lagi.
          </p>

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                font: 'inherit',
                fontSize: '1rem',
                color: '#b23122',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Coba lagi
            </button>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces the root layout, so next/link's router context is unavailable */}
            <a
              href="/"
              style={{
                fontSize: '1rem',
                color: '#b23122',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Kembali ke beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}
