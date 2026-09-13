import { NextResponse, type NextRequest } from 'next/server'
import { verifyNotification } from '@/lib/doku/signature'
import { dokuConfig, NOTIFICATION_PATH } from '@/lib/doku/config'
import { looksLikeInvoiceNumber } from '@/lib/doku/invoice'
import { markPaid, isOrderStoreConfigured } from '@/lib/orders/store'
import { signDownload, DOWNLOAD_TTL_DAYS } from '@/lib/download/token'
import { downloadSecret } from '@/lib/download/config'
import { loadProducts } from '@/lib/products/load'
import { productFileExists } from '@/lib/download/files'
import { findProduct } from '@/lib/products/types'
import { buildReceipt, type DeliveryLink } from '@/lib/email/receipt'
import { sendReceipt } from '@/lib/email/send'
import { site } from '@/lib/site'

/**
 * DOKU's HTTP Notification endpoint — and the whole of fulfilment.
 *
 * Configure this URL in the DOKU Back Office as:
 *   https://dsapoetra.com/api/doku/notification
 *
 * It must match `NOTIFICATION_PATH` exactly: the path is part of the signed
 * string, so a mismatch fails every signature check with no other symptom.
 *
 * Order of business, and why:
 *   1. Verify the signature. Nothing below is trusted before this.
 *   2. Claim the order atomically. DOKU retries, and the receipt goes once.
 *   3. Sign a download link per product and email them.
 *   4. Always answer 2xx once the signature passed — see the note at the end.
 */

function originOf(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : site.url
}

export async function POST(request: NextRequest) {
  const config = dokuConfig()

  // Nothing configured means nothing can be verified, and an unverified
  // notification must never be treated as real.
  if (!config) return NextResponse.json({ received: false }, { status: 503 })

  // The RAW body, not request.json(). The signature covers these exact bytes;
  // parsing and re-serializing would reorder keys and break the digest.
  const rawBody = await request.text()

  const verified = verifyNotification({
    headers: {
      clientId: request.headers.get('Client-Id'),
      requestId: request.headers.get('Request-Id'),
      timestamp: request.headers.get('Request-Timestamp'),
      signature: request.headers.get('Signature'),
    },
    rawBody,
    target: NOTIFICATION_PATH,
    clientId: config.clientId,
    secretKey: config.secretKey,
  })

  if (!verified) {
    console.warn(
      JSON.stringify({
        event: 'doku.notification.rejected',
        reason: 'signature',
        requestId: request.headers.get('Request-Id'),
      })
    )
    return NextResponse.json({ received: false }, { status: 401 })
  }

  // Only parsed AFTER the signature proves the bytes are DOKU's.
  let body: {
    transaction?: { status?: string; date?: string }
    order?: { invoice_number?: string; amount?: number }
    channel?: { id?: string }
  }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ received: false }, { status: 400 })
  }

  const invoice = body.order?.invoice_number ?? ''
  const status = body.transaction?.status ?? 'UNKNOWN'

  console.log(
    JSON.stringify({
      event: 'doku.notification',
      invoice,
      recognized: looksLikeInvoiceNumber(invoice),
      status,
      amount: body.order?.amount,
      channel: body.channel?.id,
      environment: config.environment,
    })
  )

  /*
   * DOKU's own guidance for Checkout: ignore `FAILED`. Their page lets a buyer
   * pick another payment method after one fails, so a FAILED notification is
   * not the end of the order — treating it as final would kill a purchase the
   * customer is still in the middle of making.
   */
  if (status !== 'SUCCESS') return NextResponse.json({ received: true })

  if (!isOrderStoreConfigured()) {
    console.error(JSON.stringify({ event: 'fulfilment.no_store', invoice }))
    return NextResponse.json({ received: true })
  }

  // Atomic: whichever call wins gets firstTime, the rest get false. This is
  // what stops a DOKU retry sending a second copy of the receipt.
  const { order, firstTime } = await markPaid(
    invoice,
    body.transaction?.date ?? new Date().toISOString()
  )

  if (!order) {
    // Signed by DOKU, but for an invoice this deployment never wrote — most
    // often a sandbox notification arriving at production, or vice versa.
    console.warn(JSON.stringify({ event: 'fulfilment.unknown_order', invoice }))
    return NextResponse.json({ received: true })
  }

  if (!firstTime) {
    console.log(JSON.stringify({ event: 'fulfilment.already_sent', invoice }))
    return NextResponse.json({ received: true })
  }

  const secret = downloadSecret()
  if (!secret) {
    console.error(JSON.stringify({ event: 'fulfilment.no_download_secret', invoice }))
    return NextResponse.json({ received: true })
  }

  const products = await loadProducts()
  const origin = originOf(request)

  const links: DeliveryLink[] = await Promise.all(
    order.items.map(async (item): Promise<DeliveryLink> => {
      const product = findProduct(products, item.slug)

      /*
       * No file, or a `download:` naming a file that is not actually deployed:
       * the item still appears in the email, under "menyusul", so somebody who
       * paid for two things sees two things. Checked HERE rather than at
       * download time so a buyer is never handed a link that fails when they
       * click it — a promise not made beats a promise broken.
       */
      if (!product?.download || !(await productFileExists(product.download))) {
        if (product?.download) {
          console.error(
            JSON.stringify({
              event: 'fulfilment.file_missing',
              invoice,
              slug: item.slug,
              download: product.download,
            })
          )
        }
        return { slug: item.slug, title: item.title, url: null }
      }

      const token = signDownload({ invoice: order.invoice, slug: item.slug }, secret)
      return { slug: item.slug, title: item.title, url: `${origin}/unduh/${token}` }
    })
  )

  const result = await sendReceipt({
    to: order.email,
    receipt: buildReceipt({ order, links, expiresInDays: DOWNLOAD_TTL_DAYS }),
    // One receipt per order, even if this handler somehow runs twice.
    idempotencyKey: `receipt:${order.invoice}`,
  })

  if (result.ok) {
    console.log(
      JSON.stringify({ event: 'fulfilment.sent', invoice, emailId: result.id })
    )
  } else {
    // The money is taken and the order is marked paid, but the buyer has no
    // email. Loud, with the invoice, because this is the one failure that needs
    // a human to finish the job by hand.
    console.error(
      JSON.stringify({
        event: 'fulfilment.email_failed',
        invoice,
        status: result.status,
        detail: result.detail,
      })
    )
  }

  /*
   * 2xx even when the email failed.
   *
   * A non-2xx makes DOKU retry, and a retry cannot help: the order is already
   * marked paid, so the retry would take the `already_sent` path and send
   * nothing. Answering 200 keeps DOKU's queue clean and leaves the failure
   * where it can actually be acted on — `fulfilment.email_failed` in the logs.
   */
  return NextResponse.json({ received: true })
}
