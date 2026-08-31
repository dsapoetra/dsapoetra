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
   * Where the basket hands off to a real payment page.
   *
   * Site-wide, so it stays here rather than in `content/` — it is wiring, not
   * writing. Empty until a payment provider is connected; while it is empty the
   * shop still lists and the basket still works, but the basket says plainly
   * that payment is not connected rather than showing a button that goes
   * nowhere. A single product can override it with its own `buyUrl`.
   */
  checkoutUrl: '' as string,

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
