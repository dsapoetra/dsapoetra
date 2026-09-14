/**
 * Words per minute for prose read on a screen. Deliberately conservative:
 * these are short stories and case studies, not skimmable documentation, and
 * an estimate that runs slightly long reads as honest where one that runs
 * short reads as a lie.
 */
const WORDS_PER_MINUTE = 200

/**
 * Minutes to read `body`, rounded up, never zero.
 *
 * Computed rather than authored so the number cannot drift away from the text
 * after an edit. Frontmatter may still override it — see `readingTime` on the
 * story and case-study schemas — for the rare piece where the count lies,
 * usually because it is mostly code or mostly white space.
 */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
