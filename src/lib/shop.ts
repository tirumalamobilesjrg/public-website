import 'server-only'
import { selectView } from './supabase/rest'

/**
 * Shop details come from the CRM (Admin settings) through the public `public_shop_profile` view, so the owner edits
 * them in one place. Until that backend view exists (or when a field is empty) the site shows only the shop name and
 * hides every section that needs the missing detail. Nothing here is invented.
 */
export type ShopProfile = {
  shop_name: string
  address: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  opening_hours: string | null
  map_url: string | null
  about: string | null
}

export const BRAND_NAME = 'Tirumala Mobiles'
const EMPTY: ShopProfile = { shop_name: BRAND_NAME, address: null, phone: null, whatsapp: null, email: null, opening_hours: null, map_url: null, about: null }

const clean = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)

export async function getShopProfile(): Promise<ShopProfile> {
  try {
    const { rows } = await selectView<Partial<Record<keyof ShopProfile, unknown>>>('public_shop_profile', { select: '*', limit: '1' })
    const r = rows[0]
    if (!r) return EMPTY
    return {
      shop_name: clean(r.shop_name) ?? BRAND_NAME,
      address: clean(r.address),
      phone: clean(r.phone),
      whatsapp: clean(r.whatsapp),
      email: clean(r.email),
      opening_hours: clean(r.opening_hours),
      map_url: safeHttps(clean(r.map_url)),
      about: clean(r.about),
    }
  } catch {
    return EMPTY
  }
}

function safeHttps(u: string | null) {
  return u && /^https:\/\//i.test(u) ? u : null
}

/** tel: and WhatsApp links from a free-form number; null unless it has 10-15 digits. */
export function phoneLinks(raw: string | null): { tel: string; wa: string } | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  const full = digits.length === 10 ? `91${digits}` : digits
  if (full.length < 10 || full.length > 15) return null
  return { tel: `tel:+${full}`, wa: `https://wa.me/${full}` }
}
