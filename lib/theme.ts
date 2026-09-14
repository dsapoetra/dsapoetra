export const THEMES = ['auto', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

/** Where the choice is remembered. Shared by the toggle and the boot script. */
export const THEME_KEY = 'dsapoetra-theme'

export function isTheme(value: unknown): value is Theme {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value)
}

/** auto -> light -> dark -> auto. */
export function nextTheme(current: Theme): Theme {
  return THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]
}

/**
 * Runs before the page paints, from an inline script in the document body.
 *
 * Without this there is a flash: the server has no idea what the reader chose,
 * so it sends the default markup, and a choice applied in an effect lands one
 * paint too late. Reading localStorage synchronously here is the only way to
 * have the right theme on the very first frame.
 *
 * `auto` deliberately writes NO attribute. That hands the decision back to the
 * `prefers-color-scheme` media query in the stylesheet, which is what "follow
 * the system" has to mean for it to keep tracking a system that changes while
 * the page is open.
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
