function platformName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('youtube') || host.includes('youtu.be')) return 'YouTube'
    if (host.includes('tiktok')) return 'TikTok'
    return host
  } catch {
    return 'video'
  }
}

export default function VideoCard({
  url,
  bookTitle,
}: {
  url: string
  bookTitle: string
}) {
  const platform = platformName(url)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mb-12 flex items-center gap-4 rounded-sm border border-rule px-5 py-4 transition-colors hover:border-accent focus-visible:border-accent"
    >
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule text-accent"
      >
        ▶
      </span>
      <span className="font-sans text-sm leading-6">
        <span className="block text-ink transition-colors group-hover:text-accent">
          Tonton ulasan {bookTitle} di {platform}
        </span>
        <span className="block font-mono text-xs text-muted">
          Membuka {platform} di tab baru
        </span>
      </span>
    </a>
  )
}
