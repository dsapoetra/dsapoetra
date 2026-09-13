import 'server-only'
import type { Receipt } from '@/lib/email/receipt'

/**
 * Sending, over Resend's HTTP API.
 *
 * Plain `fetch` rather than their SDK: this makes exactly one request with four
 * fields, and a dependency that has to be kept current is a poor trade for
 * that. Nothing here is Resend-shaped beyond the URL and the auth header, so
 * swapping providers is a small edit to this file alone.
 *
 * https://resend.com/docs/api-reference/emails/send-email
 */

export type MailConfig = { apiKey: string; from: string; replyTo?: string }

/**
 * Reads mail configuration, or null when email is not set up.
 *
 * `SHOP_FROM_EMAIL` must be on a domain verified in Resend. An unverified
 * sender is accepted by the API and then quietly fails to arrive, which is a
 * much worse failure than an error.
 */
export function mailConfig(): MailConfig | null {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.SHOP_FROM_EMAIL

  if (!apiKey || !from) return null

  return {
    apiKey,
    from,
    ...(process.env.SHOP_REPLY_TO ? { replyTo: process.env.SHOP_REPLY_TO } : {}),
  }
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; status: number; detail: string }

export async function sendReceipt({
  to,
  receipt,
  idempotencyKey,
  config = mailConfig(),
}: {
  to: string
  receipt: Receipt
  /**
   * Stops a duplicate send if this runs twice — a DOKU retry that races the
   * Redis flag, or a redeploy mid-flight. The invoice number is the natural
   * key: one receipt per order.
   */
  idempotencyKey: string
  config?: MailConfig | null
}): Promise<SendResult> {
  if (!config) {
    return { ok: false, status: 0, detail: 'RESEND_API_KEY atau SHOP_FROM_EMAIL belum diisi' }
  }

  let response: Response
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({
        from: config.from,
        to,
        subject: receipt.subject,
        html: receipt.html,
        // Both bodies, always. A client that shows the text part would
        // otherwise render an empty message.
        text: receipt.text,
        ...(config.replyTo ? { reply_to: config.replyTo } : {}),
      }),
      cache: 'no-store',
    })
  } catch (error) {
    return {
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : 'gagal menghubungi Resend',
    }
  }

  const text = await response.text()

  if (!response.ok) return { ok: false, status: response.status, detail: text }

  try {
    const parsed = JSON.parse(text) as { id?: string }
    return { ok: true, id: parsed.id ?? '' }
  } catch {
    return { ok: false, status: response.status, detail: 'balasan Resend bukan JSON' }
  }
}
