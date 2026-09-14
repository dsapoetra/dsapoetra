import { describe, expect, it } from 'vitest'
import { isTheme, nextTheme, THEME_BOOT_SCRIPT, THEME_KEY } from './theme'

describe('nextTheme', () => {
  it('cycles auto to light to dark and back', () => {
    expect(nextTheme('auto')).toBe('light')
    expect(nextTheme('light')).toBe('dark')
    expect(nextTheme('dark')).toBe('auto')
  })
})

describe('isTheme', () => {
  it('accepts the three modes', () => {
    expect(isTheme('auto')).toBe(true)
    expect(isTheme('light')).toBe(true)
    expect(isTheme('dark')).toBe(true)
  })

  /*
   * localStorage is writable by anything on the origin and survives a
   * redeploy, so a stale or hand-edited value has to be rejected rather than
   * written onto the document as an attribute.
   */
  it('rejects anything else', () => {
    expect(isTheme('AUTO')).toBe(false)
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
   * `auto` must write no attribute at all. Writing `data-theme="auto"` would
   * match neither the light nor the dark selector and would silently pin the
   * reader to the light defaults on `:root`.
   */
  it('only ever writes light or dark', () => {
    expect(THEME_BOOT_SCRIPT).toContain("t === 'light' || t === 'dark'")
    expect(THEME_BOOT_SCRIPT).not.toContain("'auto')")
  })

  it('is a self-contained expression with no imports or bindings', () => {
    expect(THEME_BOOT_SCRIPT).not.toMatch(/\bimport\b|\brequire\(/)
    expect(() => new Function(THEME_BOOT_SCRIPT)).not.toThrow()
  })
})
