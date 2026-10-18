import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="empty">
      <h1>We could not find that page</h1>
      <p>The link may be old, or the product may no longer be listed.</p>
      <p><Link className="btn" href="/products">Browse products</Link></p>
    </div>
  )
}
