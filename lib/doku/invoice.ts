import { randomBytes } from 'node:crypto'

/**
 * Order reference sent to DOKU as `order.invoice_number`.
 *
 * Constrained by DOKU's own limits, which are tighter than they first look:
 * 64 characters generally, but only 30 when the Credit Card channel is on, and
 * KKI rejects symbols entirely. So: uppercase letters and digits only, no
 * hyphens, and short enough for the strictest channel.
 *
 * Shape: `INV` + `YYYYMMDD` + 10 random base32 characters = 21 characters.
 *
 * The date is there so the reference is legible in the DOKU Back Office when
 * fulfilling an order by hand. The random tail is what makes it unique — a
 * counter would need storage, and this has no database behind it.
 */

// Crockford-style alphabet: no I, L, O or U, so a reference read off a screen
// and typed into an email cannot turn into a different one.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const RANDOM_LENGTH = 10

export function newInvoiceNumber(now: Date = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')

  // Rejection-free: 256 is not a multiple of 32, so the raw byte would bias the
  // first 8 symbols. Masking to 5 bits gives a uniform draw from the alphabet.
  const bytes = randomBytes(RANDOM_LENGTH)
  let tail = ''
  for (const byte of bytes) tail += ALPHABET[byte & 31]

  return `INV${date}${tail}`
}

/** Whether a string could be one of ours. Used to sanity-check notifications. */
export function looksLikeInvoiceNumber(value: string): boolean {
  return new RegExp(`^INV\\d{8}[${ALPHABET}]{${RANDOM_LENGTH}}$`).test(value)
}
