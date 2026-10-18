import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tirumala Mobiles',
    short_name: 'Tirumala',
    description: 'Mobile phones and accessories',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#155eef',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
