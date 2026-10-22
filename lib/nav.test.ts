import { describe, expect, it } from 'vitest'
import { activeHref } from './nav'

describe('activeHref', () => {
  it('marks nothing on the homepage', () => {
    expect(activeHref('/')).toBeNull()
  })

  it('marks the section itself', () => {
    expect(activeHref('/creation')).toBe('/creation')
    expect(activeHref('/about')).toBe('/about')
    expect(activeHref('/now')).toBe('/now')
  })

  it('marks the owning wing for a piece at its own short URL', () => {
    expect(activeHref('/creation/strangling-a-monolith')).toBe('/creation')
    expect(activeHref('/notes/outbox-pattern')).toBe('/creation')
    expect(activeHref('/poems/ledger')).toBeNull()
  })

  /*
   * Prefix matching has to be by segment. Substring matching would let
   * `/notes` claim a future `/notebooks` and mark the wrong wing.
   */
  it('does not claim a route that merely starts with the same letters', () => {
    expect(activeHref('/notebooks')).toBeNull()
    expect(activeHref('/creations')).toBeNull()
  })
})
