import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  signDownload,
  verifyDownload,
  DOWNLOAD_TTL_DAYS,
} from '@/lib/download/token'

const SECRET = 'DL-rahasia-uji'
const CLAIM = { invoice: 'INV20260831ABCDEFGHJK', slug: 'sunyi-hanya-angan' }
const NOW = new Date('2026-08-31T10:00:00Z')

/** Re-encodes a tampered payload the way an attacker would. */
function b64url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function claimIn(token: string): Record<string, unknown> {
  const [payload] = token.split('.')
  return JSON.parse(
    Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
  )
}

describe('signDownload / verifyDownload', () => {
  it('round-trips a claim', () => {
    const result = verifyDownload(signDownload(CLAIM, SECRET, NOW), SECRET, NOW)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.claim.invoice).toBe(CLAIM.invoice)
    expect(result.claim.slug).toBe(CLAIM.slug)
  })

  it('defaults to the documented lifetime', () => {
    const result = verifyDownload(signDownload(CLAIM, SECRET, NOW), SECRET, NOW)
    if (!result.ok) throw new Error('expected a valid token')
    const days = (result.claim.exp * 1000 - NOW.getTime()) / 86_400_000
    expect(days).toBeCloseTo(DOWNLOAD_TTL_DAYS, 5)
  })

  it('produces a URL-safe token with no padding', () => {
    expect(signDownload(CLAIM, SECRET, NOW)).toMatch(
      /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/
    )
  })

  it('gives a different token each time, even for the same purchase', () => {
    expect(signDownload(CLAIM, SECRET, NOW)).not.toBe(
      signDownload(CLAIM, SECRET, NOW)
    )
  })

  it('rejects a token signed with a different secret', () => {
    expect(verifyDownload(signDownload(CLAIM, 'kunci-lain', NOW), SECRET, NOW)).toEqual(
      { ok: false, reason: 'signature' }
    )
  })

  it('rejects a payload edited to name a different product', () => {
    // The attack this stops: buy the cheap thing, edit the slug in the link,
    // download the expensive one.
    const token = signDownload(CLAIM, SECRET, NOW)
    const [, mac] = token.split('.')
    const claim = claimIn(token)
    claim.slug = 'menulis-puisi-pendek'

    expect(verifyDownload(`${b64url(JSON.stringify(claim))}.${mac}`, SECRET, NOW)).toEqual(
      { ok: false, reason: 'signature' }
    )
  })

  it('rejects a token whose expiry has been pushed out', () => {
    const token = signDownload(CLAIM, SECRET, NOW)
    const [, mac] = token.split('.')
    const claim = claimIn(token)
    claim.exp = Number(claim.exp) + 86_400

    expect(
      verifyDownload(`${b64url(JSON.stringify(claim))}.${mac}`, SECRET, NOW).ok
    ).toBe(false)
  })

  it('reports an expired token separately, so the page can offer a re-send', () => {
    expect(verifyDownload(signDownload({ ...CLAIM, exp: 1000 }, SECRET, NOW), SECRET, NOW)).toEqual(
      { ok: false, reason: 'expired' }
    )
  })

  it('treats the expiry second itself as expired', () => {
    const exp = Math.floor(NOW.getTime() / 1000)
    expect(
      verifyDownload(signDownload({ ...CLAIM, exp }, SECRET, NOW), SECRET, NOW)
    ).toEqual({ ok: false, reason: 'expired' })
  })

  it('rejects malformed input without throwing', () => {
    for (const bad of ['', '.', 'abc', 'a.b.c', 'not-a-token', '.sig', 'payload.']) {
      expect(verifyDownload(bad, SECRET, NOW).ok).toBe(false)
    }
  })

  it('rejects a correctly signed token whose payload is not a claim', () => {
    const payload = b64url(JSON.stringify({ hello: 'world' }))
    const mac = createHmac('sha256', SECRET)
      .update(payload, 'utf8')
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    expect(verifyDownload(`${payload}.${mac}`, SECRET, NOW)).toEqual({
      ok: false,
      reason: 'malformed',
    })
  })
})
