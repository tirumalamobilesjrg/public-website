'use client'

// Last-resort screen when even the page frame (layout) fails. Kept self-contained: no site CSS or data is assumed to load.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f5f4f0', color: '#0f1d3a', margin: 0, padding: '3rem 1rem', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>We could not load this page. Please try again in a moment.</p>
        <button onClick={reset} style={{ minHeight: 44, padding: '0 1.2rem', borderRadius: 10, border: '1px solid #d5a755', background: '#d5a755', color: '#0c1830', fontWeight: 600, font: 'inherit' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
