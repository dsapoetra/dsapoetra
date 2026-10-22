import { describe, expect, it } from 'vitest'
import { isTheme, nextTheme, THEME_BOOT_SCRIPT, THEME_KEY } from './theme'

describe('nextTheme', () => {
  it('flips Angel to Demon and back', () => {
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('light')
  })
})

describe('isTheme', () => {
  it('accepts the two sides', () => {
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
  })

  /*
   * localStorage is writable by anything on the origin and survives a
   * redeploy, so a stale or hand-edited value has to be rejected rather than
   * written onto the document as an attribute. `auto` is the stale value the
   * old three-way toggle left behind.
   */
  it('rejects anything else', () => {
    expect(isTheme('auto')).toBe(false)
    expect(isTheme('LIGHT')).toBe(false)
    expect(isTheme('')).toBe(false)
    expect(isTheme(null)).toBe(false)
    expect(isTheme(undefined)).toBe(false)
    expect(isTheme(0)).toBe(false)
  })
})

describe('THEME_BOOT_SCRIPT', () => {
  it('reads the same key the toggle writes', () => {
    expect(THEME_BOOT_SCRIPT).toContain(JSON.stringify(THEME_KEY))
  })

  /*
   * The script is injected inline, so a stray `</script>` in it would end the
   * tag early and dump the rest onto the page as text.
   */
  it('contains nothing that would close its own tag', () => {
    expect(THEME_BOOT_SCRIPT.toLowerCase()).not.toContain('</script')
  })

  it('survives localStorage throwing', () => {
    expect(THEME_BOOT_SCRIPT).toContain('try')
    expect(THEME_BOOT_SCRIPT).toContain('catch')
  })

  /*
   * Anything else must write no attribute at all. `data-theme="auto"` would
   * match neither side's selector and silently pin the reader to Angel.
   */
  it('only ever writes light or dark', () => {
    expect(THEME_BOOT_SCRIPT).toContain("t === 'light' || t === 'dark'")
  })

  it('is a self-contained expression with no imports or bindings', () => {
    expect(THEME_BOOT_SCRIPT).not.toMatch(/\bimport\b|\brequire\(/)
    expect(() => new Function(THEME_BOOT_SCRIPT)).not.toThrow()
  })
})
