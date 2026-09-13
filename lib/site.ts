/**
 * One row in the homepage's "ask me anything" block.
 *
 * Declared explicitly, and applied to `links` with `as SiteLink[]`, so `href`
 * stays a plain `string`. Without it, the `as const` below narrows each href to
 * a string literal and the component's empty-href check becomes a type error
 * the moment every row is filled in.
 */
export type SiteLink = {
  label: string
  href: string
  icon: string
}

export const site = {
  /** Site identity. Matches the domain. */
  name: 'dsapoetra',

  /**
   * Personal name, if the bio should carry one alongside the handle.
   * Leave empty to show the handle alone — nothing fake is rendered when empty.
   */
  personalName: '',

  city: 'Jakarta',
  yearsWriting: 4,
  url: 'https://dsapoetra.com',

  /** Profile image in `public/`. Square; rendered as a circle. */
  avatar: '/dsapoetra.png',

  /**
   * ONE concrete, unglamorous, true detail about the writing life.
   * This is what stops the bio reading like a résumé.
   *
   * It is deliberately EMPTY and must be supplied by the owner — it cannot be
   * invented without making the whole bio ring false. While empty, the bio
   * renders without it rather than showing a placeholder.
   */
  detail: '',

  /**
   * "Ask me anything" links on the homepage.
   *
   * An entry with an empty `href` is skipped entirely, and if every entry is
   * empty the whole block disappears — same rule as `detail` above: nothing
   * fake is ever rendered. Fill in only the ones you actually use, and delete
   * the rest rather than leaving dead rows.
   *
   * `href` must be the full destination:
   *   instagram  https://www.instagram.com/<handle>/
   *   threads    https://www.threads.net/@<handle>
   *   github     https://github.com/<handle>
   *   whatsapp   https://wa.me/62<number without leading 0>
   *   email      mailto:you@example.com
   *
   * `icon` picks the glyph — see components/ask-me.tsx for the available names.
   */
  links: [
    { label: 'Instagram', href: 'https://www.instagram.com/dsapoetra/', icon: 'instagram' },
    { label: 'GitHub', href: 'https://github.com/dsapoetra', icon: 'github' },
    { label: 'Email', href: 'mailto:angga.dimassaputra@gmail.com', icon: 'email' },
  ] as SiteLink[],
} as const

/**
 * The sheet register.
 *
 * Every top-level page of this site is a sheet in one drawing set, and this is
 * the order they are bound in. It is the single source of truth for three
 * things that must never drift apart: the nav, the drawing number in the
 * wordmark (`DWG-003 · DSAPOETRA` on sheet three), and the `LEMBAR 3 / 4` field
 * in each sheet's title block.
 *
 * Adding a page means adding a row here — the numbering follows from the order,
 * so nothing has to be renumbered by hand.
 */
export type Sheet = {
  href: string
  /** Nav label, sentence case. Rendered uppercase. */
  label: string
  /** Shown in the sheet's own header band, e.g. `Tulisan`. */
  title: string
  /** Only bound into the set when there is something to sell. */
  shopOnly?: boolean
  /**
   * Route prefixes drawn on this sheet but living at their own URLs. A poem at
   * `/puisi/hujan` is a detail of the Tulisan sheet, so the nav marks TULISAN
   * while you read it; without this the poem would belong to no sheet and the
   * wordmark would drop its drawing number mid-visit.
   */
  owns?: string[]
}

export const sheets: Sheet[] = [
  { href: '/', label: 'Beranda', title: 'Beranda' },
  { href: '/toko', label: 'Toko', title: 'Toko', shopOnly: true, owns: ['/keranjang'] },
  {
    href: '/tulisan',
    label: 'Tulisan',
    title: 'Tulisan',
    owns: ['/puisi', '/cerita', '/ulasan'],
  },
  { href: '/sekarang', label: 'Sekarang', title: 'Sekarang' },
]

export type SheetNumber = {
  /** The sheet's own name, as printed in its header band and title block. */
  title: string
  /** 1-based position in the bound set. */
  number: number
  /** How many sheets are bound. */
  total: number
  /** Zero-padded drawing number, e.g. `DWG-003`. */
  dwg: string
}

/**
 * Where `href` sits in the set, given whether the shop is switched on.
 *
 * Returns `null` for a page that is not a sheet — a poem, a review, the basket.
 * Those are details drawn on a sheet, not sheets of their own, and they carry
 * no number.
 */
export function sheetNumber(href: string, shop: boolean): SheetNumber | null {
  const bound = sheets.filter((sheet) => (sheet.shopOnly ? shop : true))
  const index = bound.findIndex((sheet) => sheet.href === href)
  if (index === -1) return null

  return {
    title: bound[index].title,
    number: index + 1,
    total: bound.length,
    dwg: `DWG-${String(index + 1).padStart(3, '0')}`,
  }
}
