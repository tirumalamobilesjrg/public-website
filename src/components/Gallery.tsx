'use client'
import Image from 'next/image'
import { useState } from 'react'

export type GalleryImage = { url: string; alt: string }

/** Main photo with tappable thumbnails. Without JavaScript the main photo still shows; thumbnails only appear for 2+ photos. */
export function Gallery({ images, fallbackAlt }: { images: GalleryImage[]; fallbackAlt: string }) {
  const [index, setIndex] = useState(0)
  const current = images[index] ?? images[0]
  return (
    <div className="gallery">
      <div className="main">
        {current ? <Image src={current.url} alt={current.alt || fallbackAlt} width={640} height={640} priority={index === 0} sizes="(min-width:800px) 45vw, 100vw" /> : <span className="noimg">Photo coming soon</span>}
      </div>
      {images.length > 1 && (
        <div className="thumbs" role="group" aria-label="Product photos">
          {images.map((img, i) => (
            <button key={img.url} type="button" onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1} of ${images.length}`} aria-current={i === index}>
              <Image src={img.url} alt="" width={64} height={64} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
