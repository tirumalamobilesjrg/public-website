import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'You are offline', robots: { index: false } }

export default function OfflinePage() {
  return (
    <div className="empty">
      <h1>You are offline</h1>
      <p>This page needs an internet connection. Prices and availability are not stored on your phone, so please reconnect to see them.</p>
      {/* A full page load on purpose: client-side navigation would not retry the network. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <p><a className="btn" href="/">Try again</a></p>
    </div>
  )
}
