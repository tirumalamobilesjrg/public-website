'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/', label: 'Home', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { href: '/products', label: 'Phones', icon: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm5 17h.01' },
  { href: '/compare', label: 'Compare', icon: 'M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 2v20' },
  { href: '/contact', label: 'Visit us', icon: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
] as const

const isCurrent = (path: string, href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`))

export function TopNav() {
  const path = usePathname()
  const items = [...ITEMS.filter((i) => i.href !== '/'), { href: '/about', label: 'About', icon: '' }]
  return (
    <nav className="top-nav" aria-label="Main">
      {items.map((i) => (
        <Link key={i.href} href={i.href} aria-current={isCurrent(path, i.href) ? 'page' : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}

export function BottomNav() {
  const path = usePathname()
  return (
    <nav className="bottom-nav" aria-label="Quick links">
      {ITEMS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={isCurrent(path, i.href) ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={i.icon} />
          </svg>
          {i.label}
        </Link>
      ))}
    </nav>
  )
}
