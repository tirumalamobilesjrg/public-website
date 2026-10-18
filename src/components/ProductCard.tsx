import Image from 'next/image'
import Link from 'next/link'
import type { Availability, ProductCard as Card } from '@/lib/catalogue-types'
import { availabilityLabel, formatPrice } from '@/lib/format'

export function AvailabilityBadge({ value }: { value: Availability }) {
  return <span className={value === 'in_stock' ? 'badge badge-in' : 'badge badge-out'}>{availabilityLabel(value)}</span>
}

export function Price({ price, from = false }: { price: number | null; from?: boolean }) {
  if (price === null) return <span className="price-na">Ask in store for price</span>
  return (
    <span className="price">
      {from && <small>From </small>}
      {formatPrice(price)}
    </span>
  )
}

/** `imageUrl` is resolved by the page (server) so this component stays free of environment access. */
export function ProductCardView({ card, imageUrl }: { card: Card; imageUrl: string | null }) {
  return (
    <li>
      <article className="card">
        <div className="card-img">
          {imageUrl ? <Image src={imageUrl} alt={card.image?.alt_text ?? `${card.name}`} width={320} height={320} sizes="(min-width:1100px) 280px, (min-width:700px) 30vw, 46vw" /> : <span className="noimg">Photo coming soon</span>}
        </div>
        <div className="card-body">
          <span className="brand-line">{card.brand_name}</span>
          <Link href={`/products/${card.slug}`}>{card.name}</Link>
          <Price price={card.fromPrice} from={card.priced} />
          <AvailabilityBadge value={card.availability} />
        </div>
      </article>
    </li>
  )
}
