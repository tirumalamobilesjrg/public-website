import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// No incremental cache binding: catalogue freshness comes from the 300 s fetch revalidation, and the site has no R2/KV dependency (keeps the free plan simple).
export default defineCloudflareConfig()
