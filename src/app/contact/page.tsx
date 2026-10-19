import type { Metadata } from 'next'
import { getShopProfile, phoneLinks } from '@/lib/shop'

export const metadata: Metadata = { title: 'Contact and directions', description: 'Find Tirumala Mobiles, opening hours and how to contact the shop.', alternates: { canonical: '/contact' } }

export default async function ContactPage() {
  const shop = await getShopProfile()
  const call = phoneLinks(shop.phone)
  const wa = phoneLinks(shop.whatsapp ?? shop.phone)
  const none = !shop.address && !call && !shop.email && !shop.opening_hours
  return (
    <div className="intro">
      <h1>Contact and directions</h1>
      {none && <div className="empty"><p>Contact details for the shop are coming soon.</p></div>}
      {shop.address && <section className="panel"><h2>Address</h2><p style={{ whiteSpace: 'pre-line' }}>{shop.address}</p></section>}
      {shop.opening_hours && <section className="panel"><h2>Opening hours</h2><p style={{ whiteSpace: 'pre-line' }}>{shop.opening_hours}</p></section>}
      {(call || shop.email) && (
        <section className="panel">
          <h2>Get in touch</h2>
          {call && <p>Phone: <a href={call.tel}>{shop.phone}</a></p>}
          {shop.email && <p>Email: <a href={`mailto:${encodeURIComponent(shop.email)}`}>{shop.email}</a></p>}
        </section>
      )}
      <div className="actions">
        {call && <a className="btn" href={call.tel}>Call now</a>}
        {wa && <a className="btn btn-ghost" href={wa.wa}>WhatsApp</a>}
        {shop.map_url && <a className="btn btn-ghost" href={shop.map_url} rel="noopener noreferrer">Get directions</a>}
      </div>
    </div>
  )
}
