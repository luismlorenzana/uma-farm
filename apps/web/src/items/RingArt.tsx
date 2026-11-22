import { useState } from 'react'
import { ItemIcon } from './ItemIcon'
import ring1 from '@luismlorenzana/uma-art/farm-scenes/ring-g1.webp?url'
import ring2 from '@luismlorenzana/uma-art/farm-scenes/ring-g2.webp?url'
import ring3 from '@luismlorenzana/uma-art/farm-scenes/ring-g3.webp?url'
import ring4 from '@luismlorenzana/uma-art/farm-scenes/ring-g4.webp?url'
import ring5 from '@luismlorenzana/uma-art/farm-scenes/ring-g5.webp?url'
import ring6 from '@luismlorenzana/uma-art/farm-scenes/ring-g6.webp?url'
import ring7 from '@luismlorenzana/uma-art/farm-scenes/ring-g7.webp?url'
import ring8 from '@luismlorenzana/uma-art/farm-scenes/ring-g8.webp?url'
import ring9 from '@luismlorenzana/uma-art/farm-scenes/ring-g9.webp?url'
import ring10 from '@luismlorenzana/uma-art/farm-scenes/ring-g10.webp?url'

const art: Readonly<Record<string,string>> = {
  'ring-g1': ring1,
  'ring-g2': ring2,
  'ring-g3': ring3,
  'ring-g4': ring4,
  'ring-g5': ring5,
  'ring-g6': ring6,
  'ring-g7': ring7,
  'ring-g8': ring8,
  'ring-g9': ring9,
  'ring-g10': ring10,
}

export function RingArt({ id, size = 96 }: { id: string; size?: number }) {
  return <RingDetail key={id} id={id} size={size} />
}

function RingDetail({ id, size }: { id: string; size: number }) {
  const [failed, setFailed] = useState(false)
  return <span data-ring-art={id} aria-hidden className="grid shrink-0 place-items-center overflow-hidden rounded-lg bg-sunken"
    style={{ width: size, height: size }}>
    {failed || !art[id] ? <ItemIcon id={id} size={Math.min(64, size)} />
      : <img alt="" width={size} height={size} src={art[id]} decoding="async" onError={() => setFailed(true)} />}
  </span>
}
