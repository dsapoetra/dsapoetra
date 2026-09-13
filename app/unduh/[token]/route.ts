import { NextResponse } from 'next/server'
import { verifyDownload } from '@/lib/download/token'
import { readProductFile } from '@/lib/download/files'
import { downloadSecret } from '@/lib/download/config'
import { findProduct } from '@/lib/products/types'
import { loadProducts } from '@/lib/products/load'

/**
 * The private download link from the confirmation email.
 *
 * The token IS the authorization. Nothing here reads a session or a cookie —
 * whoever holds the link gets the file, which is exactly the property that lets
 * it work from an email client, on any device, without an account.
 *
 * That also means the link is a bearer credential: forwarding the email
 * forwards the product. It is scoped to one product and expires, which is the
 * right trade for a shop this size; anything stricter needs accounts.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<'/unduh/[token]'>
) {
  const secret = downloadSecret()
  if (!secret) {
    return NextResponse.json({ error: 'Unduhan belum tersedia.' }, { status: 503 })
  }

  const { token } = await params
  const result = verifyDownload(token, secret)

  if (!result.ok) {
    // An expired link is a real link whose time ran out, so it says so and can
    // be re-sent. A bad signature is indistinguishable from an attack and gets
    // nothing back that would help someone probe.
    const expired = result.reason === 'expired'
    return NextResponse.json(
      {
        error: expired
          ? 'Tautan unduhan sudah kedaluwarsa. Balas email pesanan kamu dan saya kirim ulang.'
          : 'Tautan unduhan tidak valid.',
      },
      { status: expired ? 410 : 404 }
    )
  }

  const products = await loadProducts()
  const product = findProduct(products, result.claim.slug)

  if (!product?.download) {
    return NextResponse.json({ error: 'Berkas tidak tersedia.' }, { status: 404 })
  }

  const file = await readProductFile(product.download)
  if (!file) {
    // The token is valid but the file is gone — a deployment problem, not the
    // buyer's. Log loudly; they get told to ask rather than being told the link
    // is invalid, which it is not.
    console.error(
      JSON.stringify({
        event: 'download.file_missing',
        slug: product.slug,
        download: product.download,
        invoice: result.claim.invoice,
      })
    )
    return NextResponse.json(
      { error: 'Berkas belum siap. Balas email pesanan kamu dan saya kirim manual.' },
      { status: 503 }
    )
  }

  console.log(
    JSON.stringify({
      event: 'download.served',
      invoice: result.claim.invoice,
      slug: product.slug,
    })
  )

  // The filename the buyer sees. Built from the product title rather than the
  // internal filename, and stripped to ASCII so the header cannot be broken by
  // a quote or a newline in a title.
  const safeName = `${product.title.replace(/[^A-Za-z0-9 _-]/g, '')}`.trim() || 'unduhan'
  const extension = product.download.slice(product.download.lastIndexOf('.'))

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      'Content-Type': file.contentType,
      'Content-Length': String(file.bytes.length),
      'Content-Disposition': `attachment; filename="${safeName}${extension}"`,
      // A signed, expiring link must never be cached by a shared cache, and
      // must not be indexed if it ever leaks into a crawler's path.
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
