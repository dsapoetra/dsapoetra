'use client'

import { useSyncExternalStore } from 'react'
import { isTheme, nextTheme, THEME_KEY, type Theme } from '@/lib/theme'

/*
 * The stored theme is external state: it lives in localStorage, it can change
 * in another tab, and the server cannot see it. `useSyncExternalStore` is the
 * hook for exactly that shape, and using it rather than an effect is what
 * makes the hydration handoff correct by construction — React renders the
 * server snapshot, then swaps to the client one in the same commit, with no
 * mismatch warning and no cascading render.
 */

const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // `storage` fires in OTHER tabs, so changing the theme in one syncs the rest.
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return isTheme(stored) ? stored : 'auto'
  } catch {
    // Site data blocked. The page works; the choice just will not persist.
    return 'auto'
  }
}

/**
 * The server has no reader to ask, so it always renders `auto`.
 *
 * This costs nothing visible: the COLOURS were already correct before first
 * paint, applied by the boot script in the root layout. Only this chip's own
 * label is briefly generic, and it settles on hydration.
 */
function getServerSnapshot(): Theme {
  return 'auto'
}

function applyTheme(value: Theme) {
  if (value === 'auto') {
    // No attribute at all, which hands the decision back to the
    // `prefers-color-scheme` query and keeps tracking a system that changes
    // while the page is open.
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', value)
  }

  try {
    localStorage.setItem(THEME_KEY, value)
  } catch {
    // Not being able to remember is no reason to fail to switch.
  }

  // `storage` does not fire in the tab that wrote it, so tell this one.
  listeners.forEach((listener) => listener())
}

/**
 * The theme switch: a hairline chip reading `auto`, `light` or `dark`.
 *
 * The boards never drew a control for this, so rather than invent an idiom the
 * site does not otherwise use, it borrows one it already has. This is the
 * tech-tag treatment from the Work page (mono 11px, lowercase, hairline box,
 * radius 4), and mono is this site's face for things read as a VALUE rather
 * than as language, which is what a mode name is.
 *
 * Three states, not two. A plain light/dark pair is a trap: once you touch it
 * you are pinned to that choice forever, and a reader whose phone turns dark
 * at sunset has no way back to following it. `auto` is the way back, and it is
 * the default.
 */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const upcoming = nextTheme(theme)
  const description = `Colour theme: ${theme}. Switch to ${upcoming}.`

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => applyTheme(upcoming)}
      aria-label={description}
      title={description}
    >
      {theme}
    </button>
  )
}
