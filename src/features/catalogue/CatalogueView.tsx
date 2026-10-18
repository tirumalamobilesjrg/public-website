import { Pager } from '@/components/Pager'
import { ProductCardView } from '@/components/ProductCard'
import { listFacets, listProducts } from '@/lib/catalogue'
import type { CatalogueQuery } from '@/lib/catalogue-types'
import { publicImageUrl } from '@/lib/supabase/rest'

export type RawParams = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export function readQuery(p: RawParams): CatalogueQuery {
  const sort = one(p.sort)
  const page = Number(one(p.page))
  return {
    q: one(p.q)?.slice(0, 80),
    category: one(p.category),
    brand: one(p.brand),
    inStockOnly: one(p.stock) === 'in',
    sort: sort === 'name' ? 'name' : 'newest',
    page: Number.isInteger(page) && page > 0 && page < 10_000 ? page : 1,
  }
}

export function hrefWith(basePath: string, q: CatalogueQuery, page: number) {
  const s = new URLSearchParams()
  if (q.q) s.set('q', q.q)
  if (q.category && basePath === '/products') s.set('category', q.category)
  if (q.brand) s.set('brand', q.brand)
  if (q.inStockOnly) s.set('stock', 'in')
  if (q.sort === 'name') s.set('sort', 'name')
  if (page > 1) s.set('page', String(page))
  const qs = s.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

/** Filter form (plain GET, works without JavaScript), results grid and pager. `lockedCategory` fixes the category on /categories/[slug]. */
export async function CatalogueView({ basePath, params, lockedCategory }: { basePath: string; params: RawParams; lockedCategory?: string }) {
  const query = { ...readQuery(params), ...(lockedCategory ? { category: lockedCategory } : {}) }
  const [result, facets] = await Promise.all([listProducts(query).catch(() => null), listFacets().catch(() => null)])
  return (
    <>
      <form className="filters" action={basePath} role="search" aria-label="Search and filter">
        <div className="grow" style={{ flex: '1 1 14rem' }}>
          <label htmlFor="q">Search</label>
          <input id="q" type="search" name="q" defaultValue={query.q ?? ''} placeholder="Brand or model" autoComplete="off" />
        </div>
        {!lockedCategory && facets && facets.categories.length > 1 && (
          <div>
            <label htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={query.category ?? ''}>
              <option value="">All</option>
              {facets.categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
        )}
        {facets && facets.brands.length > 1 && (
          <div>
            <label htmlFor="brand">Brand</label>
            <select id="brand" name="brand" defaultValue={query.brand ?? ''}>
              <option value="">All</option>
              {facets.brands.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={query.sort}>
            <option value="newest">Newest first</option>
            <option value="name">Name A to Z</option>
          </select>
        </div>
        <label className="check"><input type="checkbox" name="stock" value="in" defaultChecked={query.inStockOnly} /> In stock only</label>
        <button className="btn" type="submit">Apply</button>
      </form>

      {result === null ? (
        <div className="empty" role="alert">
          <p>We could not load the catalogue. Please try again.</p>
          <p><a className="btn" href={hrefWith(basePath, query, query.page ?? 1)}>Try again</a></p>
        </div>
      ) : result.cards.length === 0 ? (
        <div className="empty">
          <h2>No products found</h2>
          <p>{query.q || query.brand || query.inStockOnly ? 'Try a different search or clear the filters.' : 'Nothing is listed here yet.'}</p>
          <p><a className="btn btn-ghost" href={basePath}>Clear filters</a></p>
        </div>
      ) : (
        <>
          <p className="muted" aria-live="polite">{result.total} {result.total === 1 ? 'product' : 'products'}</p>
          <ul className="grid">{result.cards.map((c) => <ProductCardView key={c.id} card={c} imageUrl={c.image ? publicImageUrl(c.image.storage_path) : null} />)}</ul>
          <Pager page={result.page} pages={result.pages} hrefFor={(p) => hrefWith(basePath, query, p)} />
        </>
      )}
    </>
  )
}
