import { describe, it, expect } from 'vitest'
import { buildReceipt } from '@/lib/email/receipt'
import type { Order } from '@/lib/orders/store'

const ORDER: Order = {
  invoice: 'INV20260831ABCDEFGHJK',
  email: 'pembeli@contoh.test',
  name: 'Rina',
  amount: 128000,
  items: [
    { slug: 'sunyi-hanya-angan', title: 'Sunyi Hanya Angan', quantity: 1, price: 49000 },
    { slug: 'jurnal-draf-novel', title: 'Jurnal Draf Novel', quantity: 1, price: 79000 },
  ],
  createdAt: '2026-08-31T10:00:00.000Z',
  status: 'PAID',
  paidAt: '2026-08-31T10:05:00.000Z',
}

const LINKS = [
  {
    slug: 'sunyi-hanya-angan',
    title: 'Sunyi Hanya Angan',
    url: 'https://dsapoetra.com/unduh/abc.def',
  },
  { slug: 'jurnal-draf-novel', title: 'Jurnal Draf Novel', url: null },
]

function receipt(overrides: Partial<Parameters<typeof buildReceipt>[0]> = {}) {
  return buildReceipt({ order: ORDER, links: LINKS, expiresInDays: 30, ...overrides })
}

describe('buildReceipt', () => {
  it('names the order in the subject, so a reply thread is identifiable', () => {
    expect(receipt().subject).toContain('INV20260831ABCDEFGHJK')
  })

  it('greets by name when there is one, neutrally when there is not', () => {
    expect(receipt().text).toContain('Halo Rina,')
    const anonymous = receipt({ order: { ...ORDER, name: undefined } })
    expect(anonymous.text).toContain('Halo,')
    expect(anonymous.text).not.toContain('undefined')
  })

  it('puts the download link in both bodies', () => {
    const { text, html } = receipt()
    expect(text).toContain('https://dsapoetra.com/unduh/abc.def')
    expect(html).toContain('https://dsapoetra.com/unduh/abc.def')
  })

  it('always produces a text body — an HTML-only email reads as empty in some clients', () => {
    expect(receipt().text.trim().length).toBeGreaterThan(50)
  })

  it('formats the total as rupiah, not as a raw number', () => {
    expect(receipt().text).toContain('Rp 128.000')
    expect(receipt().text).not.toContain('128000')
  })

  it('states how long the links last', () => {
    expect(receipt({ expiresInDays: 7 }).text).toContain('7 hari')
  })

  it('lists products with no file separately rather than silently dropping them', () => {
    // Someone who paid for two things must see two things.
    const { text, html } = receipt()
    expect(text).toContain('Jurnal Draf Novel')
    expect(text).toMatch(/menyusul/i)
    expect(html).toContain('Jurnal Draf Novel')
  })

  it('omits the downloads section entirely when nothing has a file', () => {
    const none = receipt({ links: LINKS.map((l) => ({ ...l, url: null })) })
    expect(none.html).not.toContain('Unduhan kamu')
    expect(none.text).not.toContain('Unduhan kamu')
  })

  it('omits the "menyusul" section when everything has a file', () => {
    const all = receipt({
      links: LINKS.map((l) => ({ ...l, url: 'https://dsapoetra.com/unduh/x.y' })),
    })
    expect(all.html).not.toMatch(/Menyusul/)
  })

  it('escapes the buyer name in the HTML body', () => {
    // The name comes from a public form. This is the one place in the codebase
    // where untrusted input is put into markup without React escaping it.
    const nasty = receipt({
      order: { ...ORDER, name: '<script>alert(1)</script>' },
    })
    expect(nasty.html).not.toContain('<script>')
    expect(nasty.html).toContain('&lt;script&gt;')
  })

  it('escapes an invoice number containing markup characters', () => {
    const nasty = receipt({ order: { ...ORDER, invoice: 'INV"><img src=x>' } })
    expect(nasty.html).not.toContain('<img')
    expect(nasty.html).toContain('&quot;')
  })

  it('escapes a product title containing markup', () => {
    const nasty = receipt({
      links: [{ slug: 'a', title: '<b>Judul</b>', url: 'https://x.test/u' }],
    })
    expect(nasty.html).not.toContain('<b>Judul</b>')
    expect(nasty.html).toContain('&lt;b&gt;')
  })

  it('renders the paid date in Indonesian when there is one', () => {
    expect(receipt().text).toContain('31 Agustus 2026')
  })
})
