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
  })
})
