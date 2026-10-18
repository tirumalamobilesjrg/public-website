/** Shapes of the four public views (crm-backend docs/API_CONTRACTS.md, "Public catalogue"). Nothing else is ever read. */
export type Availability = 'in_stock' | 'out_of_stock'

export type PublicProduct = {
  id: string
  slug: string
  name: string
  brand_name: string
  brand_slug: string
  category_name: string
  category_slug: string
  description: string | null
  published_at: string
  updated_at: string
  availability: Availability
}

export type PublicVariant = {
  id: string
  product_slug: string
  color: string | null
  ram_gb: number | null
  storage_gb: number | null
  public_price: number | null
  availability: Availability
}

export type PublicImage = {
  id: string
  product_slug: string
  storage_path: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export type PublicSpec = {
  id: string
  product_slug: string
  group_name: string
  spec_key: string
  spec_value: string
  sort_order: number
}

/** What a list card shows: the product plus a price summary computed from its approved variant prices. */
export type ProductCard = PublicProduct & { fromPrice: number | null; priced: boolean; image: PublicImage | null }

export type CatalogueQuery = {
  q?: string
  category?: string
  brand?: string
  inStockOnly?: boolean
  sort?: 'newest' | 'name'
  page?: number
}
