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
          backgroundColor: 'var(--ge-paper)',
          color: 'var(--ge-ink)',
          fontFamily:
            'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
        }}
      >
        <style>
          {`
            :root {
              --ge-paper: #f8f5ef;
              --ge-ink: #151b26;
              --ge-accent: #b23122;
              --ge-muted: #5c6470;
            }
            @media (prefers-color-scheme: dark) {
              :root {
                --ge-paper: #12161e;
                --ge-ink: #f2ede3;
                --ge-accent: #ff8b6b;
                --ge-muted: #98a2af;
              }
            }
          `}
        </style>

        <main
          style={{
            maxWidth: '32rem',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: '0.875rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: 'var(--ge-muted)',
            }}
          >
            Terjadi kesalahan
          </h1>

          <p
            style={{
              marginTop: '1.5rem',
              fontSize: '1.125rem',
              lineHeight: 1.7,
              color: 'var(--ge-muted)',
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
                color: 'var(--ge-accent)',
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
                color: 'var(--ge-accent)',
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
