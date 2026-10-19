import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
const selectView = vi.fn()
vi.mock('./supabase/rest', () => ({
  selectView: (...a: unknown[]) => selectView(...a),
  publicImageUrl: (p: string) => `https://x.supabase.co/p/${p}`,
  brandLogoUrl: (p: string) => `https://x.supabase.co/b/${p}`,
  categoryImageUrl: (p: string) => `https://x.supabase.co/c/${p}`,
}))

import { listFacets } from './catalogue'

const row = (over: Record<string, unknown>) => ({ slug: 'p', brand_slug: 'nova', brand_name: 'Nova', category_slug: 'phones', category_name: 'Phones', brand_logo_path: null, category_image_path: null, ...over })

beforeEach(() => selectView.mockReset())

describe('listFacets', () => {
  it('counts products, gives a brand its logo and a category its own picture', async () => {
    selectView.mockResolvedValueOnce({ rows: [
      row({ slug: 'a', brand_logo_path: 'brands/nova/l.svg', category_image_path: 'categories/phones/c.webp' }),
      row({ slug: 'b', brand_logo_path: 'brands/nova/l.svg', category_image_path: 'categories/phones/c.webp' }),
      row({ slug: 'c', brand_slug: 'zed', brand_name: 'Zed', category_slug: 'cases', category_name: 'Cases', category_image_path: 'categories/cases/c.webp' }),
    ], total: 3 })
    const { brands, categories } = await listFacets()
    expect(brands).toEqual([
      { slug: 'nova', name: 'Nova', count: 2, imageUrl: 'https://x.supabase.co/b/brands/nova/l.svg', isPhoto: false },
      { slug: 'zed', name: 'Zed', count: 1, imageUrl: null, isPhoto: false },
    ])
    expect(categories.map((c) => [c.name, c.count, c.imageUrl, c.isPhoto])).toEqual([
      ['Cases', 1, 'https://x.supabase.co/c/categories/cases/c.webp', false],
      ['Phones', 2, 'https://x.supabase.co/c/categories/phones/c.webp', false],
    ])
    expect(selectView).toHaveBeenCalledTimes(1) // every category had its own picture: no photo lookup
  })

  it('uses the newest product photo for a category with no picture of its own, and the primary photo first', async () => {
    selectView
      .mockResolvedValueOnce({ rows: [row({ slug: 'newest' }), row({ slug: 'older' })], total: 2 }) // newest first
      .mockResolvedValueOnce({ rows: [
        { id: 'i1', product_slug: 'newest', storage_path: 'newest/second.png', alt_text: null, sort_order: 2, is_primary: false },
        { id: 'i2', product_slug: 'newest', storage_path: 'newest/main.png', alt_text: null, sort_order: 1, is_primary: true },
      ], total: 2 })
    const { categories } = await listFacets()
    expect(categories[0]).toMatchObject({ slug: 'phones', imageUrl: 'https://x.supabase.co/p/newest/main.png', isPhoto: true })
    expect(selectView.mock.calls[1]![0]).toBe('public_catalogue_images')
    expect(selectView.mock.calls[1]![1]).toMatchObject({ product_slug: 'in.(newest)' })
  })

  it('leaves the picture out when that product has no photo, or the photo lookup fails', async () => {
    selectView.mockResolvedValueOnce({ rows: [row({ slug: 'a' })], total: 1 }).mockResolvedValueOnce({ rows: [], total: 0 })
    expect((await listFacets()).categories[0]).toMatchObject({ imageUrl: null, isPhoto: false })
    selectView.mockResolvedValueOnce({ rows: [row({ slug: 'a' })], total: 1 }).mockRejectedValueOnce(new Error('down'))
    expect((await listFacets()).categories[0]).toMatchObject({ imageUrl: null, isPhoto: false })
  })

  it('ignores a malformed path from the view instead of building an address from it', async () => {
    selectView.mockResolvedValueOnce({ rows: [row({ slug: 'a', brand_logo_path: 'https://evil.example/x.svg', category_image_path: 'brands/a/b.svg' })], total: 1 }).mockResolvedValueOnce({ rows: [], total: 0 })
    const { brands, categories } = await listFacets()
    expect(brands[0]!.imageUrl).toBeNull()
    expect(categories[0]!.imageUrl).toBeNull()
  })

  it('still lists brands and categories, without pictures, against a database that has no 0027 columns yet', async () => {
    selectView
      .mockRejectedValueOnce(new Error('Catalogue request failed (400)'))
      .mockResolvedValueOnce({ rows: [{ slug: 'a', brand_slug: 'nova', brand_name: 'Nova', category_slug: 'phones', category_name: 'Phones' }], total: 1 })
      .mockResolvedValueOnce({ rows: [], total: 0 })
    const { brands, categories } = await listFacets()
    expect(brands).toEqual([{ slug: 'nova', name: 'Nova', count: 1, imageUrl: null, isPhoto: false }])
    expect(categories).toHaveLength(1)
    expect(selectView.mock.calls[0]![1].select).toContain('brand_logo_path')
    expect(selectView.mock.calls[1]![1].select).not.toContain('brand_logo_path')
  })
})
