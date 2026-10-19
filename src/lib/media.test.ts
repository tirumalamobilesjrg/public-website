import { describe, expect, it } from 'vitest'
import { isBrandLogoPath, isCategoryImagePath } from './media'

describe('brand logo and category picture paths (same layout as the database)', () => {
  it('accepts brands/<folder>/<file> and categories/<folder>/<file>', () => {
    expect(isBrandLogoPath('brands/samsung/3f2a-9c.svg')).toBe(true)
    expect(isBrandLogoPath('brands/8f14e45f-ceea-467a-9575-4c5d7c8b1a3b/x.png')).toBe(true)
    expect(isCategoryImagePath('categories/smartphones/a1.webp')).toBe(true)
  })
  it.each([
    'brands/a/../b.svg', '/brands/a/b.svg', 'brands/b.svg', 'brands/a/b/c.svg', 'brands/a/b c.svg', 'products/a/b.svg',
    'https://evil.example/brands/a/b.svg', 'brands/a/b.svg?x=1', '', null, undefined, 42,
  ])('refuses %s as a brand logo', (p) => expect(isBrandLogoPath(p)).toBe(false))
  it('does not mix the two buckets up', () => {
    expect(isBrandLogoPath('categories/a/b.webp')).toBe(false)
    expect(isCategoryImagePath('brands/a/b.svg')).toBe(false)
    expect(isCategoryImagePath('categories/a/../b.webp')).toBe(false)
    expect(isCategoryImagePath('categories/a/b.webp#x')).toBe(false)
  })
})
