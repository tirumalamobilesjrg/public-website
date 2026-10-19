import { formatPrice } from './format'

/** What a product card needs to offer "call" and "WhatsApp"; either can be missing when the shop has not entered that number. */
export type Contact = { tel: string | null; wa: string | null }

/** Contact links from the shop's phone numbers: WhatsApp uses the WhatsApp number, or the phone number when there is none. */
export function contactFrom(links: { tel: string; wa: string } | null, chat: { tel: string; wa: string } | null): Contact {
  return { tel: links?.tel ?? null, wa: chat?.wa ?? null }
}

/** WhatsApp chat link with a ready-made message, so the owner knows which phone the visitor is asking about. */
export function whatsappLink(wa: string, productName: string, price: number | null): string {
  const text = `Hi, I am interested in ${productName}${price === null ? '' : ` (${formatPrice(price)})`} that I saw on your website. Is it available?`
  return `${wa}?text=${encodeURIComponent(text)}`
}
