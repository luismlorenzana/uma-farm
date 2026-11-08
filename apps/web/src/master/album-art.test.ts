// Copied from uma-rpg apps/web/src/master/album-art.test.ts at 30a322a (F5): the album's art adapter, with invented paths.
import type { ArtIndex } from '@luismlorenzana/uma-data'
import { describe, expect, it } from 'vitest'
import { albumImagePath } from './album-art'

const image = (path: string) => ({ path, width: 192, height: 192 })
const art: ArtIndex = { atlases: {}, images: {
  'outfit-faces': { '81001': image('art/face.webp') },
  'outfit-busts': { '81001': image('art/bust.webp') },
  'outfit-chibis': { '81001-a': image('art/chibi.webp') },
} }

describe('the album art adapter', () => {
  it('maps each kit kind to its outfit family and chibi pose', () => {
    expect(albumImagePath(art, 'face', '81001')).toBe('art/face.webp')
    expect(albumImagePath(art, 'bust', '81001')).toBe('art/bust.webp')
    expect(albumImagePath(art, 'chibi', '81001')).toBe('art/chibi.webp')
    // Icons are frames in an atlas: the tile uses the provider's AtlasSprite fallback.
    expect(albumImagePath(art, 'icon', '81001')).toBeNull()
  })

  it('leaves missing art to the fallback rather than inventing a URL', () => {
    expect(albumImagePath(null, 'face', '81001')).toBeNull()
    expect(albumImagePath({ atlases: {}, images: {} }, 'face', '81001')).toBeNull()
    expect(albumImagePath(art, 'face', 'missing')).toBeNull()
  })
})
