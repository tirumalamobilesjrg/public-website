// Anonymous-access check against a real Supabase project (hosted or the local stack).
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... node scripts/anon-check.mjs
// It only ever sends the publishable key. Every write it attempts must be refused; none can succeed with that key.
const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const key = process.env.SUPABASE_PUBLISHABLE_KEY || ''
if (!url || !key) { console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY'); process.exit(2) }
if (key.startsWith('sb_secret_')) { console.error('That is a secret key. Use the publishable key.'); process.exit(2) }

const headers = { apikey: key, 'Content-Type': 'application/json' }
let failed = 0
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${ok ? '' : ` ${detail}`}`); if (!ok) failed += 1 }
const call = async (path, init = {}) => { const r = await fetch(`${url}${path}`, { headers, ...init }); const text = await r.text(); let json = null; try { json = JSON.parse(text) } catch { /* not json */ } return { status: r.status, text, json } }
const denied = (r) => [401, 403, 404].includes(r.status)

const ALLOWED = {
  public_catalogue_products: 'id slug name brand_name brand_slug category_name category_slug description published_at updated_at availability',
  public_catalogue_variants: 'id product_slug color ram_gb storage_gb public_price availability',
  public_catalogue_images: 'id product_slug storage_path alt_text sort_order is_primary',
  public_catalogue_specifications: 'id product_slug group_name spec_key spec_value sort_order',
  public_shop_profile: 'shop_name address phone whatsapp email opening_hours map_url about',
}
for (const [view, cols] of Object.entries(ALLOWED)) {
  const r = await call(`/rest/v1/${view}?select=*&limit=50`)
  check(`anon can read ${view}`, r.status === 200 && Array.isArray(r.json), `(status ${r.status})`)
  const extra = new Set((r.json ?? []).flatMap((row) => Object.keys(row)).filter((k) => !cols.split(' ').includes(k)))
  check(`${view} returns only approved columns`, extra.size === 0, `(extra: ${[...extra].join(', ')})`)
  const w = await call(`/rest/v1/${view}`, { method: 'POST', body: '{}' })
  check(`anon cannot write ${view}`, w.status >= 400, `(status ${w.status})`)
}

const PRIVATE = ['products', 'product_variants', 'brands', 'categories', 'inventory_items', 'inventory_item_costs', 'inventory_identifiers', 'stock_levels', 'stock_movements',
  'suppliers', 'purchases', 'purchase_items', 'customers', 'sales', 'sale_items', 'invoices', 'payments', 'discount_approvals', 'discount_policies', 'staff_profiles', 'shop_settings', 'audit_logs', 'idempotency_keys', 'product_images', 'product_specifications']
for (const t of PRIVATE) {
  const r = await call(`/rest/v1/${t}?select=*&limit=1`)
  check(`anon cannot read ${t}`, denied(r) || (r.status === 200 && Array.isArray(r.json) && r.json.length === 0 && false), `(status ${r.status})`)
}
for (const t of ['products', 'customers', 'sales', 'shop_settings', 'staff_profiles']) {
  const r = await call(`/rest/v1/${t}?id=eq.00000000-0000-0000-0000-000000000000`, { method: 'PATCH', body: '{}' })
  check(`anon cannot update ${t}`, r.status >= 400, `(status ${r.status})`)
  const d = await call(`/rest/v1/${t}?id=eq.00000000-0000-0000-0000-000000000000`, { method: 'DELETE' })
  check(`anon cannot delete from ${t}`, d.status >= 400, `(status ${d.status})`)
}
for (const fn of ['finalize_sale', 'receive_purchase', 'adjust_stock', 'adjust_quantity_stock', 'correct_item_identifiers', 'grant_discount_approval']) {
  const r = await call(`/rest/v1/rpc/${fn}`, { method: 'POST', body: '{}' })
  check(`anon cannot call ${fn}`, denied(r), `(status ${r.status})`)
}
const up = await fetch(`${url}/storage/v1/object/product-images/products/anon-check/x.png`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'image/png' }, body: new Uint8Array([137, 80, 78, 71]) })
check('anon cannot upload to the product-images bucket', up.status >= 400, `(status ${up.status})`)

console.log(failed === 0 ? '\nAll anonymous-access checks passed.' : `\n${failed} check(s) failed.`)
process.exit(failed === 0 ? 0 : 1)
