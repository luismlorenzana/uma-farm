import { ANIMAL_KINDS, HOME_ROOM, type Animal } from '@farm/domain'
import { describe, expect, it } from 'vitest'
import { ANIMAL_PAGE, animalFrame, animalSize } from './animal-atlas'
import { penAnimals, ranchAnimals, roomAnimals } from './ranch-actors'
import { buildRoom } from './room-kit'

const stock: Animal[] = Array.from({ length: 5 }, (_, group) => ANIMAL_KINDS.map((kind, i) => ({
  id: group + ':' + i, kind, fed: i % 2 === 0, ready: group % 2 === 1, fondness: 0, cared: false,
}))).flat()

describe('modeled ranch animals', () => {
  it.each(['coop', 'barn'] as const)('fits every owned animal in a full %s without putting them in furniture', home => {
    const animalList = ranchAnimals(stock, home)
    expect(animalList).toHaveLength(HOME_ROOM)
    const room = buildRoom(home, 'morning', 0, false)
    const indoor = roomAnimals(animalList, room.clear)
    const outdoor = penAnimals(animalList, 0, 0)
    try {
      for (const group of [indoor, outdoor]) {
        expect(group.map(a => a.animal)).toEqual(animalList)
        for (const [index, actor] of group.entries()) {
          for (const other of group.slice(index + 1)) {
            expect(Math.hypot(actor.x - other.x, actor.z - other.z)).toBeGreaterThan(.85)
          }
        }
      }
      for (const { x, z, radius } of indoor) {
        expect(room.clear({ x: x - radius, z: z + radius })).toBe(true)
        expect(room.clear({ x: x + radius, z: z - radius })).toBe(true)
      }
    } finally { room.scene.dispose() }
  })

  it('keeps idle and walking frames on the atlas and scales poultry below both livestock groups', () => {
    for (const facing of ['front', 'back', 'side'] as const) {
      const frames = Array.from({ length: 5 }, (_, frame) => animalFrame(facing, frame))
      expect(new Set(frames.map(cell => cell.x)).size).toBe(5)
      expect(frames.every(({ x, y }) => x + 32 <= ANIMAL_PAGE.width && y + 32 <= ANIMAL_PAGE.height)).toBe(true)
    }
    expect(animalSize('duck')).toBeLessThan(animalSize('goat'))
    expect(animalSize('goat')).toBeLessThan(animalSize('cow'))
  })
})
