import { describe, it, expect } from 'vitest'
import { createHash, createHmac } from 'node:crypto'
import {
  digestOf,
  componentsOf,
  sign,
  dokuTimestamp,
  safeEqual,
  verifyNotification,
} from '@/lib/doku/signature'

const PARTS = {
  clientId: 'MCH-0001-10791114622547',
  requestId: 'cc682442-6c22-493e-8121-b9ef6b3fa728',
  timestamp: '2020-08-11T08:45:42Z',
  target: '/doku-virtual-account/v2/payment-code',
  digest: '5WIYK2TJg6iiZ0d5v4IXSR0EkYEkYOezJIma3Ufli5s=',
}

const SECRET = 'SK-rahasia-uji'

describe('digestOf', () => {
  it('is base64 of the SHA-256 of the raw body', () => {
    const body = '{"order":{"amount":49000}}'
    expect(digestOf(body)).toBe(
      createHash('sha256').update(body, 'utf8').digest('base64')
    )
  })

  it('is sensitive to formatting, which is why the raw body must be signed', () => {
    // The reason the notification route verifies `await request.text()` rather
    // than re-serializing `await request.json()`: same data, different bytes,
    // different digest, failed verification.
    expect(digestOf('{"a":1,"b":2}')).not.toBe(digestOf('{"b":2,"a":1}'))
    expect(digestOf('{"a":1}')).not.toBe(digestOf('{ "a": 1 }'))
  })
})

describe('componentsOf', () => {
  it('matches the layout published in the DOKU docs', () => {
    // Verbatim from "Signature Component from Request Header".
    expect(componentsOf(PARTS)).toBe(
      'Client-Id:MCH-0001-10791114622547\n' +
        'Request-Id:cc682442-6c22-493e-8121-b9ef6b3fa728\n' +
        'Request-Timestamp:2020-08-11T08:45:42Z\n' +
        'Request-Target:/doku-virtual-account/v2/payment-code\n' +
        'Digest:5WIYK2TJg6iiZ0d5v4IXSR0EkYEkYOezJIma3Ufli5s='
    )
  })

  it('has no trailing newline', () => {
    expect(componentsOf(PARTS).endsWith('=')).toBe(true)
    expect(componentsOf(PARTS)).not.toMatch(/\n$/)
  })

  it('omits the Digest line entirely when there is no body', () => {
    const noBody = { ...PARTS, digest: undefined }
    const components = componentsOf(noBody)
    expect(components).not.toContain('Digest')
    expect(components.split('\n')).toHaveLength(4)
  })
})

describe('sign', () => {
  it('is HMAC-SHA256 base64 of the components, prefixed', () => {
    const expected = createHmac('sha256', SECRET)
      .update(componentsOf(PARTS), 'utf8')
      .digest('base64')

    expect(sign(PARTS, SECRET)).toBe(`HMACSHA256=${expected}`)
  })

  it('changes when any single component changes', () => {
    const base = sign(PARTS, SECRET)
    expect(sign({ ...PARTS, requestId: 'lain' }, SECRET)).not.toBe(base)
    expect(sign({ ...PARTS, target: '/lain' }, SECRET)).not.toBe(base)
    expect(sign({ ...PARTS, timestamp: '2020-08-11T08:45:43Z' }, SECRET)).not.toBe(base)
    expect(sign(PARTS, 'kunci-lain')).not.toBe(base)
  })
})

describe('dokuTimestamp', () => {
  it('is ISO8601 UTC to the second, with no milliseconds', () => {
    const stamp = dokuTimestamp(new Date('2026-08-31T08:45:42.317Z'))
    // The trap: toISOString() would give ...42.317Z, and every request would
    // fail signature validation because DOKU parses a different string.
    expect(stamp).toBe('2026-08-31T08:45:42Z')
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })

  it('is in UTC regardless of the machine timezone', () => {
    const original = process.env.TZ
    try {
      process.env.TZ = 'Asia/Jakarta'
      expect(dokuTimestamp(new Date('2026-08-31T08:45:42Z'))).toBe(
        '2026-08-31T08:45:42Z'
      )
    } finally {
      process.env.TZ = original
    }
  })
})

describe('safeEqual', () => {
  it('is true for identical strings and false otherwise', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
  })

  it('returns false rather than throwing on a length mismatch', () => {
    // timingSafeEqual throws when lengths differ; that must not become a 500.
    expect(safeEqual('abc', 'abcdef')).toBe(false)
    expect(safeEqual('', 'a')).toBe(false)
  })
})

describe('verifyNotification', () => {
  const rawBody = JSON.stringify({
    transaction: { status: 'SUCCESS' },
    order: { invoice_number: 'INV-1', amount: 49000 },
  })
  const target = '/api/doku/notification'
  const timestamp = '2026-08-31T08:45:42Z'
  const requestId = 'a-request-id'
  const clientId = 'MCH-0001-UJI'

  function headersFor(signature: string) {
    return { clientId, requestId, timestamp, signature }
  }

  const good = sign(
    { clientId, requestId, timestamp, target, digest: digestOf(rawBody) },
    SECRET
  )

  it('accepts a notification DOKU actually signed', () => {
    expect(
      verifyNotification({
        headers: headersFor(good),
        rawBody,
        target,
        clientId,
        secretKey: SECRET,
      })
    ).toBe(true)
  })

  it('rejects a tampered body — the amount cannot be edited in flight', () => {
    expect(
      verifyNotification({
        headers: headersFor(good),
        rawBody: rawBody.replace('49000', '1'),
        target,
        clientId,
        secretKey: SECRET,
      })
    ).toBe(false)
  })

  it('rejects a signature made with the wrong secret', () => {
    const forged = sign(
      { clientId, requestId, timestamp, target, digest: digestOf(rawBody) },
      'kunci-penyerang'
    )
    expect(
      verifyNotification({
        headers: headersFor(forged),
        rawBody,
        target,
        clientId,
        secretKey: SECRET,
      })
    ).toBe(false)
  })

  it('rejects a valid signature aimed at a different path', () => {
    const elsewhere = sign(
      {
        clientId,
        requestId,
        timestamp,
        target: '/api/lain',
        digest: digestOf(rawBody),
      },
      SECRET
    )
    expect(
      verifyNotification({
        headers: headersFor(elsewhere),
        rawBody,
        target,
        clientId,
        secretKey: SECRET,
      })
    ).toBe(false)
  })

  it('rejects another merchant Client-Id even when the signature is well formed', () => {
    const other = 'MCH-0001-LAIN'
    const signature = sign(
      { clientId: other, requestId, timestamp, target, digest: digestOf(rawBody) },
      SECRET
    )
    expect(
      verifyNotification({
        headers: { clientId: other, requestId, timestamp, signature },
        rawBody,
        target,
        clientId,
        secretKey: SECRET,
      })
    ).toBe(false)
  })

  it('rejects a request missing any signature header', () => {
    const base = {
      rawBody,
      target,
      clientId,
      secretKey: SECRET,
    }
    expect(
      verifyNotification({ ...base, headers: { ...headersFor(good), signature: null } })
    ).toBe(false)
    expect(
      verifyNotification({ ...base, headers: { ...headersFor(good), requestId: null } })
    ).toBe(false)
    expect(
      verifyNotification({ ...base, headers: { ...headersFor(good), timestamp: null } })
    ).toBe(false)
    expect(
      verifyNotification({ ...base, headers: { ...headersFor(good), clientId: null } })
    ).toBe(false)
  })
})
