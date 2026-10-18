import Link from 'next/link'
import { ProductCardView } from '@/components/ProductCard'
import { listFacets, listProducts } from '@/lib/catalogue'
import { publicImageUrl } from '@/lib/supabase/rest'
import { BRAND_NAME, getShopProfile, phoneLinks } from '@/lib/shop'

export default async function Home() {
  const [shop, facets, featured] = await Promise.all([getShopProfile(), listFacets().catch(() => null), listProducts({ inStockOnly: true }).catch(() => null)])
  const call = phoneLinks(shop.phone)
  return (
    <>
      <section className="intro">
        <h1>{BRAND_NAME}</h1>
        <p>{shop.about ?? 'Mobile phones and accessories. Browse what is available, check prices, then visit the shop to see it in person.'}</p>
        <form className="search-form" action="/products" role="search">
          <div className="grow">
            <label htmlFor="home-q">Search phones and accessories</label>
            <input id="home-q" type="search" name="q" placeholder="Brand or model" autoComplete="off" />
          </div>
          <button className="btn" type="submit">Search</button>
        </form>
      </section>

      {facets && facets.categories.length > 0 && (
        <section aria-labelledby="cats">
          <h2 id="cats">Shop by category</h2>
          <ul className="chips">{facets.categories.map((c) => <li key={c.slug}><Link href={`/categories/${c.slug}`}>{c.name}</Link></li>)}</ul>
        </section>
      )}
      {facets && facets.brands.length > 0 && (
        <section aria-labelledby="brands">
          <h2 id="brands">Brands</h2>
          <ul className="chips">{facets.brands.map((b) => <li key={b.slug}><Link href={`/products?brand=${b.slug}`}>{b.name}</Link></li>)}</ul>
        </section>
      )}

      <section aria-labelledby="featured">
        <h2 id="featured">Available now</h2>
        {featured === null ? (
          <div className="empty" role="alert"><p>The catalogue could not be loaded right now. Please refresh in a moment.</p></div>
        ) : featured.cards.length === 0 ? (
          <div className="empty"><p>No products are listed yet. Please check back soon or visit the shop.</p></div>
        ) : (
          <>
            <ul className="grid">{featured.cards.slice(0, 8).map((c) => <ProductCardView key={c.id} card={c} imageUrl={c.image ? publicImageUrl(c.image.storage_path) : null} />)}</ul>
            <p><Link className="btn btn-ghost" href="/products">See all products</Link></p>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="visit">
        <h2 id="visit">Visit the shop</h2>
        {shop.address || call ? (
          <>
            {shop.address && <p>{shop.address}</p>}
            {shop.opening_hours && <p>Open: {shop.opening_hours}</p>}
            <div className="actions">
              {call && <a className="btn" href={call.tel}>Call now</a>}
              {call && <a className="btn btn-ghost" href={call.wa}>WhatsApp</a>}
              {shop.map_url && <a className="btn btn-ghost" href={shop.map_url} rel="noopener">Get directions</a>}
            </div>
          </>
        ) : (
          <p>The address and phone number of the shop will appear here soon.</p>
        )}
      </section>
    </>
  )
}
