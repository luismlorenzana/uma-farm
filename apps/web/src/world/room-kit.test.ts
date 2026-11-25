import { describe, expect, it } from 'vitest'
import { buildRoom } from './room-kit'
import { ROOMS, type RoomId } from './room-specs'
import { ENTRANCE, walkPath } from './room-walk'

describe('modeled room walk surfaces', () => {
  it.each(Object.keys(ROOMS) as RoomId[])('keeps %s reachable from its entrance', roomId => {
    const room = buildRoom(roomId, 'morning', 0, false)
    try {
      expect(room.clear(ENTRANCE)).toBe(true)
      expect(room.anchors.size).toBeGreaterThanOrEqual(6)
      for (const [x, y, z] of room.anchors.values()) {
        expect(room.clear({ x, z })).toBe(true)
        expect(y).toBeCloseTo((room.heightAt?.({ x, z }) ?? 0) + .025)
        const end = walkPath(ENTRANCE, { x, z }, room.clear).at(-1)
        expect(Math.hypot((end?.x ?? 99) - x, (end?.z ?? 99) - z)).toBeLessThan(.4)
      }
    } finally { room.scene.dispose() }
  })

  it.each(['mine', 'quarry'] as const)('matches the %s ramp and rear deck elevations', roomId => {
    const room = buildRoom(roomId, 'night', 0, false)
    try {
      expect(room.heightAt?.(ENTRANCE)).toBe(0)
      expect(room.heightAt?.({ x: 0, z: -2 })).toBeCloseTo(.14)
      expect(room.heightAt?.({ x: 0, z: -3 })).toBeCloseTo(.28)
    } finally { room.scene.dispose() }
  })
})
