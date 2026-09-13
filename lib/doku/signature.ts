import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

/**
 * DOKU's non-SNAP request signing, implemented from the published spec.
 *
 * https://developers.doku.com — "Signature Component from Request Header".
 * The same scheme runs in both directions: we sign requests we send to DOKU,
 * and DOKU signs the HTTP notifications it sends us, so `sign` is used for both
 * and `verifyNotification` just re-signs and compares.
 *
 * The components, in this exact order, one per line, joined with `\n` and with
 * NO trailing newline:
 *
 *     Client-Id:<client id>
 *     Request-Id:<uuid>
 *     Request-Timestamp:<ISO8601 UTC, seconds>
 *     Request-Target:<path only, no host, no query>
 *     Digest:<base64(sha256(raw json body))>
 *
 * Then `HMACSHA256=` + base64(HMAC-SHA256(components, secretKey)).
 *
 * SERVER ONLY. The secret key must never reach the browser — nothing in here is
 * imported by a client component, and `lib/doku/client.ts` is the only caller.
 */

export type SignatureParts = {
  clientId: string
  requestId: string
  /** ISO8601 UTC to the second, e.g. `2026-08-31T08:45:42Z`. */
  timestamp: string
  /** Path only: `/checkout/v1/payment`, not the full URL. */
  target: string
  /** Omitted for GET, which has no body to hash. */
  digest?: string
}

/**
 * `Digest` is base64 of the SHA-256 of the **raw** body bytes.
 *
 * It must be the exact string that goes on the wire — re-serializing a parsed
 * object can reorder keys or change spacing and the digest stops matching. That
 * is why the notification route reads `await request.text()` and verifies that,
 * rather than `await request.json()`.
 */
export function digestOf(rawBody: string): string {
  return createHash('sha256').update(rawBody, 'utf8').digest('base64')
}

/** The signature base string, exactly as DOKU composes it. */
export function componentsOf(parts: SignatureParts): string {
  const lines = [
    `Client-Id:${parts.clientId}`,
    `Request-Id:${parts.requestId}`,
    `Request-Timestamp:${parts.timestamp}`,
    `Request-Target:${parts.target}`,
  ]

  // "This component only applied for POST Method" — a GET has no body, and
  // sending an empty Digest line is not the same as sending none.
  if (parts.digest !== undefined) lines.push(`Digest:${parts.digest}`)

  return lines.join('\n')
}

/** The full `Signature` header value, including the `HMACSHA256=` prefix. */
export function sign(parts: SignatureParts, secretKey: string): string {
  const mac = createHmac('sha256', secretKey)
    .update(componentsOf(parts), 'utf8')
    .digest('base64')

  return `HMACSHA256=${mac}`
}

/**
 * ISO8601 UTC to the second — `2026-08-31T08:45:42Z`.
 *
 * `toISOString()` includes milliseconds, which DOKU's format does not have.
 * Sending `...:42.317Z` makes the timestamp we sign differ from the one they
 * parse, and every request fails signature validation.
 */
export function dokuTimestamp(date: Date = new Date()): string {
  return `${date.toISOString().slice(0, 19)}Z`
}

/**
 * Constant-time comparison of two signature strings.
 *
 * A plain `===` on a signature leaks, through timing, how long a prefix an
 * attacker got right, which is enough to forge one byte at a time. Lengths are
 * compared first because `timingSafeEqual` throws on a length mismatch — that
 * leak is harmless, since the length is fixed by the algorithm anyway.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/**
 * Verifies an incoming HTTP notification really came from DOKU.
 *
 * `target` is the path of OUR notification URL as DOKU has it configured — for
 * `https://dsapoetra.com/api/doku/notification` that is
 * `/api/doku/notification`. It is part of the signed string, so it has to match
 * what DOKU used, not merely what this request happens to have arrived on.
 *
 * The Client-Id on the request is checked against ours as well: without that,
 * a notification signed by some other DOKU merchant would only need to name our
 * client id in the body to be accepted.
 */
export function verifyNotification({
  headers,
  rawBody,
  target,
  clientId,
  secretKey,
}: {
  headers: {
    clientId: string | null
    requestId: string | null
    timestamp: string | null
    signature: string | null
  }
  rawBody: string
  target: string
  clientId: string
  secretKey: string
}): boolean {
  const { requestId, timestamp, signature } = headers

  if (!requestId || !timestamp || !signature) return false
  if (!headers.clientId || !safeEqual(headers.clientId, clientId)) return false

  const expected = sign(
    {
      clientId,
      requestId,
      timestamp,
      target,
      digest: digestOf(rawBody),
    },
    secretKey
  )

  return safeEqual(signature, expected)
}
