import type { Metadata } from 'next'
import Link from 'next/link'
import { BRAND_NAME, getShopProfile } from '@/lib/shop'

export const metadata: Metadata = { title: 'About us', description: 'About Tirumala Mobiles, a mobile phone and accessories shop.', alternates: { canonical: '/about' } }

export default async function AboutPage() {
  const shop = await getShopProfile()
  return (
    <div className="intro">
      <h1>About {BRAND_NAME}</h1>
      <p>
        {shop.about ??
          `${BRAND_NAME} is a mobile phone and accessories shop. This website lists the phones and accessories the shop has published, with their prices and whether they are in stock. It does not take orders: please visit the shop.`}
      </p>
      <p><Link className="btn" href="/contact">Contact and directions</Link></p>
    </div>
  )
}
