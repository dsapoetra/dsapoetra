import type { Order } from '@/lib/orders/store'
import { formatIDR, formatDateId } from '@/lib/format'

/**
 * The email a buyer gets once payment lands.
 *
 * Pure: an order and its links in, a subject and two bodies out. No network, no
 * provider — so the wording and the escaping can be tested properly, and
 * swapping the sending service never touches the message.
 *
 * Both a text and an HTML body are produced. The text one is not a courtesy:
 * a mail client that shows it, or a spam filter that only reads it, would
 * otherwise see an empty message, and an HTML-only email scores worse.
 */

export type DeliveryLink = {
  slug: string
  title: string
  /** Absolute signed URL, or null when the product has no file attached. */
  url: string | null
}

/**
 * Escapes text for HTML.
 *
 * The buyer's own name goes into this email. It arrives from a public form, so
 * it is untrusted input being placed in markup — the one place in this codebase
 * where that happens without React doing the escaping.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export type Receipt = { subject: string; text: string; html: string }

export function buildReceipt({
  order,
  links,
  expiresInDays,
  siteName = 'dsapoetra',
}: {
  order: Order
  links: DeliveryLink[]
  expiresInDays: number
  siteName?: string
}): Receipt {
  const greeting = order.name ? `Halo ${order.name},` : 'Halo,'
  const withFiles = links.filter((link) => link.url !== null)
  const withoutFiles = links.filter((link) => link.url === null)

  const lines: string[] = [
    greeting,
    '',
    'Terima kasih sudah membeli. Pembayaran kamu sudah diterima.',
    '',
    `Nomor pesanan: ${order.invoice}`,
    `Total: ${formatIDR(order.amount)}`,
    ...(order.paidAt ? [`Tanggal: ${formatDateId(order.paidAt.slice(0, 10))}`] : []),
    '',
  ]

  if (withFiles.length > 0) {
    lines.push('Unduhan kamu:', '')
    for (const link of withFiles) {
      lines.push(`${link.title}`, `${link.url}`, '')
    }
    lines.push(
      `Tautan di atas berlaku ${expiresInDays} hari dan hanya untuk kamu.`,
      'Kalau sudah kedaluwarsa, balas email ini dan saya kirim ulang.',
      ''
    )
  }

  if (withoutFiles.length > 0) {
    lines.push(
      'Yang ini saya kirim menyusul, langsung dari saya:',
      '',
      ...withoutFiles.map((link) => `- ${link.title}`),
      ''
    )
  }

  lines.push('Ada yang tidak beres? Balas email ini.', '', siteName)

  const html = `<!doctype html>
<html lang="id">
<body style="margin:0;padding:24px;background:#f8f5ef;color:#151b26;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6">
  <div style="max-width:560px;margin:0 auto">
    <p>${escapeHtml(greeting)}</p>
    <p>Terima kasih sudah membeli. Pembayaran kamu sudah diterima.</p>

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#5c6470">
      <tr><td style="padding-right:16px">Nomor pesanan</td><td style="color:#151b26">${escapeHtml(order.invoice)}</td></tr>
      <tr><td style="padding-right:16px">Total</td><td style="color:#151b26">${escapeHtml(formatIDR(order.amount))}</td></tr>
    </table>
${
  withFiles.length > 0
    ? `    <h2 style="font-size:18px;font-weight:500;border-bottom:1px solid #151b26;padding-bottom:8px">Unduhan kamu</h2>
${withFiles
  .map(
    (link) => `    <p style="margin:20px 0">
      <strong style="font-weight:600">${escapeHtml(link.title)}</strong><br>
      <a href="${escapeHtml(link.url as string)}" style="display:inline-block;margin-top:8px;background:#151b26;color:#f8f5ef;text-decoration:none;padding:10px 18px;border-radius:2px;font-family:Arial,sans-serif;font-size:14px">Unduh</a>
    </p>`
  )
  .join('\n')}
    <p style="color:#5c6470;font-size:14px">Tautan di atas berlaku ${expiresInDays} hari dan hanya untuk kamu. Kalau sudah kedaluwarsa, balas email ini dan saya kirim ulang.</p>`
    : ''
}
${
  withoutFiles.length > 0
    ? `    <h2 style="font-size:18px;font-weight:500;border-bottom:1px solid #151b26;padding-bottom:8px">Menyusul</h2>
    <p>Yang ini saya kirim langsung, tidak lewat tautan otomatis:</p>
    <ul>${withoutFiles.map((link) => `<li>${escapeHtml(link.title)}</li>`).join('')}</ul>`
    : ''
}
    <p style="margin-top:32px;color:#5c6470;font-size:14px">Ada yang tidak beres? Balas email ini.</p>
    <p style="color:#5c6470;font-family:ui-monospace,Menlo,monospace;font-size:12px">${escapeHtml(siteName)}</p>
  </div>
</body>
</html>`

  return {
    subject: `Pesanan ${order.invoice} — unduhan kamu`,
    text: lines.join('\n'),
    html,
  }
}
