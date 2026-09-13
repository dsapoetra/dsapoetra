import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { loadProducts } from '@/lib/products/load'
import { basketLines, basketTotal, MAX_QUANTITY } from '@/lib/products/types'
import { createCheckout, DokuError } from '@/lib/doku/client'
import { dokuConfig } from '@/lib/doku/config'
import { newInvoiceNumber } from '@/lib/doku/invoice'
import { saveOrder, isOrderStoreConfigured } from '@/lib/orders/store'

/**
 * Creates a DOKU hosted payment page for the basket and returns its URL.
 *
 * THE CLIENT SENDS SLUGS AND QUANTITIES, NEVER PRICES. Every price is looked up
 * from `content/produk/` here, on the server, and the total is computed from
 * that. A request that tried to name its own price would be ignored — this is
 * the one rule that makes a public, unauthenticated checkout endpoint safe.
 */

const checkoutSchema = z.object({
  // A record of slug -> quantity, matching how the basket is stored. Note what
  // is NOT in this schema: any price, amount or total. There is no field a
  // caller could use to influence what they are charged.
  items: z.record(
    z.string(),
    z
      .number('Jumlah harus berupa angka')
      .int('Jumlah harus bilangan bulat')
      .positive('Jumlah harus lebih dari nol')
      .max(MAX_QUANTITY, `Jumlah maksimal ${MAX_QUANTITY} per barang`)
  ),
  email: z.email('Email tidak valid'),
  name: z.string().trim().max(120, 'Nama terlalu panjang').optional(),
})

/**
 * Ceiling on a single order.
 *
 * There is no account and no rate limit in front of this route, so somebody
 * could hammer it to create payment pages. They cannot take anyone's money that
 * way, but they can fill the DOKU Back Office with junk. A sane cap keeps any
 * single request small; if this ever gets abused in volume, the answer is
 * Vercel's firewall rather than something hand-rolled here.
 */
const MAX_ORDER_TOTAL = 10_000_000
const MAX_DISTINCT_ITEMS = 20

/**
 * Origin to send DOKU as the "back to merchant" destination.
 *
 * Taken from the forwarded host so it is correct in local development, on a
 * preview deployment and in production without a fourth environment variable to
 * keep in sync.
 */
function originOf(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  return host ? `${proto}://${host}` : new URL(request.url).origin
}

export async function POST(request: NextRequest) {
  const config = dokuConfig()
  if (!config) {
    return NextResponse.json(
      { error: 'Pembayaran belum tersambung.' },
      { status: 503 }
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Permintaan tidak valid.' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Permintaan tidak valid.' },
      { status: 400 }
    )
  }

  const products = await loadProducts()
  const lines = basketLines(products, parsed.data.items)

  if (lines.length === 0) {
    return NextResponse.json({ error: 'Keranjang kosong.' }, { status: 400 })
  }
  if (lines.length > MAX_DISTINCT_ITEMS) {
    return NextResponse.json({ error: 'Terlalu banyak barang.' }, { status: 400 })
  }

  const amount = basketTotal(products, parsed.data.items)

  // A basket made entirely of free products has nothing to charge for. DOKU
  // rejects a zero amount, and it would be a confusing way to fail.
  if (amount <= 0) {
    return NextResponse.json(
      { error: 'Tidak ada yang perlu dibayar.' },
      { status: 400 }
    )
  }
  if (amount > MAX_ORDER_TOTAL) {
    return NextResponse.json({ error: 'Nilai pesanan terlalu besar.' }, { status: 400 })
  }

  // Without somewhere to record the order there is nothing to deliver from when
  // payment lands, so this refuses rather than taking money it cannot fulfil.
  if (!isOrderStoreConfigured()) {
    console.error(JSON.stringify({ event: 'doku.checkout.no_store' }))
    return NextResponse.json(
      { error: 'Pembayaran belum tersambung.' },
      { status: 503 }
    )
  }

  const invoiceNumber = newInvoiceNumber()

  try {
    // Recorded BEFORE the payment page is created. If DOKU somehow notified us
    // about an order we had not written yet, the notification would arrive with
    // nothing to look up and the buyer would get no email.
    await saveOrder({
      invoice: invoiceNumber,
      email: parsed.data.email,
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      amount,
      items: lines.map((line) => ({
        slug: line.product.slug,
        title: line.product.title,
        quantity: line.quantity,
        price: line.product.price,
      })),
      createdAt: new Date().toISOString(),
      status: 'PENDING',
    })

    const checkout = await createCheckout(
      {
        amount,
        invoiceNumber,
        lineItems: lines.map((line) => ({
          id: line.product.slug,
          name: line.product.title,
          quantity: line.quantity,
          price: line.product.price,
        })),
        callbackUrl: `${originOf(request)}/toko/selesai?inv=${invoiceNumber}`,
        customer: { email: parsed.data.email, name: parsed.data.name },
      },
      config
    )

    console.log(
      JSON.stringify({
        event: 'doku.checkout.created',
        invoiceNumber,
        amount,
        items: lines.map((line) => `${line.product.slug}×${line.quantity}`),
        environment: config.environment,
      })
    )

    return NextResponse.json({ paymentUrl: checkout.paymentUrl })
  } catch (error) {
    // The DOKU response body can echo back request details; it is logged for
    // the operator but never returned to the browser.
    console.error(
      JSON.stringify({
        event: 'doku.checkout.failed',
        invoiceNumber,
        message: error instanceof Error ? error.message : String(error),
        body: error instanceof DokuError ? error.body : undefined,
      })
    )

    return NextResponse.json(
      { error: 'Gagal membuka halaman pembayaran. Coba lagi sebentar lagi.' },
      { status: 502 }
    )
  }
}
