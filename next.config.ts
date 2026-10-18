import type { NextConfig } from 'next'

// Photos are served from the public `product-images` bucket of the configured Supabase project, and only from there.
const supabase = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null
const imagePattern = supabase
  ? [{ protocol: supabase.protocol.replace(':', '') as 'http' | 'https', hostname: supabase.hostname, port: supabase.port, pathname: '/storage/v1/object/public/product-images/**' }]
  : []

const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  images: { remotePatterns: imagePattern, dangerouslyAllowLocalIP: supabase?.hostname === '127.0.0.1' },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}
export default config
