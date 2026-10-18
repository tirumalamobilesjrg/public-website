import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy', description: 'What this website does and does not collect.', alternates: { canonical: '/privacy' } }

export default function PrivacyPage() {
  return (
    <div className="intro">
      <h1>Privacy</h1>
      <p>This website has no accounts, no forms and no online orders, so it does not ask for or store your name, phone number or address.</p>
      <p>Like any website, our hosting provider may keep standard technical logs (such as IP address and pages requested) to keep the site running and secure. We do not use advertising trackers.</p>
      <p>If you call or message the shop, the details you share are used only to answer you.</p>
    </div>
  )
}
