import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { followCamera, PLOT_FOV, plotDistance, roomCamera, TRAVEL_AZIMUTH, TRAVEL_ELEVATION } from './travel-camera'

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

  it('follows the walking point smoothly and recenters in the whole-room view', () => {
    const centered = roomCamera({ x: 4, z: -3 }, true)
    const close = roomCamera({ x: 4, z: -3 }, false)
    expect(centered).toEqual({ x: 0, z: 0, zoom: 1 })
    expect(close.x).toBeGreaterThan(0)
    expect(close.z).toBeLessThan(0)
    expect(close.zoom).toBeGreaterThan(1.3)
    const next = followCamera(centered, close, 16)
    expect(next.x).toBeGreaterThan(0)
    expect(next.x).toBeLessThan(close.x)
    expect(next.zoom).toBeLessThan(close.zoom)
  })
})
