import { ImageResponse } from 'next/og'

const SIZES = new Set(['192', '512'])

/** PNG app icons generated from the text mark (placeholder until the owner supplies a logo). */
export async function GET(_req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params
  if (!SIZES.has(size)) return new Response('Not found', { status: 404 })
  const px = Number(size)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#155eef', color: '#fff', fontSize: px * 0.6, fontWeight: 700 }}>
        T
      </div>
    ),
    { width: px, height: px },
  )
}
