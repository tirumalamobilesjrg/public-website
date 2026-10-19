import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Gallery } from '@/components/Gallery'
import { AvailabilityBadge, Price } from '@/components/ProductCard'
import { getProduct } from '@/lib/catalogue'
import { formatPrice, primaryImage, priceSummary, variantLabel } from '@/lib/format'
import { BRAND_NAME, getShopProfile, phoneLinks } from '@/lib/shop'
import { publicImageUrl } from '@/lib/supabase/rest'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getProduct(slug)
  if (!d) return { title: 'Product not found', robots: { index: false } }
  const { fromPrice } = priceSummary(d.variants)
  const img = primaryImage(d.images)
  const description = (d.product.description?.slice(0, 155) ?? `${d.product.name} by ${d.product.brand_name} at ${BRAND_NAME}.`) + (fromPrice !== null ? ` From ${formatPrice(fromPrice)}.` : '')
  return {
    title: d.product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: d.product.name, description, type: 'website', images: img ? [publicImageUrl(img.storage_path)] : undefined },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const d = await getProduct(slug)
  if (!d) notFound()
  const shop = await getShopProfile()
  const call = phoneLinks(shop.phone)
  const chat = phoneLinks(shop.whatsapp ?? shop.phone)
  const { product, variants, images, specs } = d
  const main = primaryImage(images)
  const sortedImages = main ? [main, ...images.filter((i) => i.id !== main.id)] : images
  const groups = [...new Set(specs.map((s) => s.group_name))]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    brand: { '@type': 'Brand', name: product.brand_name },
    category: product.category_name,
    ...(product.description ? { description: product.description } : {}),
    ...(main ? { image: publicImageUrl(main.storage_path) } : {}),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/products">Products</Link></li>
          <li><Link href={`/categories/${product.category_slug}`}>{product.category_name}</Link></li>
          <li aria-current="page">{product.name}</li>
        </ol>
      </nav>
      <div className="detail">
        <Gallery images={sortedImages.map((i) => ({ url: publicImageUrl(i.storage_path), alt: i.alt_text ?? '' }))} fallbackAlt={product.name} />
        <div>
          <p className="brand-line">{product.brand_name}</p>
          <h1>{product.name}</h1>
          <p><AvailabilityBadge value={product.availability} /></p>
          {product.description && <p>{product.description}</p>}

          <section aria-labelledby="options">
            <h2 id="options">Options and prices</h2>
            {variants.length === 0 ? <p className="muted">Ask in store for options and prices.</p> : (
              <div className="table-scroll">
                <table className="variants">
                  <thead><tr><th scope="col">Option</th><th scope="col" className="right">Price</th><th scope="col">Availability</th></tr></thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={v.id}>
                        <th scope="row">{variantLabel(v)}</th>
                        <td className="right"><Price price={v.public_price} /></td>
                        <td><AvailabilityBadge value={v.availability} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="muted">Availability and prices are as last updated by the shop. Please confirm in store.</p>
          </section>

          <div className="actions">
            {call && <a className="btn" href={call.tel}>Call to check availability</a>}
            {chat && <a className="btn btn-ghost" href={chat.wa} rel="noopener noreferrer">WhatsApp</a>}
            {!call && !chat && <Link className="btn" href="/contact">Visit the shop</Link>}
            <Link className="btn btn-ghost" href={`/compare?p=${product.slug}`}>Compare</Link>
          </div>
        </div>
      </div>

      {specs.length > 0 && (
        <section className="panel specs" aria-labelledby="specs">
          <h2 id="specs">Specifications</h2>
          {groups.map((g) => (
            <div key={g}>
              <h3>{g}</h3>
              <dl>{specs.filter((s) => s.group_name === g).map((s) => <div key={s.id}><dt>{s.spec_key}</dt><dd>{s.spec_value}</dd></div>)}</dl>
            </div>
          ))}
        </section>
      )}
    </>
  )
}
