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

  /**
   * ONE concrete, unglamorous, true detail about the writing life.
   * This is what stops the bio reading like a résumé.
   *
   * It is deliberately EMPTY and must be supplied by the owner — it cannot be
   * invented without making the whole bio ring false. While empty, the bio
   * renders without it rather than showing a placeholder.
   */
  detail: '',
} as const
