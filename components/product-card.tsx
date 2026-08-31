import type { Product, ProductTone } from '@/lib/products/types'
import { formatIDR } from '@/lib/format'
import AddToBasket from '@/components/add-to-basket'

/**
 * Covers are reversed panels, so each one uses its own background/foreground
 * pair from the palette rather than `--ink`/`--paper` — see the cover note in
 * globals.css for why the red and the coral must not follow `--accent` and
 * `--highlight` into dark mode.
 */
const TONE_CLASSES: Record<ProductTone, string> = {
  ink: 'bg-cover-ink text-on-cover-ink',
  accent: 'bg-cover-accent text-on-cover-accent',
  highlight: 'bg-cover-highlight text-on-cover-highlight',
}

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="flex flex-col rounded-sm border border-rule bg-card">
      <div
        className={`flex h-[150px] items-end p-5 ${TONE_CLASSES[product.cover.tone]}`}
      >
        {/*
          The caption is decoration, not information — the title sits right
          below it in real text — so it is hidden from assistive tech rather
          than read out twice in a slightly different form.
        */}
        <p aria-hidden="true" className="text-[22px] leading-tight whitespace-pre-line">
          {product.cover.caption}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
          {product.kind}
        </p>
        <h3 className="text-xl leading-snug">{product.title}</h3>
        <p className="leading-relaxed text-muted">{product.blurb}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3.5">
          <span className="font-mono text-base">{formatIDR(product.price)}</span>
          {/*
            A product with its own `buyUrl` sells itself — "Beli" goes straight
            there and it never enters the basket, which is what you want when a
            product already lives on Lynk, Karyakarsa or the like. Everything
            else goes through the basket and `site.checkoutUrl`.
          */}
          {product.buyUrl ? (
            <a
              href={product.buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm bg-ink px-4 py-2 font-sans text-sm text-paper transition-opacity hover:opacity-85"
            >
              Beli
              <span className="sr-only"> {product.title} (membuka di tab baru)</span>
            </a>
          ) : (
            <AddToBasket slug={product.slug} title={product.title} />
          )}
        </div>
      </div>
    </article>
  )
}
