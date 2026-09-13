import { describe, it, expect, vi, afterEach } from 'vitest'
import { createCheckout, DokuError } from '@/lib/doku/client'
import { componentsOf, digestOf } from '@/lib/doku/signature'
import { createHmac } from 'node:crypto'

const CONFIG = {
  clientId: 'MCH-0001-UJI',
  secretKey: 'SK-rahasia-uji',
  environment: 'sandbox' as const,
  baseUrl: 'https://api-sandbox.doku.com',
}

const REQUEST = {
  amount: 128000,
  invoiceNumber: 'INV20260831ABCDEFGHJK',
  lineItems: [
    { id: 'sunyi-hanya-angan', name: 'Sunyi Hanya Angan', quantity: 1, price: 49000 },
    { id: 'jurnal-draf-novel', name: 'Jurnal Draf Novel', quantity: 1, price: 79000 },
  ],
  callbackUrl: 'https://dsapoetra.com/toko/selesai?inv=INV20260831ABCDEFGHJK',
  customer: { email: 'pembeli@contoh.test' },
}

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const OK = {
  payment: {
    url: 'https://sandbox.doku.com/checkout-link-v2/token-abc',
    token_id: 'token-abc',
    expired_date: '20260831094500',
  },
}

describe('createCheckout', () => {
  it('returns the hosted payment URL', async () => {
    mockFetch(200, OK)
    const result = await createCheckout(REQUEST, CONFIG)
    expect(result.paymentUrl).toBe('https://sandbox.doku.com/checkout-link-v2/token-abc')
    expect(result.tokenId).toBe('token-abc')
  })

  it('posts to the sandbox checkout endpoint', async () => {
    const fetchMock = mockFetch(200, OK)
    await createCheckout(REQUEST, CONFIG)

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api-sandbox.doku.com/checkout/v1/payment')
    expect(init.method).toBe('POST')
  })

  it('signs the exact bytes it sends', async () => {
    // The whole integration turns on this: if the digest is computed from a
    // re-serialized object rather than the body on the wire, every call fails
    // DOKU's signature check.
    const fetchMock = mockFetch(200, OK)
    await createCheckout(REQUEST, CONFIG)

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    const body = init.body as string

    const expected = createHmac('sha256', CONFIG.secretKey)
      .update(
        componentsOf({
          clientId: CONFIG.clientId,
          requestId: headers['Request-Id'],
          timestamp: headers['Request-Timestamp'],
          target: '/checkout/v1/payment',
          digest: digestOf(body),
        }),
        'utf8'
      )
      .digest('base64')

    expect(headers.Signature).toBe(`HMACSHA256=${expected}`)
    expect(headers['Client-Id']).toBe(CONFIG.clientId)
    expect(headers['Request-Timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/)
  })

  it('sends a fresh Request-Id per call, to protect against duplicates', async () => {
    const fetchMock = mockFetch(200, OK)
    await createCheckout(REQUEST, CONFIG)
    await createCheckout(REQUEST, CONFIG)

    const first = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
    const second = (fetchMock.mock.calls[1] as unknown as [string, RequestInit])[1]
    expect((first.headers as Record<string, string>)['Request-Id']).not.toBe(
      (second.headers as Record<string, string>)['Request-Id']
    )
  })

  it('builds the order body DOKU documents', async () => {
    const fetchMock = mockFetch(200, OK)
    await createCheckout(REQUEST, CONFIG)

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(init.body as string)

    expect(body.order.amount).toBe(128000)
    expect(body.order.currency).toBe('IDR')
    expect(body.order.invoice_number).toBe(REQUEST.invoiceNumber)
    expect(body.order.line_items).toHaveLength(2)
    expect(body.order.line_items[0]).toEqual({
      id: 'sunyi-hanya-angan',
      name: 'Sunyi Hanya Angan',
      quantity: 1,
      price: 49000,
    })
    expect(body.payment.type).toBe('SALE')
    expect(body.customer.email).toBe('pembeli@contoh.test')
  })

  it('refuses when the line items do not add up to the amount', async () => {
    const fetchMock = mockFetch(200, OK)
    await expect(
      createCheckout({ ...REQUEST, amount: 1 }, CONFIG)
    ).rejects.toThrow(/tidak sama dengan amount/)
    // Caught before any network call — a pricing bug never reaches DOKU.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses when DOKU is not configured', async () => {
    const fetchMock = mockFetch(200, OK)
    await expect(createCheckout(REQUEST, null)).rejects.toThrow(/belum dikonfigurasi/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('raises a DokuError carrying the status and body on rejection', async () => {
    mockFetch(400, { error: { message: 'Invalid signature' } })
    await expect(createCheckout(REQUEST, CONFIG)).rejects.toBeInstanceOf(DokuError)
    await expect(createCheckout(REQUEST, CONFIG)).rejects.toThrow(/HTTP 400/)
  })

  it('raises rather than returning undefined when payment.url is absent', async () => {
    mockFetch(200, { payment: { token_id: 'x' } })
    await expect(createCheckout(REQUEST, CONFIG)).rejects.toThrow(/payment\.url/)
  })

  it('raises when the response is not JSON at all', async () => {
    mockFetch(200, '<html>gateway timeout</html>')
    await expect(createCheckout(REQUEST, CONFIG)).rejects.toThrow(/bukan JSON/)
  })

  it('never caches a payment creation', async () => {
    const fetchMock = mockFetch(200, OK)
    await createCheckout(REQUEST, CONFIG)
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.cache).toBe('no-store')
  })
})
