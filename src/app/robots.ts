import type { MetadataRoute } from 'next'
import { getEnv } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/compare'] }], sitemap: `${getEnv().siteUrl}/sitemap.xml` }
}
