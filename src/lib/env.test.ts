import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

const good = { SUPABASE_URL: 'https://abcd.supabase.co/', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc', SITE_URL: 'https://shop.example.com/' }
const jwt = (role: string) => `h.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.s`

describe('parseEnv', () => {
  it('accepts public values and trims trailing slashes', () => {
    expect(parseEnv(good)).toEqual({ supabaseUrl: 'https://abcd.supabase.co', publishableKey: 'sb_publishable_abc', siteUrl: 'https://shop.example.com' })
  })
  it('accepts an anon JWT and a local stack URL', () => {
    expect(parseEnv({ ...good, SUPABASE_PUBLISHABLE_KEY: jwt('anon'), SUPABASE_URL: 'http://127.0.0.1:54321' }).supabaseUrl).toBe('http://127.0.0.1:54321')
  })
  it('refuses privileged keys', () => {
    expect(() => parseEnv({ ...good, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc' })).toThrow(/secret/)
    expect(() => parseEnv({ ...good, SUPABASE_PUBLISHABLE_KEY: jwt('service_role') })).toThrow(/service_role/)
  })
  it('refuses missing or malformed values', () => {
    expect(() => parseEnv({})).toThrow(/SUPABASE_URL/)
    expect(() => parseEnv({ ...good, SUPABASE_URL: 'https://abcd.supabase.co/rest/v1' })).toThrow(/SUPABASE_URL/)
    expect(() => parseEnv({ ...good, SUPABASE_PUBLISHABLE_KEY: '' })).toThrow(/missing/)
    expect(() => parseEnv({ ...good, SITE_URL: 'nope' })).toThrow(/SITE_URL/)
    expect(() => parseEnv({ ...good, SITE_URL: undefined })).toThrow(/SITE_URL is missing/)
  })
  it('falls back to the Vercel deployment address only when SITE_URL is not set', () => {
    const noSite = { ...good, SITE_URL: undefined }
    expect(parseEnv({ ...noSite, VERCEL_URL: 'my-site-abc.vercel.app' }).siteUrl).toBe('https://my-site-abc.vercel.app')
    expect(parseEnv({ ...noSite, VERCEL_URL: 'preview.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'shop.vercel.app' }).siteUrl).toBe('https://shop.vercel.app')
    expect(parseEnv({ ...good, VERCEL_URL: 'my-site-abc.vercel.app' }).siteUrl).toBe('https://shop.example.com')
  })
})
