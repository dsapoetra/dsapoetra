import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

/**
 * Signed download links.
 *
 * A buyer gets a URL like `/unduh/<token>`. The token carries the claim — this
 * invoice bought this product, and the link dies at this time — and an HMAC
 * over that claim. Nothing is looked up to decide whether the link is *valid*;
 * the signature is the proof. That is what makes it safe to put in an email
 * that will sit in an inbox forever.
 *
 * Format: `<base64url(payload json)>.<base64url(hmac-sha256)>`
 *
 * Not a JWT, on purpose. A JWT would drag in an algorithm field that has to be
 * pinned to stop `alg: none`, plus a library, for a token with exactly one
 * issuer, one audience and three claims.
 */

export type DownloadClaim = {
  /** Order this download belongs to. */
  invoice: string
  /** Product slug being downloaded. */
  slug: string
  /** Expiry, seconds since the epoch. */
  exp: number
  /** Random, so two links for the same product in one order still differ. */
  jti: string
}

/** How long a link in an email stays good for. */
export const DOWNLOAD_TTL_DAYS = 30

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function fromBase64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function macOf(payload: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(payload, 'utf8').digest())
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function signDownload(
  claim: Omit<DownloadClaim, 'jti' | 'exp'> & { exp?: number; jti?: string },
  secret: string,
  now: Date = new Date()
): string {
  const full: DownloadClaim = {
    invoice: claim.invoice,
    slug: claim.slug,
    exp:
      claim.exp ??
      Math.floor(now.getTime() / 1000) + DOWNLOAD_TTL_DAYS * 24 * 60 * 60,
    jti: claim.jti ?? randomBytes(9).toString('hex'),
  }

  const payload = base64url(JSON.stringify(full))
  return `${payload}.${macOf(payload, secret)}`
}

export type VerifyResult =
  | { ok: true; claim: DownloadClaim }
  | { ok: false; reason: 'malformed' | 'signature' | 'expired' }

/**
 * Verifies a token and returns the claim inside it.
 *
 * The signature is checked before the payload is trusted for anything, and
 * expiry is checked last — an expired token is a REAL token, which is why it
 * gets its own reason: the page can offer to re-send rather than implying the
 * link was never valid.
 */
export function verifyDownload(
  token: string,
  secret: string,
  now: Date = new Date()
): VerifyResult {
  const parts = token.split('.')
  if (parts.length !== 2) return { ok: false, reason: 'malformed' }

  const [payload, mac] = parts
  if (!payload || !mac) return { ok: false, reason: 'malformed' }

  if (!safeEqual(mac, macOf(payload, secret))) {
    return { ok: false, reason: 'signature' }
  }

  let claim: DownloadClaim
  try {
    claim = JSON.parse(fromBase64url(payload).toString('utf8'))
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (
    typeof claim?.invoice !== 'string' ||
    typeof claim?.slug !== 'string' ||
    typeof claim?.exp !== 'number'
  ) {
    return { ok: false, reason: 'malformed' }
  }

  if (claim.exp * 1000 <= now.getTime()) return { ok: false, reason: 'expired' }

  return { ok: true, claim }
}
