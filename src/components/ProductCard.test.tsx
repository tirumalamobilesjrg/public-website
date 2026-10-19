import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { ProductCardView } from './ProductCard'
import type { ProductCard } from '@/lib/catalogue-types'

// eslint-disable-next-line @next/next/no-img-element -- a test stand-in for next/image
vi.mock('next/image', () => ({ default: (p: { src: string; alt: string }) => <img src={p.src} alt={p.alt} /> }))
vi.mock('next/link', () => ({ default: (p: { href: string; children: React.ReactNode }) => <a href={p.href}>{p.children}</a> }))

const card = { id: '1', slug: 'nova-x1', name: 'Nova X1', brand_name: 'Nova', fromPrice: 15999, priced: true, availability: 'in_stock', image: null } as unknown as ProductCard

afterEach(cleanup) // vitest globals are off, so testing-library does not clean up by itself

describe('ProductCardView contact icons', () => {
  it('shows a WhatsApp icon and a call icon, each named after the phone, and no visible button text', () => {
    render(<ul><ProductCardView card={card} imageUrl={null} contact={{ tel: 'tel:+919876543210', wa: 'https://wa.me/919876543210' }} /></ul>)
    const wa = screen.getByRole('link', { name: 'Ask about Nova X1 on WhatsApp' })
    const call = screen.getByRole('link', { name: 'Call the shop about Nova X1' })
    expect(call).toHaveAttribute('href', 'tel:+919876543210')
    expect(new URL(wa.getAttribute('href')!).searchParams.get('text')).toContain('Nova X1 (₹15,999)')
    expect(wa).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(wa.textContent).toBe('')
    expect(call.textContent).toBe('')
    expect(wa.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows only the icon for a number the shop has', () => {
    render(<ul><ProductCardView card={card} imageUrl={null} contact={{ tel: 'tel:+919876543210', wa: null }} /></ul>)
    expect(screen.queryByRole('link', { name: /WhatsApp/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Call the shop/ })).toBeInTheDocument()
  })

  it('shows no contact row when the shop has no numbers, or no contact is passed', () => {
    const { container, rerender } = render(<ul><ProductCardView card={card} imageUrl={null} contact={{ tel: null, wa: null }} /></ul>)
    expect(container.querySelector('.card-contact')).toBeNull()
    rerender(<ul><ProductCardView card={card} imageUrl={null} /></ul>)
    expect(container.querySelector('.card-contact')).toBeNull()
    expect(screen.getByRole('link', { name: 'Nova X1' })).toHaveAttribute('href', '/products/nova-x1')
  })
})
