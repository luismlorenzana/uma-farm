import { characterArtKey, type CharacterArtIdentity } from '@luismlorenzana/uma-data'

/** The cast owns sister IDs; master data retains the real character and outfit. */
export function castArtKey(id: string): string | null {
  if (/^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id))) return id
  const match = /^s([1-9]\d*)$/.exec(id)
  return match && Number.isSafeInteger(Number(match[1])) ? 'outfit:' + match[1] : null
}

export function castArtIdentity(id: string, outfits: ReadonlyMap<string, { characterId: string }>): CharacterArtIdentity | null {
  const key = castArtKey(id)
  if (!key) return null
  if (!key.startsWith('outfit:')) return { characterId: Number(id) }
  const outfitId = id.slice(1), character = outfits.get(outfitId)?.characterId
  if (!character || !/^[1-9]\d*$/.test(character) || !Number.isSafeInteger(Number(character))) return null
  const identity = { characterId: Number(character), outfitId: Number(outfitId) }
  return characterArtKey(identity.characterId, identity.outfitId) === key ? identity : null
}
