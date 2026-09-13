import { describe, it, expect } from 'vitest'
import { sheets, sheetNumber } from '@/lib/site'

describe('sheetNumber', () => {
  it('numbers the bound sheets in register order', () => {
    expect(sheetNumber('/', true)).toEqual({
      title: 'Beranda',
      number: 1,
      total: 5,
      dwg: 'DWG-001',
    })
    expect(sheetNumber('/tulisan', true)).toEqual({
      title: 'Tulisan',
      number: 3,
      total: 5,
      dwg: 'DWG-003',
    })
    expect(sheetNumber('/ulasan', true)).toEqual({
      title: 'Ulasan',
      number: 4,
      total: 5,
      dwg: 'DWG-004',
    })
  })

  // With the shop off, /toko is not bound — and everything after it moves up.
  // This is the whole reason the number is derived rather than written down.
  it('renumbers when the shop is switched off', () => {
    expect(sheetNumber('/tulisan', false)).toEqual({
      title: 'Tulisan',
      number: 2,
      total: 4,
      dwg: 'DWG-002',
    })
    expect(sheetNumber('/toko', false)).toBeNull()
  })

  it('gives no number to a page that is not a sheet', () => {
    expect(sheetNumber('/puisi/hujan', true)).toBeNull()
    // A book is a detail of the Ulasan sheet, not a sheet of its own.
    expect(sheetNumber('/ulasan/the-coaching-habit', true)).toBeNull()
  })

  it('keeps every href unique so a number cannot be claimed twice', () => {
    const hrefs = sheets.map((sheet) => sheet.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })
})
