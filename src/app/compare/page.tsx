import type { Metadata } from 'next'
import Link from 'next/link'
import { AvailabilityBadge } from '@/components/ProductCard'
import { getProduct, listProducts } from '@/lib/catalogue'
import { formatPrice, isSlug, priceSummary } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Compare phones',
  description: 'Compare public specifications, prices and availability of up to three products side by side.',
  alternates: { canonical: '/compare' },
  robots: { index: false, follow: true },
}

const MAX = 3

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).p
  const slugs = [...new Set((Array.isArray(raw) ? raw : raw ? raw.split(',') : []).filter(isSlug))].slice(0, MAX)
  const details = (await Promise.all(slugs.map((s) => getProduct(s)))).filter((d) => d !== null)
  const chosen = details.map((d) => d.product.slug)
  const picker = chosen.length < MAX ? await listProducts({ sort: 'name' }) : null
  const href = (list: string[]) => (list.length ? `/compare?${list.map((s) => `p=${s}`).join('&')}` : '/compare')
  const keys = [...new Set(details.flatMap((d) => d.specs.map((s) => `${s.group_name}|${s.spec_key}`)))]

  return (
    <>
      <h1>Compare</h1>
      <p className="muted">Pick up to {MAX} products to see their public details side by side.</p>
      {details.length > 0 && (
        <div className="table-scroll">
          <table className="compare">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Detail</span></th>
                {details.map((d) => (
                  <th scope="col" key={d.product.slug}>
                    <Link href={`/products/${d.product.slug}`}>{d.product.name}</Link>
                    <br />
                    <Link className="muted" href={href(chosen.filter((s) => s !== d.product.slug))}>Remove</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Price</th>
                {details.map((d) => {
                  const { fromPrice } = priceSummary(d.variants)
                  return <td key={d.product.slug}>{fromPrice === null ? 'Ask in store' : `From ${formatPrice(fromPrice)}`}</td>
                })}
              </tr>
              <tr>
                <th scope="row">Availability</th>
                {details.map((d) => <td key={d.product.slug}><AvailabilityBadge value={d.product.availability} /></td>)}
              </tr>
              <tr>
                <th scope="row">Brand</th>
                {details.map((d) => <td key={d.product.slug}>{d.product.brand_name}</td>)}
              </tr>
              {keys.map((k) => {
                const [group, key] = k.split('|')
                return (
                  <tr key={k}>
                    <th scope="row">{key} <span className="muted">({group})</span></th>
                    {details.map((d) => <td key={d.product.slug}>{d.specs.find((s) => s.group_name === group && s.spec_key === key)?.spec_value ?? '—'}</td>)}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {picker && (
        <section aria-labelledby="add" className="panel">
          <h2 id="add">{details.length ? 'Add another' : 'Choose a product'}</h2>
          {picker.cards.length === 0 ? (
            <p>No products are listed yet.</p>
          ) : (
            <ul className="chips">
              {picker.cards.filter((c) => !chosen.includes(c.slug)).map((c) => <li key={c.slug}><Link href={href([...chosen, c.slug])}>{c.name}</Link></li>)}
            </ul>
          )}
        </section>
      )}
    </>
  )
}
