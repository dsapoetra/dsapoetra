'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { MAX_QUANTITY, type Quantities } from '@/lib/products/types'

const STORAGE_KEY = 'dsapoetra.keranjang.v1'

export type BasketSnapshot = {
  quantities: Quantities
  /**
   * False on the server and during hydration, true once the browser's stored
   * basket is the thing being rendered.
   *
   * The server has no storage and therefore no basket, so every visible count
   * has to wait for this — otherwise someone with three items in the basket
   * sees "kosong" flash before the real contents arrive.
   */
  ready: boolean
}

/**
 * The basket is `localStorage`, and `localStorage` is an external store — so it
 * is read through `useSyncExternalStore` rather than mirrored into React state
 * in an effect. That buys three things for free: no setState-in-effect cascade,
 * a hydration-safe server snapshot, and a single source of truth that several
 * components (the nav badge, the basket page) cannot drift apart on.
 *
 * This module knows NOTHING about which products exist — the catalogue lives in
 * `content/produk/` and is read on the server. So it stores whatever slugs it
 * is given, and callers reconcile against the real catalogue they were handed
 * as props (`sanitizeQuantities`, `basketLines`, `basketCount`). That is what
 * keeps a filesystem read out of the browser bundle.
 */
const EMPTY: BasketSnapshot = { quantities: {}, ready: false }

const listeners = new Set<() => void>()

/**
 * `useSyncExternalStore` compares snapshots by identity and re-renders forever
 * if `getSnapshot` returns a fresh object each call. So the parsed value is
 * cached against the raw string it came from, and only re-parsed when the raw
 * string actually changes.
 */
let cachedRaw: string | null = null
let cachedSnapshot: BasketSnapshot = { quantities: {}, ready: true }

/**
 * Reads the stored basket defensively. It is the visitor's own browser storage:
 * it can be absent, corrupt, from an older version of this file, or throw
 * outright in a locked-down browser. Any of those simply means "empty basket" —
 * none is worth breaking the page for.
 *
 * Slugs are NOT checked against the catalogue here; that happens where the
 * catalogue is known. A product deleted from `content/produk/` therefore lingers
 * in storage but is invisible everywhere it is read.
 */
function parse(raw: string | null): Quantities {
  if (!raw) return {}

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {}
  }

  const quantities: Quantities = {}
  for (const [slug, value] of Object.entries(parsed as Record<string, unknown>)) {
    const quantity = Math.floor(Number(value))
    if (Number.isFinite(quantity) && quantity > 0) {
      quantities[slug] = Math.min(quantity, MAX_QUANTITY)
    }
  }
  return quantities
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function getSnapshot(): BasketSnapshot {
  const raw = readRaw()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSnapshot = { quantities: parse(raw), ready: true }
  }
  return cachedSnapshot
}

function getServerSnapshot(): BasketSnapshot {
  return EMPTY
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange)
  // A second tab is the same person with the same basket. Without this they
  // diverge and whichever writes last wins silently.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

function write(next: Quantities): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Storage full or blocked. Fall through and still notify: the cached
    // snapshot below keeps the basket working for this page view, it just will
    // not survive a reload — better than crashing on a click.
    cachedRaw = null
    cachedSnapshot = { quantities: next, ready: true }
  }
  for (const listener of listeners) listener()
}

function update(change: (current: Quantities) => Quantities): void {
  write(change(getSnapshot().quantities))
}

function clamp(quantity: number): number {
  return Math.min(Math.max(Math.floor(quantity), 0), MAX_QUANTITY)
}

export function useBasket() {
  const { quantities, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const add = useCallback((slug: string, quantity = 1) => {
    update((current) => ({
      ...current,
      [slug]: clamp((current[slug] ?? 0) + Math.max(1, Math.floor(quantity))),
    }))
  }, [])

  const setQuantity = useCallback((slug: string, quantity: number) => {
    update((current) => {
      const next = { ...current }
      const clamped = clamp(quantity)
      if (clamped <= 0) {
        delete next[slug]
      } else {
        next[slug] = clamped
      }
      return next
    })
  }, [])

  const remove = useCallback((slug: string) => {
    update((current) => {
      const next = { ...current }
      delete next[slug]
      return next
    })
  }, [])

  const clear = useCallback(() => write({}), [])

  return { quantities, ready, add, setQuantity, remove, clear }
}
