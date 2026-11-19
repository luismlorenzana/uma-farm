import { describe, expect, it } from 'vitest'
import { castArtIdentity, castArtKey } from './art-identity'

describe('cast art identities', () => {
  const outfits = new Map([['900102', { characterId: '9001' }]])
  it('keeps the original identity separate from a sister outfit', () => {
    expect(castArtKey('9001')).toBe('9001')
    expect(castArtKey('s900102')).toBe('outfit:900102')
    expect(castArtIdentity('9001', outfits)).toEqual({ characterId: 9001 })
    expect(castArtIdentity('s900102', outfits)).toEqual({ characterId: 9001, outfitId: 900102 })
  })
  it('does not substitute the original for a missing or invalid sister', () => {
    expect(castArtIdentity('s900103', outfits)).toBeNull()
    for (const id of ['', 's0', 's-3', 's1.5', 'role-mayor', 's9007199254740993']) expect(castArtIdentity(id, outfits)).toBeNull()
  })
})
