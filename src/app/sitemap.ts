import type { MetadataRoute } from 'next'
import { listFacets, listSitemapProducts } from '@/lib/catalogue'
import { getEnv } from '@/lib/env'

export const dynamic = 'force-dynamic' // built from live public data at request time, never at build time; fetches are cached for REVALIDATE_SECONDS

/** Only static pages plus what the public views return (published products and categories that have one). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getEnv().siteUrl
  const [products, facets] = await Promise.all([listSitemapProducts(), listFacets()])
  return [
    ...['', '/products', '/about', '/contact', '/privacy'].map((p) => ({ url: `${base}${p}` })),
    ...facets.categories.map((c) => ({ url: `${base}/categories/${c.slug}` })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updated_at })),
  ]
}
