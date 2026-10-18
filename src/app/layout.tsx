import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import '@fontsource-variable/figtree'
import '@fontsource-variable/bricolage-grotesque'
import './globals.css'
import { BottomNav, TopNav } from '@/components/Nav'
import { getEnv } from '@/lib/env'
import { BRAND_NAME, getShopProfile, phoneLinks } from '@/lib/shop'

export const viewport: Viewport = { themeColor: '#155eef', width: 'device-width', initialScale: 1 }

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getEnv().siteUrl),
    title: { default: `${BRAND_NAME} — mobile phones and accessories`, template: `%s | ${BRAND_NAME}` },
    description: 'Browse mobile phones and accessories at Tirumala Mobiles, see public prices and availability, then visit the shop.',
    applicationName: BRAND_NAME,
    openGraph: { siteName: BRAND_NAME, type: 'website', locale: 'en_IN' },
    manifest: '/manifest.webmanifest',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const shop = await getShopProfile()
  const call = phoneLinks(shop.phone)
  return (
    <html lang="en-IN">
      <body>
        <a className="skip" href="#content">Skip to content</a>
        <header className="site-header">
          <div className="wrap">
            <Link className="brand" href="/">
              <span className="brand-mark" aria-hidden="true">T</span>
              {BRAND_NAME}
            </Link>
            <TopNav />
            {call ? <a className="btn btn-small header-cta" href={call.tel}>Call the shop</a> : <Link className="btn btn-small header-cta" href="/contact">Visit us</Link>}
          </div>
        </header>
        <main id="content"><div className="wrap">{children}</div></main>
        <footer>
          <div className="wrap foot-grid">
            <div>
              <h2>{shop.shop_name}</h2>
              {shop.address && <p>{shop.address}</p>}
              {shop.opening_hours && <p>Open: {shop.opening_hours}</p>}
              {call && <p><a href={call.tel}>{shop.phone}</a></p>}
              {!shop.address && !call && <p>Shop details are coming soon.</p>}
            </div>
            <nav aria-label="Footer">
              <h2>Browse</h2>
              <ul>
                <li><Link href="/products">All products</Link></li>
                <li><Link href="/compare">Compare phones</Link></li>
                <li><Link href="/about">About us</Link></li>
                <li><Link href="/contact">Contact and directions</Link></li>
              </ul>
            </nav>
            <div>
              <h2>Good to know</h2>
              <ul>
                <li><Link href="/privacy">Privacy</Link></li>
              </ul>
              <p className="fine">Prices and availability are shown as last updated by the shop and may have changed. This website does not take orders: visit the shop to buy.</p>
            </div>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  )
}
