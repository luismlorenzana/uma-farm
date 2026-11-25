import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { followCamera, PLOT_FOV, plotDistance, roomCamera, ROOM_ELEVATION, ROOM_FOV, ROOM_SPRITE_PITCH, TRAVEL_AZIMUTH, TRAVEL_ELEVATION } from './travel-camera'

describe('the locked travel camera', () => {
  it('fits the plot and raised crops at both landscape sizes and beside an action panel', () => {
    expect(TRAVEL_AZIMUTH).toBe(0)
    const pitch = TRAVEL_ELEVATION * Math.PI / 180
    const width = 8.3, depth = 5.55, targetY = .27
    for (const aspect of [844 / 340, 579 / 325, 327 / 325]) {
      const camera = new PerspectiveCamera(PLOT_FOV, aspect, .1, 100)
      const distance = plotDistance(aspect, width, depth, targetY)
      camera.position.set(0, targetY + distance * Math.sin(pitch), distance * Math.cos(pitch))
      camera.lookAt(0, targetY, 0)
      camera.updateMatrixWorld()
      for (const x of [-width / 2, width / 2]) for (const y of [0, 1.3]) for (const z of [-depth / 2, depth / 2]) {
        const point = new Vector3(x, y, z).project(camera)
        expect(Math.abs(point.x)).toBeLessThan(.941)
        expect(Math.abs(point.y)).toBeLessThan(.901)
      }
    }
  })

  it('keeps room sprites square to the screen and anchored to the floor', () => {
    const pitch = ROOM_ELEVATION * Math.PI / 180
    expect(ROOM_ELEVATION).toBeLessThan(30)
    const xAxis = new Vector3(1, 0, 0)
    for (const aspect of [557 / 330, 422 / 315]) {
      const camera = new PerspectiveCamera(ROOM_FOV, aspect, .1, 100)
      camera.position.set(0, .82 + 20 * Math.sin(pitch), 20 * Math.cos(pitch))
      camera.lookAt(0, .82, 0)
      camera.updateMatrixWorld()
      for (const foot of [new Vector3(0, .025, 3.15), new Vector3(3, .305, -3)]) {
        const origin = foot.clone().project(camera)
        const up = new Vector3(0, 1, 0).applyAxisAngle(xAxis, ROOM_SPRITE_PITCH)
        const right = foot.clone().add(xAxis).project(camera).x - origin.x
        const height = foot.clone().add(up).project(camera).y - origin.y
        expect(height).toBeCloseTo(right * aspect, 8)
        expect(up.dot(camera.getWorldDirection(new Vector3()))).toBeCloseTo(0, 8)
      }
    }
  })

  it('follows the walking point smoothly and recenters in the whole-room view', () => {
    const centered = roomCamera({ x: 4, z: -3 }, 'whole')
    const close = roomCamera({ x: 4, z: -3 }, 'close')
    expect(centered).toEqual({ x: 0, z: -.12, zoom: .86 })
    const walk = roomCamera({ x: 4, z: -3 }, 'walk')
    expect(walk.zoom).toBeGreaterThan(centered.zoom)
    expect(walk.zoom).toBeLessThan(close.zoom)
    expect(walk.x).toBeLessThan(close.x)
    expect(close.x).toBeGreaterThan(0)
    expect(close.z).toBeLessThan(0)
    expect(close.zoom).toBeGreaterThan(1.3)
    const next = followCamera(centered, close, 16)
    expect(next.x).toBeGreaterThan(0)
    expect(next.x).toBeLessThan(close.x)
    expect(next.zoom).toBeLessThan(close.zoom)
  })
})
