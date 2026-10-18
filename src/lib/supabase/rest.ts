import 'server-only'
import { getEnv } from '../env'
import { REVALIDATE_SECONDS } from '../format'

/** Raised for any failure talking to the catalogue. The message is safe to log; pages show their own friendly text. */
export class CatalogueError extends Error {}

export type Page<T> = { rows: T[]; total: number }

/**
 * Read-only access to the public views over PostgREST with the publishable key (row-level security applies).
 * Only the public views (four catalogue views and the shop profile) may be requested; anything else is refused here.
 */
const ALLOWED = new Set(['public_catalogue_products', 'public_catalogue_variants', 'public_catalogue_images', 'public_catalogue_specifications', 'public_shop_profile'])

export async function selectView<T>(view: string, params: Record<string, string>, range?: { from: number; to: number }): Promise<Page<T>> {
  if (!ALLOWED.has(view)) throw new CatalogueError(`View not allowed: ${view}`)
  const { supabaseUrl, publishableKey } = getEnv()
  const url = new URL(`${supabaseUrl}/rest/v1/${view}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const headers: Record<string, string> = { apikey: publishableKey, Accept: 'application/json' }
  if (range) {
    headers.Range = `${range.from}-${range.to}`
    headers.Prefer = 'count=exact'
  }
  let res: Response
  try {
    res = await fetch(url, { headers, next: { revalidate: REVALIDATE_SECONDS } })
  } catch {
    throw new CatalogueError('Could not reach the catalogue')
  }
  if (!res.ok && res.status !== 206) throw new CatalogueError(`Catalogue request failed (${res.status})`)
  const rows = (await res.json()) as T[]
  const total = Number(res.headers.get('content-range')?.split('/')[1] ?? rows.length)
  return { rows, total: Number.isFinite(total) ? total : rows.length }
}

export function publicImageUrl(storagePath: string): string {
  return `${getEnv().supabaseUrl}/storage/v1/object/public/product-images/${storagePath.split('/').map(encodeURIComponent).join('/')}`
}
