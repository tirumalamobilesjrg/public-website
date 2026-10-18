/** Server-side configuration. Only public values are accepted; a privileged key is refused outright. */
export type SiteEnv = { supabaseUrl: string; publishableKey: string; siteUrl: string }

function jwtRole(key: string): string | null {
  const part = key.split('.')[1]
  if (!part) return null
  try {
    const json = JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')) as { role?: string }
    return json.role ?? null
  } catch {
    return null
  }
}

export function parseEnv(source: Record<string, string | undefined>): SiteEnv {
  const url = (source.SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
  const key = (source.SUPABASE_PUBLISHABLE_KEY ?? '').trim()
  const site = (source.SITE_URL ?? '').trim().replace(/\/+$/, '')
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) {
    throw new Error('SUPABASE_URL must be the bare project URL, for example https://abcd.supabase.co')
  }
  if (!key) throw new Error('SUPABASE_PUBLISHABLE_KEY is missing')
  if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
    throw new Error('SUPABASE_PUBLISHABLE_KEY looks like a secret / service_role key. Use the publishable (anon) key only.')
  }
  if (!/^https?:\/\/[^/\s]+$/.test(site)) throw new Error('SITE_URL must be an address such as https://www.example.com')
  return { supabaseUrl: url, publishableKey: key, siteUrl: site }
}

let cached: SiteEnv | undefined
export function getEnv(): SiteEnv {
  cached ??= parseEnv(process.env)
  return cached
}
