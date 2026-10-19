// Stand-in for the Supabase REST API serving the public views (catalogue + shop profile), for local build/smoke checks only.
// It mimics just what the site uses: eq./in. filters, ilike on `or`, order, Range + Prefer count=exact.
// It is NOT a security test: the real anonymous-access checks run against the local Supabase stack (see docs/TESTING.md).
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_PORT || 58431)
const now = '2026-10-18T10:00:00Z'
const P = (n, slug, name, brand, cat, avail, desc) => ({ id: `p${n}`, slug, name, brand_name: brand, brand_slug: brand.toLowerCase(), category_name: cat, category_slug: cat.toLowerCase(), description: desc, published_at: now, updated_at: now, availability: avail })
const products = [
  { ...P(1, 'nova-x1', 'Nova X1', 'Nova', 'Smartphones', 'in_stock', 'A test phone.'), brand_logo_path: 'brands/nova/logo.svg', category_image_path: 'categories/smartphones/pic.svg' },
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
const shop = [{ shop_name: 'Tirumala Mobiles', address: 'Main Road, Tirupati', phone: '98765 43210', whatsapp: '98765 43211', email: null, opening_hours: 'Mon to Sat 10:00 to 21:00, Sun 10:00 to 14:00', map_url: 'https://maps.google.com/?q=Tirumala+Mobiles', about: null }]
const views = { public_shop_profile: shop, public_catalogue_products: products, public_catalogue_variants: variants, public_catalogue_images: images, public_catalogue_specifications: specs }

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">${body}</svg>`
const STORAGE = {
  'brands/nova/logo.svg': svg('<rect width="480" height="360" fill="#fff"/><circle cx="240" cy="180" r="110" fill="#1c3f8c"/><text x="240" y="215" font-size="110" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">N</text>'),
  'categories/smartphones/pic.svg': svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a4a8a"/><stop offset="1" stop-color="#0f1d3a"/></linearGradient></defs><rect width="480" height="360" fill="url(#g)"/><rect x="170" y="40" width="140" height="250" rx="22" fill="#d5a755"/><rect x="180" y="62" width="120" height="190" rx="8" fill="#0f1d3a"/>'),
}

createServer((req, res) => {
  const url = new URL(req.url, 'http://x')
  const pub = url.pathname.match(/^\/storage\/v1\/object\/public\/(?:brand-logos|category-images)\/(.+)$/)
  if (pub) {
    const body = STORAGE[decodeURIComponent(pub[1])]
    res.writeHead(body ? 200 : 404, { 'content-type': body ? 'image/svg+xml' : 'text/plain' })
    return res.end(body ?? 'not found')
  }
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
