import { describe, expect, it } from 'vitest'
import { contactFrom, whatsappLink } from './contact'

describe('whatsappLink', () => {
  it('opens the chat with a message that names the phone and its public price', () => {
    const url = new URL(whatsappLink('https://wa.me/919876543210', 'Nova X1', 15999))
    expect(url.origin + url.pathname).toBe('https://wa.me/919876543210')
    expect(url.searchParams.get('text')).toBe('Hi, I am interested in Nova X1 (₹15,999) that I saw on your website. Is it available?')
  })
  it('leaves the price out when the shop has not published one', () => {
    const text = new URL(whatsappLink('https://wa.me/919876543210', 'Nova X1', null)).searchParams.get('text')
    expect(text).toBe('Hi, I am interested in Nova X1 that I saw on your website. Is it available?')
  })
  it('encodes names so they cannot break out of the link', () => {
    const url = whatsappLink('https://wa.me/919876543210', 'A&B #1 "Pro"', null)
    expect(url).not.toMatch(/[ "#](?=.*$)/)
    expect(new URL(url).searchParams.get('text')).toContain('A&B #1 "Pro"')
    expect(new URL(url).hash).toBe('')
  })
})

describe('contactFrom', () => {
  const phone = { tel: 'tel:+919876543210', wa: 'https://wa.me/919876543210' }
  const chat = { tel: 'tel:+919000000000', wa: 'https://wa.me/919000000000' }
  it('calls the phone number and chats on the WhatsApp number', () => {
    expect(contactFrom(phone, chat)).toEqual({ tel: 'tel:+919876543210', wa: 'https://wa.me/919000000000' })
  })
  it('is empty for a missing number, so the card shows no icon for it', () => {
    expect(contactFrom(null, chat)).toEqual({ tel: null, wa: 'https://wa.me/919000000000' })
    expect(contactFrom(phone, null)).toEqual({ tel: 'tel:+919876543210', wa: null })
    expect(contactFrom(null, null)).toEqual({ tel: null, wa: null })
  })
})
