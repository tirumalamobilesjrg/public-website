// Stand-in for the Supabase REST API serving the four public views, for local build/smoke checks only.
// It mimics just what the site uses: eq./in. filters, ilike on `or`, order, Range + Prefer count=exact.
// It is NOT a security test: the real anonymous-access checks run against the local Supabase stack (see docs/TESTING.md).
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_PORT || 58431)
const now = '2026-10-18T10:00:00Z'
const P = (n, slug, name, brand, cat, avail, desc) => ({ id: `p${n}`, slug, name, brand_name: brand, brand_slug: brand.toLowerCase(), category_name: cat, category_slug: cat.toLowerCase(), description: desc, published_at: now, updated_at: now, availability: avail })
const products = [
  P(1, 'nova-x1', 'Nova X1', 'Nova', 'Smartphones', 'in_stock', 'A test phone.'),
  P(2, 'nova-x2', 'Nova X2', 'Nova', 'Smartphones', 'out_of_stock', null),
  P(3, 'nova-case', 'Nova Case', 'Nova', 'Accessories', 'in_stock', null),
]
const variants = [
  { id: 'v1', product_slug: 'nova-x1', color: 'Black', ram_gb: 8, storage_gb: 128, public_price: 19000, availability: 'in_stock' },
  { id: 'v2', product_slug: 'nova-x1', color: 'Black', ram_gb: 8, storage_gb: 256, public_price: null, availability: 'out_of_stock' },
  { id: 'v3', product_slug: 'nova-x2', color: null, ram_gb: null, storage_gb: null, public_price: 25000, availability: 'out_of_stock' },
  { id: 'v4', product_slug: 'nova-case', color: 'Black', ram_gb: null, storage_gb: null, public_price: 400, availability: 'in_stock' },
]
const images = [{ id: 'i1', product_slug: 'nova-x1', storage_path: 'nova-x1/front.png', alt_text: 'Nova X1 front', sort_order: 1, is_primary: true }]
const specs = [
  { id: 's1', product_slug: 'nova-x1', group_name: 'Display', spec_key: 'Size', spec_value: '6.1 inch', sort_order: 1 },
  { id: 's2', product_slug: 'nova-x1', group_name: 'Battery', spec_key: 'Capacity', spec_value: '4,000 mAh', sort_order: 2 },
]
const views = { public_catalogue_products: products, public_catalogue_variants: variants, public_catalogue_images: images, public_catalogue_specifications: specs }

createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const m = url.pathname.match(/^\/rest\/v1\/(\w+)$/)
  if (!m || !(m[1] in views)) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end('{"message":"not found"}') }
  let rows = [...views[m[1]]]
  for (const [k, v] of url.searchParams) {
    if (['select', 'order', 'limit'].includes(k)) continue
    if (k === 'or') {
      const term = (v.match(/ilike\.\*(.*?)\*/) || [])[1]?.toLowerCase() ?? ''
      rows = rows.filter((r) => [r.name, r.brand_name, r.category_name].some((x) => x?.toLowerCase().includes(term)))
    } else if (v.startsWith('eq.')) rows = rows.filter((r) => String(r[k]) === v.slice(3))
    else if (v.startsWith('in.(')) rows = rows.filter((r) => v.slice(4, -1).split(',').includes(r[k]))
  }
  const order = url.searchParams.get('order')
  if (order?.startsWith('name.asc')) rows.sort((a, b) => a.name.localeCompare(b.name))
  const total = rows.length
  const range = req.headers.range?.match(/^(\d+)-(\d+)$/)
  if (range) rows = rows.slice(Number(range[1]), Number(range[2]) + 1)
  const limit = Number(url.searchParams.get('limit'))
  if (limit) rows = rows.slice(0, limit)
  res.writeHead(range ? 206 : 200, { 'content-type': 'application/json', 'content-range': `0-${Math.max(0, rows.length - 1)}/${total}` })
  res.end(JSON.stringify(rows))
}).listen(PORT, '127.0.0.1', () => console.log(`mock supabase on ${PORT}`))
