import type { ArtIndex, CharacterSpriteVariant, ReleaseManifest } from '@luismlorenzana/uma-data'
import { CONTENT } from '../content/client'
import { castArtIdentity, castArtKey } from '../dialogue/art-identity'
import { masterReady } from '../master/master'

export type WalkingOutfit = 'spring' | 'farm-work' | 'pajamas'
export interface WalkingArt { sprite: CharacterSpriteVariant; image: HTMLImageElement }

export const hasWalkingArt = (art: ArtIndex | null, id: string): boolean => {
  const key = castArtKey(id)
  return key !== null && !!art?.characterSprites?.[key]
}

const pages = new Map<string, { loading: Promise<WalkingArt>; users: number }>()
let active = 0
const queue: (() => void)[] = []

async function limited<T>(run: () => Promise<T>): Promise<T> {
  if (active >= 3) await new Promise<void>(resolve => queue.push(resolve))
  else active += 1
  try { return await run() }
  finally {
    const next = queue.shift()
    if (next) next()
    else active -= 1
  }
}

async function atlas(manifest: ReleaseManifest, sprite: CharacterSpriteVariant): Promise<WalkingArt> {
  const client = await CONTENT.release()
  const bytes = await client.file(manifest, sprite.page.path)
  const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'image/webp' }))
  const image = new Image()
  try {
    image.src = url
    await image.decode()
    if (image.naturalWidth !== sprite.page.width || image.naturalHeight !== sprite.page.height) throw new Error('Walking atlas size differs from the descriptor')
    return { sprite, image }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** A scene keeps this lease only for the lifetime of the visible figure. */
export function acquireWalkingArt(id: string, outfit: WalkingOutfit): { ready: Promise<WalkingArt | null>; release: () => void } {
  let get: (() => void) | undefined
  let gone = false
  const ready = (async (): Promise<WalkingArt | null> => {
    const view = await masterReady()
    const identity = castArtIdentity(id, view.outfits)
    const key = castArtKey(id)
    if (gone || !view.art || !key || !identity || !view.art.characterSprites?.[key]) return null
    const client = await CONTENT.release()
    const set = await client.characterSprites(view.manifest, view.art, identity.characterId, identity.outfitId)
    const sprite = set?.variants[outfit] ?? set?.variants.spring
    if (gone || !sprite) return null
    const hash = view.manifest.files.find(file => file.path === sprite.page.path)?.sha256
    if (!hash) return null
    const page = pages.get(hash) ?? { users: 0, loading: limited(() => atlas(view.manifest, sprite)) }
    page.users += 1
    pages.set(hash, page)
    get = () => {
      page.users -= 1
      if (page.users === 0) pages.delete(hash)
    }
    try {
      const found = await page.loading
      return { sprite, image: found.image }
    } catch {
      return null
    }
  })().catch(() => null)
  return { ready, release() {
    if (gone) return
    gone = true
    get?.()
  } }
}
