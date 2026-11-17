// The launch cast (F96): the cast kept to its ids, in the pack's order, the ones it lacks joining bare; the town's people
// and the rest of the pack untouched. Invented ids only.
import { describe, expect, it } from 'vitest'
import { LAUNCH_CAST, launchCast } from './launch'
import { STAND_IN_FILES } from './stand-in'
import { readStoryPack } from './pack'
import { withCast } from './placeholders'
import { townsfolk } from '../town/town'

const pack = readStoryPack(STAND_IN_FILES).pack!
const ids = pack.cast.umas.map((u) => u.characterId)

describe('the launch cast', () => {
  it('is 50 distinct ids: 44 characters and 6 sisters', () => {
    expect(new Set(LAUNCH_CAST).size).toBe(50)
    expect(LAUNCH_CAST.filter((id) => id.startsWith('s'))).toHaveLength(6)
    expect(LAUNCH_CAST.every((id) => /^s?\d+$/.test(id))).toBe(true)
  })

  it('keeps the cast to its ids, in the pack’s order, with each one’s story entry', () => {
    const keep = [ids[2]!, ids[0]!]
    const launched = launchCast(pack, keep)
    expect(launched.cast.umas.map((u) => u.characterId)).toEqual([ids[0], ids[2]])
    expect(launched.cast.umas[0]).toBe(pack.cast.umas[0])
    expect(townsfolk(launched)).toEqual([ids[0], ids[2]])
  })

  it('brings in one the pack lacks, bare, after the rest', () => {
    const launched = launchCast(pack, ['9555001', ids[1]!])
    expect(launched.cast.umas).toEqual([pack.cast.umas[1], { characterId: '9555001' }])
  })

  it('leaves the rest of the pack as it was: the town, the ties, the bibles', () => {
    const launched = launchCast(pack, [ids[0]!])
    expect(launched.town).toBe(pack.town)
    expect(launched.ties).toBe(pack.ties)
    expect(launched.bibles).toBe(pack.bibles)
  })

  it('an Uma already on the roster stays on the cast', () => {
    const launched = withCast(launchCast(pack, [ids[0]!]), [ids[1]!])
    expect(launched.cast.umas.map((u) => u.characterId)).toEqual([ids[0], ids[1]])
  })
})
