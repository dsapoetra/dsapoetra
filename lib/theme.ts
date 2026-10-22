/**
 * Two sides, stored under the CSS names. `light` is Angel, `dark` is Demon.
 *
 * There is no `auto` value: a reader who has never picked a side has nothing
 * stored, and the stylesheet's `prefers-color-scheme` query decides. A value
 * left over from the old three-way toggle (`auto`) fails `isTheme` and lands
 * in that same unpicked state.
 */
export const THEMES = ['light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const SIDE_NAMES: Record<Theme, string> = { light: 'Angel', dark: 'Demon' }

/** Where the choice is remembered. Shared by the toggle and the boot script. */
export const THEME_KEY = 'dsapoetra-theme'

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

/** Angel <-> Demon. */
export function nextTheme(current: Theme): Theme {
  return current === 'light' ? 'dark' : 'light'
}

/**
 * Runs before the page paints, from an inline script in the document body.
 *
 * Without this there is a flash: the server has no idea which side the reader
 * picked, so it sends the default markup, and a choice applied in an effect
 * lands one paint too late. Reading localStorage synchronously here is the
 * only way to have the right side on the very first frame.
 *
 * Nothing stored writes NO attribute. That hands the decision to the
 * `prefers-color-scheme` media query in the stylesheet, which keeps tracking a
 * system that changes while the page is open.
 *
 * Stringified and injected, so it must stay self-contained: no imports, no
 * closure over anything, and every access wrapped, because reading
 * localStorage throws outright in a browser with site data blocked.
 */
export const THEME_BOOT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_KEY)});
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`.trim()
