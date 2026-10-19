import 'server-only'
import type { CatalogueQuery, ProductCard, PublicImage, PublicProduct, PublicSpec, PublicVariant } from './catalogue-types'
import { isSlug, primaryImage, priceSummary, searchFilter } from './format'
import { selectView } from './supabase/rest'

export const PAGE_SIZE = 12

const PRODUCT_COLS = 'id,slug,name,brand_name,brand_slug,category_name,category_slug,description,published_at,updated_at,availability'
const inList = (slugs: string[]) => `in.(${slugs.join(',')})` // slugs are validated [a-z0-9-] only

/** One page of published products with their price summary and main photo. Filters that are not valid slugs are ignored. */
export async function listProducts(query: CatalogueQuery): Promise<{ cards: ProductCard[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, Math.floor(query.page ?? 1))
  const params: Record<string, string> = { select: PRODUCT_COLS, order: query.sort === 'name' ? 'name.asc,id.asc' : 'published_at.desc,id.asc' }
  const filter = searchFilter(query.q ?? '')
  if (filter) params.and = filter
  if (query.category && isSlug(query.category)) params.category_slug = `eq.${query.category}`
  if (query.brand && isSlug(query.brand)) params.brand_slug = `eq.${query.brand}`
  if (query.inStockOnly) params.availability = 'eq.in_stock'
  const from = (page - 1) * PAGE_SIZE
  const { rows, total } = await selectView<PublicProduct>('public_catalogue_products', params, { from, to: from + PAGE_SIZE - 1 })
  return { cards: await withPrices(rows), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/** Every published product name (up to 200), for the compare picker. */
export async function listProductNames(): Promise<Array<{ slug: string; name: string }>> {
  const { rows } = await selectView<{ slug: string; name: string }>('public_catalogue_products', { select: 'slug,name', order: 'name.asc,id.asc', limit: '200' })
  return rows
}

async function withPrices(products: PublicProduct[]): Promise<ProductCard[]> {
  if (products.length === 0) return []
  const slugs = products.map((p) => p.slug).filter(isSlug)
  const filter = { product_slug: inList(slugs) }
  const [variants, images] = await Promise.all([
    selectView<PublicVariant>('public_catalogue_variants', { select: 'id,product_slug,public_price,availability,color,ram_gb,storage_gb', ...filter }),
    selectView<PublicImage>('public_catalogue_images', { select: 'id,product_slug,storage_path,alt_text,sort_order,is_primary', ...filter }),
  ])
  return products.map((p) => {
    const { fromPrice, priced } = priceSummary(variants.rows.filter((v) => v.product_slug === p.slug))
    return { ...p, fromPrice, priced, image: primaryImage(images.rows.filter((i) => i.product_slug === p.slug)) }
  })
}

export type ProductDetail = { product: PublicProduct; variants: PublicVariant[]; images: PublicImage[]; specs: PublicSpec[] }

/** null for an unknown, unpublished or malformed slug: the views only ever contain published products. */
export async function getProduct(slug: string): Promise<ProductDetail | null> {
  if (!isSlug(slug)) return null
  const { rows } = await selectView<PublicProduct>('public_catalogue_products', { select: PRODUCT_COLS, slug: `eq.${slug}`, limit: '1' })
  const product = rows[0]
  if (!product) return null
  const by = { product_slug: `eq.${slug}` }
  const [variants, images, specs] = await Promise.all([
    selectView<PublicVariant>('public_catalogue_variants', { select: 'id,product_slug,color,ram_gb,storage_gb,public_price,availability', order: 'storage_gb.asc.nullsfirst,ram_gb.asc.nullsfirst,id.asc', ...by }),
    selectView<PublicImage>('public_catalogue_images', { select: 'id,product_slug,storage_path,alt_text,sort_order,is_primary', order: 'sort_order.asc,id.asc', ...by }),
    selectView<PublicSpec>('public_catalogue_specifications', { select: 'id,product_slug,group_name,spec_key,spec_value,sort_order', order: 'sort_order.asc,id.asc', ...by }),
  ])
  return { product, variants: variants.rows, images: images.rows, specs: specs.rows }
}

export type Facet = { slug: string; name: string; count: number }

/** Categories and brands that have at least one published product, derived from the products view (bounded to 1000 rows). */
export async function listFacets(): Promise<{ categories: Facet[]; brands: Facet[] }> {
  const { rows } = await selectView<Pick<PublicProduct, 'category_slug' | 'category_name' | 'brand_slug' | 'brand_name'>>(
    'public_catalogue_products',
    { select: 'category_slug,category_name,brand_slug,brand_name', limit: '1000' },
  )
  const tally = (key: 'category' | 'brand'): Facet[] => {
    const m = new Map<string, Facet>()
    for (const r of rows) {
      const slug = r[`${key}_slug`]
      const hit = m.get(slug)
      if (hit) hit.count += 1
      else m.set(slug, { slug, name: r[`${key}_name`], count: 1 })
    }
    return [...m.values()].sort((a, b) => a.name.localeCompare(b.name))
  }
  return { categories: tally('category'), brands: tally('brand') }
}

/** Slugs and last-modified dates for the sitemap, paged so a large catalogue is still bounded per request. */
export async function listSitemapProducts(): Promise<Array<{ slug: string; updated_at: string }>> {
  const out: Array<{ slug: string; updated_at: string }> = []
  for (let from = 0; from < 5000; from += 1000) {
    const { rows } = await selectView<{ slug: string; updated_at: string }>('public_catalogue_products', { select: 'slug,updated_at', order: 'id.asc' }, { from, to: from + 999 })
    out.push(...rows)
    if (rows.length < 1000) break
  }
  return out
}
