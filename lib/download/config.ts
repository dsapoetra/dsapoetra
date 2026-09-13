import 'server-only'

/**
 * Secret that signs download links.
 *
 * Deliberately its own value rather than reusing `DOKU_SECRET_KEY`. Rotating
 * the DOKU key — because it leaked, or because DOKU asked — would otherwise
 * silently invalidate every download link already sitting in a buyer's inbox.
 * Two jobs, two secrets.
 *
 * Generate one with:
 *   openssl rand -base64 32
 */
export function downloadSecret(): string | null {
  const secret = process.env.DOWNLOAD_SECRET
  return secret && secret.length >= 16 ? secret : null
}
