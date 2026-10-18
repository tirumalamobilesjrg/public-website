import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CatalogueView, type RawParams } from '@/features/catalogue/CatalogueView'
import { listFacets } from '@/lib/catalogue'
import { isSlug } from '@/lib/format'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> }

async function findCategory(slug: string) {
  if (!isSlug(slug)) return null
  const facets = await listFacets() // a catalogue outage throws, so it shows the error page rather than a false "not found"
  return facets.categories.find((c) => c.slug === slug) ?? null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = await findCategory(slug)
  if (!cat) return { title: 'Category not found', robots: { index: false } }
  return { title: cat.name, description: `${cat.name} at Tirumala Mobiles: public prices and availability.`, alternates: { canonical: `/categories/${slug}` } }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const cat = await findCategory(slug)
  if (!cat) notFound()
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/products">Products</Link></li>
          <li aria-current="page">{cat.name}</li>
        </ol>
      </nav>
      <h1>{cat.name}</h1>
      <CatalogueView basePath={`/categories/${slug}`} params={await searchParams} lockedCategory={slug} />
    </>
  )
}
