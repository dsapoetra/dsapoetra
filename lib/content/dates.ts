/**
 * Dates on this site are three shapes and no more, per the design handoff:
 *
 *   iso    2026-09-02        mono, in dated lists and the Now stamp
 *   long   6 September 2026  in prose, under a title
 *   short  Sep 2026          in the Writing lists, where the day is noise
 *
 * Every one of them is formatted in UTC. A date in frontmatter is a calendar
 * day, not an instant, and rendering `2026-09-01` through a Jakarta-local
 * formatter on a machine set to UTC turns it into 31 August. Pinning the
 * timeZone makes the output identical on a laptop, in CI and on Vercel.
 */

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * Splits `YYYY-MM-DD` by hand rather than through `new Date`.
 *
 * `new Date("2026-09-02")` is an instant at UTC midnight, and every method for
 * reading it back out is local-time. Working on the string keeps the calendar
 * day the author typed, which is the only thing that was ever meant.
 */
function parts(iso: string): { year: string; month: number; day: number } {
  const [year, month, day] = iso.split('-')
  return { year, month: Number(month), day: Number(day) }
}

/** `2026-09-02`. The date exactly as written; used in mono. */
export function isoDate(iso: string): string {
  return iso
}

/** `2 September 2026`. For prose and under titles. No leading zero. */
export function longDate(iso: string): string {
  const { year, month, day } = parts(iso)
  return `${day} ${MONTHS_LONG[month - 1]} ${year}`
}

/** `Sep 2026`. For the Writing lists, where the day carries nothing. */
export function shortDate(iso: string): string {
  const { year, month } = parts(iso)
  return `${MONTHS_SHORT[month - 1]} ${year}`
}

/**
 * Joins meta fragments with the site's separator, dropping anything empty.
 *
 * Every meta line on the site is some subset of date, reading time and
 * language, and which parts exist varies per piece. Filtering here is what
 * stops a poem with no reading time from rendering `Sep 2026 ·` with a
 * separator hanging off the end.
 */
export function meta(...fragments: Array<string | false | null | undefined>): string {
  return fragments.filter(Boolean).join(' · ')
}
