'use client'

import { useSyncExternalStore } from 'react'
import { isTheme, nextTheme, SIDE_NAMES, THEME_KEY, type Theme } from '@/lib/theme'

/*
 * The current side is external state: it lives in localStorage (or, unpicked,
 * in the OS setting), it can change in another tab, and the server cannot see
 * it. `useSyncExternalStore` is the hook for exactly that shape, and using it
 * rather than an effect makes the hydration handoff correct by construction.
 */

const listeners = new Set<() => void>()
const DARK_QUERY = '(prefers-color-scheme: dark)'

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // `storage` fires in OTHER tabs, so picking a side in one syncs the rest.
  window.addEventListener('storage', listener)
  // Unpicked readers follow the OS, which can flip at sunset mid-visit.
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
    media.removeEventListener('change', listener)
  }
}

function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (isTheme(stored)) return stored
  } catch {
    // Site data blocked. The page works; the choice just will not persist.
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * The server has no reader to ask. It renders no side, and only the button's
 * accessible name is briefly generic: the ICON is chosen by the stylesheet
 * from the same tokens as the colours, so it is right before first paint.
 */
function getServerSnapshot(): Theme | null {
  return null
}

function applyTheme(value: Theme) {
  document.documentElement.setAttribute('data-theme', value)

  try {
    localStorage.setItem(THEME_KEY, value)
  } catch {
    // Not being able to remember is no reason to fail to switch.
  }

  // `storage` does not fire in the tab that wrote it, so tell this one.
  listeners.forEach((listener) => listener())
}

/**
 * Pick a side: a halo while you are on the Angel side, horns on the Demon one.
 * One click crosses over and is remembered.
 */
export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const label = theme
    ? `Pick a side. Now ${SIDE_NAMES[theme]}, switch to ${SIDE_NAMES[nextTheme(theme)]}.`
    : 'Pick a side: Angel or Demon.'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => applyTheme(nextTheme(theme ?? getSnapshot()))}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="12" cy="15" r="5" />
        <ellipse className="theme-toggle__halo" cx="12" cy="5" rx="6.5" ry="2" />
        <path className="theme-toggle__horns" d="M8.6 11.3 6.5 4.5l4 5.2M15.4 11.3l2.1-6.8-4 5.2" />
      </svg>
    </button>
  )
}
