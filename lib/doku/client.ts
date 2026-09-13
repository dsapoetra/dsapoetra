import 'server-only'
import { randomUUID } from 'node:crypto'
import { dokuConfig, CHECKOUT_PATH, type DokuConfig } from '@/lib/doku/config'
import { sign, digestOf, dokuTimestamp } from '@/lib/doku/signature'

/**
 * The DOKU Checkout call — creates a hosted payment page and returns its URL.
 *
 * https://developers.doku.com — "DOKU Checkout / Backend Integration".
 * POST https://api{-sandbox}.doku.com/checkout/v1/payment
 */

export type CheckoutLineItem = {
  id: string
  name: string
  quantity: number
  /** Unit price in whole rupiah. quantity × price must sum to `amount`. */
  price: number
}

export type CheckoutRequest = {
  /** Whole rupiah, no decimals. Must equal the sum of the line items. */
  amount: number
  /** Our order reference. DOKU echoes it back on the notification. */
  invoiceNumber: string
  lineItems: CheckoutLineItem[]
  /** Where "Back to Merchant" and the post-payment redirect land. */
  callbackUrl: string
  customer?: { name?: string; email?: string }
  /** Minutes the payment page stays valid. DOKU defaults to 60. */
  dueMinutes?: number
}

export type CheckoutResult = {
  paymentUrl: string
  tokenId: string
  expiredDate: string
}

export class DokuError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message)
    this.name = 'DokuError'
  }
}

/**
 * The subset of DOKU's response we rely on. Deliberately narrow: anything we do
 * not read, we do not depend on, and DOKU is free to add fields.
 */
type CheckoutResponse = {
  payment?: { url?: string; token_id?: string; expired_date?: string }
  error?: { message?: string }
  message?: string[] | string
}

export async function createCheckout(
  request: CheckoutRequest,
  config: DokuConfig | null = dokuConfig()
): Promise<CheckoutResult> {
  if (!config) {
    throw new DokuError(
      'DOKU belum dikonfigurasi — DOKU_CLIENT_ID dan DOKU_SECRET_KEY belum diisi.',
      0,
      ''
    )
  }

  const total = request.lineItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // DOKU rejects a mismatch, but late and with an opaque message. Catching it
  // here means a pricing bug surfaces as a pricing bug.
  if (total !== request.amount) {
    throw new DokuError(
      `Total baris (${total}) tidak sama dengan amount (${request.amount}).`,
      0,
      ''
    )
  }

  const body = JSON.stringify({
    order: {
      amount: request.amount,
      invoice_number: request.invoiceNumber,
      currency: 'IDR',
      callback_url: request.callbackUrl,
      auto_redirect: true,
      line_items: request.lineItems.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    },
    payment: {
      payment_due_date: request.dueMinutes ?? 60,
      type: 'SALE',
    },
    ...(request.customer
      ? {
          customer: {
            ...(request.customer.name ? { name: request.customer.name } : {}),
            ...(request.customer.email ? { email: request.customer.email } : {}),
          },
        }
      : {}),
  })

  const requestId = randomUUID()
  const timestamp = dokuTimestamp()

  // The digest must be of exactly the bytes we send, so `body` is built once
  // and reused for both the signature and the request.
  const signature = sign(
    {
      clientId: config.clientId,
      requestId,
      timestamp,
      target: CHECKOUT_PATH,
      digest: digestOf(body),
    },
    config.secretKey
  )

  const response = await fetch(`${config.baseUrl}${CHECKOUT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': config.clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      Signature: signature,
    },
    body,
    // Payment creation is never cached — every call must reach DOKU.
    cache: 'no-store',
  })

  const text = await response.text()

  if (!response.ok) {
    throw new DokuError(
      `DOKU menolak permintaan checkout (HTTP ${response.status}).`,
      response.status,
      text
    )
  }

  let parsed: CheckoutResponse
  try {
    parsed = JSON.parse(text) as CheckoutResponse
  } catch {
    throw new DokuError('Balasan DOKU bukan JSON.', response.status, text)
  }

  const url = parsed.payment?.url
  if (!url) {
    throw new DokuError(
      'Balasan DOKU tidak memuat payment.url.',
      response.status,
      text
    )
  }

  return {
    paymentUrl: url,
    tokenId: parsed.payment?.token_id ?? '',
    expiredDate: parsed.payment?.expired_date ?? '',
  }
}
