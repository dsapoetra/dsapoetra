import 'server-only'
import { Redis } from '@upstash/redis'

/**
 * Order storage, on Upstash Redis.
 *
 * DOKU's notification carries only an invoice number, an amount and a status —
 * not what was bought, and not who bought it. So the order is written here when
 * checkout starts, and read back when payment lands. Without this there is
 * nothing to deliver and nobody to deliver it to.
 *
 * Redis rather than SQL because the whole access pattern is "get the order with
 * this invoice number". There are no queries, no joins, and no reporting — the
 * DOKU Back Office is the ledger. This is a lookup table with an expiry.
 *
 * SERVER ONLY: the Redis token is a write credential for the whole database.
 */

export type OrderItem = {
  slug: string
  title: string
  quantity: number
  /** Unit price at the time of purchase, in whole rupiah. */
  price: number
}

export type Order = {
  invoice: string
  email: string
  name?: string
  /** Total in whole rupiah, computed on the server at checkout. */
  amount: number
  items: OrderItem[]
  /** ISO timestamp. */
  createdAt: string
  status: 'PENDING' | 'PAID'
  paidAt?: string
}

/**
 * How long an order stays readable.
 *
 * Comfortably longer than the download links it issues (30 days), so a buyer
 * asking "my link expired" still has an order to re-issue from. Not forever:
 * this holds an email address, and keeping personal data past its usefulness is
 * a liability, not a feature.
 */
const ORDER_TTL_SECONDS = 180 * 24 * 60 * 60

function key(invoice: string): string {
  return `order:${invoice}`
}

/**
 * Built per call rather than at module scope.
 *
 * `Redis.fromEnv()` throws when the variables are absent, and Next.js evaluates
 * module-level code at build time — so a module-scope client would break
 * `next build` on any deploy where the integration is not yet connected.
 */
function redis(): Redis {
  return Redis.fromEnv()
}

export function isOrderStoreConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

export async function saveOrder(order: Order): Promise<void> {
  await redis().set(key(order.invoice), order, { ex: ORDER_TTL_SECONDS })
}

export async function getOrder(invoice: string): Promise<Order | null> {
  // Upstash deserializes JSON for us; a missing key is null, not a throw.
  return (await redis().get<Order>(key(invoice))) ?? null
}

/**
 * Marks an order paid, and reports whether THIS call is the one that did it.
 *
 * DOKU retries notifications, and a payment page can be reloaded, so the same
 * "SUCCESS" can arrive several times. The delivery email must go out once. The
 * flag that decides that is set with `NX` — set-if-absent, a single atomic
 * Redis operation — so two notifications racing each other cannot both come
 * back `firstTime: true` and send two emails.
 *
 * Returns `firstTime: false` when the order was already marked, and
 * `order: null` when there is no such invoice (a notification for an order this
 * deployment never created, e.g. from the other DOKU environment).
 */
export async function markPaid(
  invoice: string,
  paidAt: string
): Promise<{ order: Order | null; firstTime: boolean }> {
  const client = redis()

  const claimed = await client.set(`paid:${invoice}`, paidAt, {
    nx: true,
    ex: ORDER_TTL_SECONDS,
  })

  const order = await getOrder(invoice)
  if (!order) return { order: null, firstTime: false }

  // `set(..., {nx:true})` returns "OK" when it wrote, null when the key existed.
  const firstTime = claimed !== null

  if (firstTime) {
    await client.set(
      key(invoice),
      { ...order, status: 'PAID' as const, paidAt },
      { ex: ORDER_TTL_SECONDS }
    )
  }

  return { order: { ...order, status: 'PAID', paidAt }, firstTime }
}
