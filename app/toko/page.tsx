import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadProducts } from '@/lib/products/load'
import SectionLabel from '@/components/section-label'
import ProductCard from '@/components/product-card'

export const metadata: Metadata = {
  title: 'Toko — dsapoetra',
  description: 'Buku, template, dan kelas menulis. Unduhan langsung setelah bayar.',
}

export default async function TokoPage() {
  const products = await loadProducts()

  // Nothing for sale means this page should not exist rather than exist empty —
  // and the nav already hides itself under the same condition.
  if (products.length === 0) notFound()

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <SectionLabel>Toko</SectionLabel>

      <p className="mt-6 max-w-prose-measure text-lg leading-8">
        Beberapa hal yang sudah selesai saya kerjakan dan bisa dibawa pulang.
        Unduhan langsung setelah bayar.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  )
}
