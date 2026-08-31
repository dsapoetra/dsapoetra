/**
 * Presentation-only formatters. Everything stored in content and config stays
 * machine-readable — ISO dates, integer rupiah — and is turned into Indonesian
 * prose here, at the edge, so sorting and arithmetic never touch a formatted
 * string.
 */

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

/**
 * `2026-08-30` → `30 Agustus 2026`.
 *
 * Deliberately hand-rolled rather than `Intl.DateTimeFormat`: parsing the ISO
 * string with `new Date()` would read it as UTC midnight and then render it in
 * the *runtime's* zone, so a build machine west of Greenwich silently shows the
 * previous day. Splitting the string keeps the date the author wrote.
 *
 * A string that is not `YYYY-MM-DD` is returned untouched — the loaders already
 * validate this shape, so a surprise here should stay visible rather than be
 * turned into `NaN Undefined`.
 */
export function formatDateId(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso

  const [, year, month, day] = match
  const name = MONTHS_ID[Number(month) - 1]
  if (!name) return iso

  return `${Number(day)} ${name} ${year}`
}

/** `2026-08-30` → `30.08.2026`. The compact form used in dense lists. */
export function formatDateShortId(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return iso

  const [, year, month, day] = match
  return `${day}.${month}.${year}`
}

/** `2026-08-30` → `2026`. */
export function yearOf(iso: string): string {
  return iso.slice(0, 4)
}

/**
 * `49000` → `Rp 49.000`. Prices are whole rupiah; the currency has no
 * sub-unit in practice, so nothing is ever shown after the separator.
 */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount)
  const sign = rounded < 0 ? '-' : ''
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}Rp ${digits}`
}
