import type { Metadata } from 'next'
import { CatalogueView, type RawParams } from '@/features/catalogue/CatalogueView'

export const metadata: Metadata = {
  title: 'Mobile phones and accessories',
  description: 'Browse every phone and accessory listed by Tirumala Mobiles with public prices and availability.',
  alternates: { canonical: '/products' },
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  return (
    <>
      <h1>All products</h1>
      <CatalogueView basePath="/products" params={await searchParams} />
    </>
  )
}
