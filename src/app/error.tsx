'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty" role="alert">
      <h1>Something went wrong</h1>
      <p>We could not load this page. Please try again in a moment.</p>
      <p><button className="btn" onClick={reset}>Try again</button></p>
    </div>
  )
}
