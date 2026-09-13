import 'server-only'

/**
 * DOKU credentials and environment.
 *
 * `server-only` at the top is load-bearing: importing this file from a client
 * component becomes a BUILD error rather than a secret quietly shipped in a
 * JavaScript bundle. Never remove it, and never import this module from
 * anything under a `'use client'` boundary.
 *
 * Set these with `vercel env add` (or in `.env.local` for development) — they
 * must never appear in the repository:
 *
 *   DOKU_CLIENT_ID    Client ID from the DOKU Back Office
 *   DOKU_SECRET_KEY   Secret Key from the DOKU Back Office
 *   DOKU_ENV          "sandbox" (default) or "production"
 *
 * Note the absence of `NEXT_PUBLIC_` on all three. A `NEXT_PUBLIC_` variable is
 * inlined into the browser bundle; the secret key there would let anyone forge
 * a payment notification and mark their own order paid.
 */

const ENDPOINTS = {
  sandbox: 'https://api-sandbox.doku.com',
  production: 'https://api.doku.com',
} as const

export type DokuEnvironment = keyof typeof ENDPOINTS

export type DokuConfig = {
  clientId: string
  secretKey: string
  environment: DokuEnvironment
  baseUrl: string
}

/** Path of the Checkout endpoint. Also the `Request-Target` that gets signed. */
export const CHECKOUT_PATH = '/checkout/v1/payment'

/**
 * Path DOKU posts notifications to. Must match the Notification URL configured
 * in the DOKU Back Office exactly, because it is part of the signed string.
 */
export const NOTIFICATION_PATH = '/api/doku/notification'

/**
 * Reads the configuration, or returns null when DOKU is not set up.
 *
 * Null rather than throwing, so the shop degrades the way the rest of the site
 * does: an unconfigured payment provider means the basket says checkout is
 * unavailable, not that the whole page 500s. Only the route handlers that
 * actually talk to DOKU turn a null into an error.
 */
export function dokuConfig(): DokuConfig | null {
  const clientId = process.env.DOKU_CLIENT_ID
  const secretKey = process.env.DOKU_SECRET_KEY

  if (!clientId || !secretKey) return null

  const requested = process.env.DOKU_ENV
  const environment: DokuEnvironment =
    requested === 'production' ? 'production' : 'sandbox'

  return {
    clientId,
    secretKey,
    environment,
    baseUrl: ENDPOINTS[environment],
  }
}

/** Whether checkout can run at all. Used to decide what the basket offers. */
export function isDokuConfigured(): boolean {
  return dokuConfig() !== null
}
