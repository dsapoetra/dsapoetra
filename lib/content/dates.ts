/**
 * Dates on this site are two shapes and no more:
 *
 *   iso    2026-09-02        in dated lists and the Now stamp (printed as written)
 *   long   6 September 2026  in prose, under a title, on cards
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

/** `2 September 2026`. For prose and under titles. No leading zero. */
export function longDate(iso: string): string {
  const { year, month, day } = parts(iso)
  return `${day} ${MONTHS_LONG[month - 1]} ${year}`
}
