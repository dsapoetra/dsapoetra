import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { loadProducts } from '@/lib/products/load'
import SectionLabel from '@/components/section-label'
import BasketView from './basket-view'

export const metadata: Metadata = {
  title: 'Keranjang — dsapoetra',
  description: 'Barang yang sudah dipilih dari toko.',
  // Someone else's basket is nothing for a crawler to index.
  robots: { index: false, follow: true },
}

export default async function KeranjangPage() {
  const products = await loadProducts()
  if (products.length === 0) notFound()

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <SectionLabel>Keranjang</SectionLabel>
      {/*
        The catalogue is read here, on the server, and handed to the client
        component — the basket itself only ever holds slugs and quantities.
      */}
      <BasketView products={products} />
    </div>
  )
}
