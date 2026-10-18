import Link from 'next/link'

export function Pager({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <Link className="btn btn-ghost" href={hrefFor(page - 1)} rel="prev">Previous</Link> : <span className="btn btn-ghost" aria-disabled="true">Previous</span>}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link className="btn btn-ghost" href={hrefFor(page + 1)} rel="next">Next</Link> : <span className="btn btn-ghost" aria-disabled="true">Next</span>}
    </nav>
  )
}
