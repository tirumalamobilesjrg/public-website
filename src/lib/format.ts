import type { Availability, PublicImage, PublicVariant } from './catalogue-types'

export const REVALIDATE_SECONDS = 300 // catalogue data may be up to 5 minutes old; the UI never claims "live" stock

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: 0 })
export const formatPrice = (rupees: number) => inr.format(rupees)

export const availabilityLabel = (a: Availability) => (a === 'in_stock' ? 'In stock' : 'Out of stock')

/** Lowest approved public price across variants; null when none has an approved price ("contact the shop"). */
export function priceSummary(variants: Pick<PublicVariant, 'public_price'>[]): { fromPrice: number | null; priced: boolean; varies: boolean } {
  const prices = variants.map((v) => v.public_price).filter((p): p is number => p !== null && Number.isFinite(p) && p >= 0)
  if (prices.length === 0) return { fromPrice: null, priced: false, varies: false }
  const low = Math.min(...prices)
  return { fromPrice: low, priced: true, varies: Math.max(...prices) !== low }
}

export const variantLabel = (v: Pick<PublicVariant, 'color' | 'ram_gb' | 'storage_gb'>) =>
  [v.color, v.ram_gb ? `${v.ram_gb} GB RAM` : null, v.storage_gb ? `${v.storage_gb >= 1024 && v.storage_gb % 1024 === 0 ? `${v.storage_gb / 1024} TB` : `${v.storage_gb} GB`} storage` : null]
    .filter(Boolean)
    .join(' · ') || 'Standard'

export function primaryImage(images: PublicImage[]): PublicImage | null {
  return [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0] ?? null
}

/** Free text for PostgREST `ilike`: drop characters that have meaning in its filter syntax, cap the length. */
export function sanitizeSearch(raw: string): string {
  return raw.replace(/[,()*%\\:"'`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}

export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const isSlug = (s: string) => s.length <= 120 && SLUG.test(s)
