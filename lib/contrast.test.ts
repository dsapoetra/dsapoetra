import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Reads the side palettes straight out of globals.css, so a token nudged in
 * the stylesheet is re-checked here without anyone copying a hex across.
 */
const css = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8')

function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  if (!match) throw new Error(`--${name} is not a six-digit hex in globals.css`)
  return match[1]
}

/** WCAG 2 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe.each(['angel', 'demon'])('%s side', (side) => {
  it.each(
    ['fg', 'fg2', 'fg3', 'acc'].flatMap((text) =>
      ['bg', 'card', 'sunk'].map((surface) => [text, surface])
    )
  )('--%s on --%s is at least 4.5:1', (text, surface) => {
    expect(ratio(token(`${side}-${text}`), token(`${side}-${surface}`))).toBeGreaterThanOrEqual(4.5)
  })
})

it('ratio() matches the known black-on-white value', () => {
  expect(ratio('#000000', '#ffffff')).toBeCloseTo(21, 5)
})
