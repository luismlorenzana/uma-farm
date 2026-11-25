import { CROP_IDS } from '@farm/domain'
import { expect, it, vi } from 'vitest'
import { drawPlotCrop } from './plot-crops'

it('draws all 51 plantables at every growth stage with a ripe marker inside the plot framing', () => {
  expect(CROP_IDS).toHaveLength(51)
  const stamp = vi.fn()
  for (const crop of CROP_IDS) {
    const stages = ['seed', 'sprout', 'growing', 'nearly', 'ripe'] as const
    const drawings = stages.map(look => {
      stamp.mockClear()
      const marker = drawPlotCrop(stamp, crop, look, 0, 0)
      if (look === 'ripe') {
        expect(marker).toBeGreaterThan(.28)
        expect(marker).toBeLessThan(1.3)
      } else expect(marker).toBeNull()
      expect(stamp).toHaveBeenCalled()
      return JSON.stringify(stamp.mock.calls)
    })
    expect(new Set(drawings).size).toBe(stages.length)
  }
})

it('leaves dormant orchard wood standing and removes fruit and foliage', () => {
  const stamp = vi.fn()
  expect(drawPlotCrop(stamp, 'apple', 'dormant', 0, 0)).toBeNull()
  expect(stamp.mock.calls.map(([shape]) => shape)).toEqual(['box', 'box', 'box'])
})
