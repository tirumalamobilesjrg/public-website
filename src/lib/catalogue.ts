import 'server-only'
import type { CatalogueQuery, ProductCard, PublicImage, PublicProduct, PublicSpec, PublicVariant } from './catalogue-types'
import { isSlug, primaryImage, priceSummary, searchFilter } from './format'
import { isBrandLogoPath, isCategoryImagePath } from './media'
import { brandLogoUrl, categoryImageUrl, publicImageUrl, selectView } from './supabase/rest'

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

/** `imageUrl` is the brand's logo, or the category's picture; for a category without one it is the photo of its newest product (`isPhoto`). */
export type Facet = { slug: string; name: string; count: number; imageUrl: string | null; isPhoto: boolean }

type FacetRow = Pick<PublicProduct, 'category_slug' | 'category_name' | 'brand_slug' | 'brand_name'> & { brand_logo_path?: string | null; category_image_path?: string | null }

/** The two path columns arrived with backend migration 0027; against a database without it the facets still work, just without pictures. */
async function facetRows(): Promise<FacetRow[]> {
  const base = 'category_slug,category_name,brand_slug,brand_name'
  const params = { order: 'published_at.desc,id.asc', limit: '1000' }
  try {
    return (await selectView<FacetRow>('public_catalogue_products', { select: `${base},slug,brand_logo_path,category_image_path`, ...params })).rows
  } catch {
    return (await selectView<FacetRow>('public_catalogue_products', { select: `${base},slug`, ...params })).rows
  }
}

/** Categories and brands that have at least one published product, derived from the products view (bounded to 1000 rows, newest first). */
export async function listFacets(): Promise<{ categories: Facet[]; brands: Facet[] }> {
  const rows = (await facetRows()) as Array<FacetRow & { slug?: string }>
  const brands = new Map<string, Facet>()
  const categories = new Map<string, Facet & { newest?: string }>()
  for (const r of rows) {
    const b = brands.get(r.brand_slug)
    if (b) {
      b.count += 1
      if (!b.imageUrl && isBrandLogoPath(r.brand_logo_path)) b.imageUrl = brandLogoUrl(r.brand_logo_path)
    } else {
      brands.set(r.brand_slug, { slug: r.brand_slug, name: r.brand_name, count: 1, imageUrl: isBrandLogoPath(r.brand_logo_path) ? brandLogoUrl(r.brand_logo_path) : null, isPhoto: false })
    }
    const c = categories.get(r.category_slug)
    if (c) {
      c.count += 1
      if (!c.imageUrl && isCategoryImagePath(r.category_image_path)) c.imageUrl = categoryImageUrl(r.category_image_path)
    } else {
      categories.set(r.category_slug, { slug: r.category_slug, name: r.category_name, count: 1, imageUrl: isCategoryImagePath(r.category_image_path) ? categoryImageUrl(r.category_image_path) : null, isPhoto: false, newest: r.slug })
    }
  }
  // A category without its own picture shows the photo of its newest product, if that product has one.
  const wanting = [...categories.values()].filter((c) => !c.imageUrl && c.newest && isSlug(c.newest))
  if (wanting.length > 0) {
    try {
      const { rows: images } = await selectView<PublicImage>('public_catalogue_images', {
        select: 'id,product_slug,storage_path,alt_text,sort_order,is_primary',
        product_slug: inList(wanting.map((c) => c.newest as string)),
      })
      for (const c of wanting) {
        const photo = primaryImage(images.filter((i) => i.product_slug === c.newest))
        if (photo) {
          c.imageUrl = publicImageUrl(photo.storage_path)
          c.isPhoto = true
        }
      }
    } catch {
      // pictures are decoration: the tile falls back to its name
    }
  }
  const byName = (a: Facet, b: Facet) => a.name.localeCompare(b.name)
  return { categories: [...categories.values()].map(({ newest: _n, ...f }) => f).sort(byName), brands: [...brands.values()].sort(byName) }
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
