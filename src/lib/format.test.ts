import { describe, expect, it } from 'vitest'
import { availabilityLabel, formatPrice, isSlug, primaryImage, priceSummary, sanitizeSearch, searchFilter, variantLabel } from './format'

describe('prices', () => {
  it('formats rupees the Indian way', () => {
    expect(formatPrice(74999)).toBe('₹74,999')
    expect(formatPrice(1299900)).toBe('₹12,99,900')
    expect(formatPrice(499.5)).toBe('₹499.5')
  })
  it('summarises only approved prices and never invents one', () => {
    expect(priceSummary([{ public_price: null }, { public_price: null }])).toEqual({ fromPrice: null, priced: false, varies: false })
    expect(priceSummary([{ public_price: 20000 }, { public_price: null }, { public_price: 18000 }])).toEqual({ fromPrice: 18000, priced: true, varies: true })
    expect(priceSummary([{ public_price: 500 }])).toEqual({ fromPrice: 500, priced: true, varies: false })
    expect(priceSummary([])).toEqual({ fromPrice: null, priced: false, varies: false })
  })
})

describe('labels', () => {
  it('maps availability to words (never colour alone)', () => {
    expect(availabilityLabel('in_stock')).toBe('In stock')
    expect(availabilityLabel('out_of_stock')).toBe('Out of stock')
  })
  it('describes a variant and copes with missing optional fields', () => {
    expect(variantLabel({ color: 'Black', ram_gb: 8, storage_gb: 128 })).toBe('Black · 8 GB RAM · 128 GB storage')
    expect(variantLabel({ color: null, ram_gb: null, storage_gb: 1024 })).toBe('1 TB storage')
    expect(variantLabel({ color: null, ram_gb: null, storage_gb: null })).toBe('Standard')
  })
})

describe('images', () => {
  const img = (id: string, is_primary: boolean, sort_order: number) => ({ id, product_slug: 'p', storage_path: id, alt_text: null, sort_order, is_primary })
  it('picks the primary photo, else the first by order, else none', () => {
    expect(primaryImage([img('a', false, 1), img('b', true, 5)])?.id).toBe('b')
    expect(primaryImage([img('a', false, 2), img('b', false, 1)])?.id).toBe('b')
    expect(primaryImage([])).toBeNull()
  })
})

describe('search and slugs', () => {
  it('strips characters that would change a PostgREST filter', () => {
    expect(sanitizeSearch('a,b)(c*%d')).toBe('a b c d')
    expect(sanitizeSearch('  nova   x1 ')).toBe('nova x1')
    expect(sanitizeSearch('x'.repeat(200))).toHaveLength(60)
  })
  it('accepts only clean slugs', () => {
    expect(isSlug('nova-x1')).toBe(true)
    for (const bad of ['', 'Nova', 'a b', 'a/../b', 'a,b', '-a', 'a--', "x'or'1", 'a'.repeat(121)]) expect(isSlug(bad)).toBe(false)
  })
})


describe('searchFilter (multi-word search)', () => {
  it('ANDs the words, each matched against name, brand or category', () => {
    expect(searchFilter('samsung s24')).toBe('(or(name.ilike.*samsung*,brand_name.ilike.*samsung*,category_name.ilike.*samsung*),or(name.ilike.*s24*,brand_name.ilike.*s24*,category_name.ilike.*s24*))')
  })
  it('returns null for nothing searchable and strips filter syntax', () => {
    expect(searchFilter('')).toBeNull()
    expect(searchFilter('  ,,()  ')).toBeNull()
    expect(searchFilter('a),or(b')).toBe('(or(name.ilike.*a*,brand_name.ilike.*a*,category_name.ilike.*a*),or(name.ilike.*or*,brand_name.ilike.*or*,category_name.ilike.*or*),or(name.ilike.*b*,brand_name.ilike.*b*,category_name.ilike.*b*))')
  })
  it('uses at most five words', () => {
    expect(searchFilter('a1 b2 c3 d4 e5 f6 g7')!.match(/or\(/g)).toHaveLength(5)
  })
})
