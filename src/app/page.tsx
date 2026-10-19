import Image from 'next/image'
import Link from 'next/link'
import { ProductCardView } from '@/components/ProductCard'
import { listFacets, listProducts } from '@/lib/catalogue'
import { publicImageUrl } from '@/lib/supabase/rest'
import { BRAND_NAME, getShopProfile, phoneLinks } from '@/lib/shop'
import { contactFrom } from '@/lib/contact'
import { PhoneIcon, PinIcon, WhatsAppIcon } from '@/components/ContactIcons'

export default async function Home() {
  const [shop, facets, featured] = await Promise.all([getShopProfile(), listFacets().catch(() => null), listProducts({ inStockOnly: true }).catch(() => null)])
  const call = phoneLinks(shop.phone)
  const chat = phoneLinks(shop.whatsapp ?? shop.phone)
  const contact = contactFrom(call, chat)
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">{BRAND_NAME}</h1>
        <p>{shop.about ?? 'Mobile phones and accessories. Browse what is available, check prices, then visit the shop to see it in person.'}</p>
        {shop.address && (
          <p className="hero-address">
            <PinIcon size={18} /> {shop.address}
          </p>
        )}
        <form className="search-form" action="/products" role="search">
          <div className="grow">
            <label htmlFor="home-q">Search phones and accessories</label>
            <input id="home-q" type="search" name="q" placeholder="Brand or model" autoComplete="off" />
          </div>
          <button className="btn" type="submit">Search</button>
        </form>
        {(chat || call || shop.map_url) && (
          <div className="hero-actions">
            {chat && <a className="btn btn-wa" href={chat.wa} rel="noopener noreferrer"><WhatsAppIcon /> Chat on WhatsApp</a>}
            {call && <a className="btn btn-ghost" href={call.tel}><PhoneIcon /> Call</a>}
            {shop.map_url && <a className="btn btn-ghost" href={shop.map_url} rel="noopener noreferrer"><PinIcon /> Directions</a>}
          </div>
        )}
      </section>

      {facets && facets.categories.length > 0 && (
        <section aria-labelledby="cats">
          <h2 id="cats">Shop by category</h2>
          <ul className="cat-tiles">
            {facets.categories.map((c) => (
              <li key={c.slug} className={c.isPhoto ? 'cat-tile photo' : 'cat-tile'}>
                <Link href={`/categories/${c.slug}`}>
                  {c.imageUrl ? <Image src={c.imageUrl} alt="" width={480} height={360} sizes="(min-width:1100px) 280px, (min-width:700px) 30vw, 46vw" /> : <span className="cat-initial" aria-hidden="true">{c.name.trim().charAt(0).toUpperCase()}</span>}
                  <span className="cat-label"><span>{c.name}</span><small>{c.count} {c.count === 1 ? 'product' : 'products'}</small></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {facets && facets.brands.length > 0 && (
        <section aria-labelledby="brands">
          <h2 id="brands">Brands</h2>
          <ul className="brand-tiles">
            {facets.brands.map((b) => (
              <li key={b.slug}>
                <Link href={`/products?brand=${b.slug}`}>
                  {b.imageUrl ? <Image className="brand-logo-img" src={b.imageUrl} alt="" width={120} height={48} /> : <span className="tile-mark" aria-hidden="true">{b.name.trim().charAt(0).toUpperCase()}</span>}
                  <span>{b.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="featured">
        <h2 id="featured">In stock at the shop</h2>
        <p className="muted">As last updated by the shop. Call or visit to confirm before you travel.</p>
        {featured === null ? (
          <div className="empty" role="alert"><p>The catalogue could not be loaded right now. Please refresh in a moment.</p></div>
        ) : featured.cards.length === 0 ? (
          <div className="empty"><p>No products are listed yet. Please check back soon or visit the shop.</p></div>
        ) : (
          <>
            <ul className="grid">{featured.cards.slice(0, 8).map((c) => <ProductCardView key={c.id} card={c} contact={contact} imageUrl={c.image ? publicImageUrl(c.image.storage_path) : null} />)}</ul>
            <p><Link className="btn btn-ghost" href="/products">See all products</Link></p>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="visit">
        <h2 id="visit">Visit the shop</h2>
        {shop.address || call || chat ? (
          <>
            {shop.address && <p>{shop.address}</p>}
            {shop.opening_hours && <p>Open: {shop.opening_hours}</p>}
            <div className="actions">
              {chat && <a className="btn btn-wa" href={chat.wa} rel="noopener noreferrer"><WhatsAppIcon /> WhatsApp</a>}
              {call && <a className="btn btn-ghost" href={call.tel}><PhoneIcon /> Call now</a>}
              {shop.map_url && <a className="btn btn-ghost" href={shop.map_url} rel="noopener noreferrer"><PinIcon /> Get directions</a>}
            </div>
          </>
        ) : (
          <p>The address and phone number of the shop will appear here soon.</p>
        )}
      </section>
    </>
  )
}
