// The farm's kit: the pinned kit-farm is a complete wave-1 farm kit, and the stand-in's frames it lacks
// pack onto its page beside it, so every design builds. No WebGL or canvas: the page itself is the preview's to check.
// Invented saves only.
import { newBlock, newSave, newSaveV4, FARMHOUSE, farmDesign, type SaveV3, type SaveV4 } from '@farm/domain'
import { FARM_WAVE_1, FARM_WAVE_2, farmProblems, kitMissing, standInFarmAtlas, type KitAtlas, type KitFrame } from '@luismlorenzana/uma-stage/formats'
import { describe, expect, it } from 'vitest'
import { COPY_EXTRUDE, COPY_GAP, extrudes, farmAtlas, withStandIns } from './farm-kit'

const AT = '2026-11-12T10:00:00.000Z'
function everyOpen(): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, farm: { ...save.farm, chapter: 9, points: 30_000 }, buildings: { ...save.buildings, mill: 1, sawmill: 1, smokehouse: 1 }, fields: { blocks: (['A', 'B', 'C', 'D'] as const).map(newBlock) } }
}
function v4(houses: number, open = false): SaveV4 {
  const save = newSaveV4('u1', AT)
  const built = Array.from({ length: houses }, (_, i) => ({ name: `Home ${i + 1}`, extended: false }))
  return {
    ...save, farmer: { name: 'Robin' },
    farm: open ? { ...save.farm, chapter: 9, points: 30_000 } : save.farm,
    buildings: open ? { ...save.buildings, mill: 1, sawmill: 1, smokehouse: 1, forge: 1 } : save.buildings,
    homestead: { ...save.homestead, houses: [FARMHOUSE, ...built], slept: [0, ...built.map(() => 0)] },
  }
}

/** A frame's box with a margin round it, for overlap checks. */
const grown = (f: Pick<KitFrame, 'x' | 'y' | 'w' | 'h'>, m: number) => ({ x0: f.x - m, y0: f.y - m, x1: f.x + f.w + m, y1: f.y + f.h + m })
const overlaps = (a: ReturnType<typeof grown>, b: ReturnType<typeof grown>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1

describe('kit-farm, pinned (uma-art 2.27.0, KF13)', () => {
  const kit = farmAtlas()
  it('is a farm kit with wave 1 whole and wave 2 to come, on one 2048 page', () => {
    expect(kit.kind).toBe('farm')
    expect(kitMissing(kit)).toEqual([])
    expect(Object.keys(kit.frames).sort()).toEqual([...FARM_WAVE_1].sort())
    expect(kitMissing(kit, FARM_WAVE_2)).toHaveLength(30)
    expect(kit.pages).toEqual([{ file: 'atlas.png', width: 2048, height: 2048 }])
  })
  it('mounts the sails at their hub, the chimney at its foot and the flower box at its top (D70)', () => {
    expect(['mill-sails', 'chimney', 'flower-box'].map((n) => [kit.frames[n]!.role, kit.frames[n]!.foot]))
      .toEqual([['sign', { x: 192, y: 192 }], ['sign', { x: 32, y: 186 }], ['sign', { x: 64, y: 30 }]])
  })
  it('refuses a kit of another kind, or one missing a wave-1 frame', () => {
    const raw = structuredClone(kit) as KitAtlas
    expect(() => farmAtlas({ ...raw, kind: 'town' })).toThrow(/missing|not a farm kit/)
    const { 'flower-box': _, ...frames } = raw.frames
    expect(() => farmAtlas({ ...raw, frames })).toThrow(/missing.*flower-box/)
  })
})

describe('the stand-in\'s frames for what the kit lacks (KF14)', () => {
  const kit = farmAtlas(), standIn = standInFarmAtlas()
  const { atlas, copies } = withStandIns(kit, standIn)

  it('copies exactly wave 2\'s 30, so nothing is missing, and keeps every kit-farm frame where it is', () => {
    expect(copies.map((c) => c.name).sort()).toEqual([...FARM_WAVE_2].sort())
    expect(kitMissing(atlas, FARM_WAVE_2)).toEqual([])
    for (const [name, f] of Object.entries(kit.frames)) expect(atlas.frames[name]).toEqual(f)
  })
  it('keeps each copy\'s role, set, foot, blocking and light, at its new place', () => {
    for (const c of copies) {
      const { x: _x, y: _y, ...rest } = c.from
      expect(atlas.frames[c.name]).toEqual({ ...rest, page: 0, x: c.to.x, y: c.to.y })
    }
    expect(atlas.frames['forge-chimney']!.light).toEqual(standIn.frames['forge-chimney']!.light)
  })
  it('packs them below kit-farm\'s frames, on its page, apart from each other and with room for the extruded edges', () => {
    expect(atlas.pages).toEqual([{ file: 'atlas.png', width: 2048, height: 2048 }])
    const lowest = Math.max(...Object.values(kit.frames).map((f) => f.y + f.h))
    const boxes = Object.entries(atlas.frames).map(([name, f]) => ({ name, f, copied: copies.some((c) => c.name === name) }))
    for (const { f, copied } of boxes) {
      expect(f.x + f.w).toBeLessThanOrEqual(2048)
      expect(f.y + f.h).toBeLessThanOrEqual(2048)
      if (copied) expect(f.y).toBeGreaterThanOrEqual(lowest + COPY_GAP)
    }
    const copied = boxes.filter((b) => b.copied)
    for (const a of copied) {
      expect(a.f.x).toBeGreaterThanOrEqual(COPY_EXTRUDE)
      for (const b of boxes) if (a !== b) expect(overlaps(grown(a.f, extrudes(a.f) ? COPY_EXTRUDE : 0), grown(b.f, 0)), `${a.name} and ${b.name}`).toBe(false)
    }
  })
  it.each([
    ['a fresh v3', newSave('u1', AT), false], ['every place open on v3', everyOpen(), false], ['a v4 with three houses', v4(3), true],
    ['a v4 with every house and place', v4(6, true), true],
  ] as const)('builds %s with no problems', (_, save, homestead) => {
    expect(farmProblems(farmDesign(save, { homestead }), atlas)).toEqual([])
  })
  it('copies nothing once the kit has every frame, and grows the page only when the copies don\'t fit', () => {
    expect(withStandIns(standIn, standIn)).toEqual({ atlas: standIn, copies: [] })
    const full: KitAtlas = { ...kit, frames: { ...kit.frames, low: { page: 0, x: 0, y: 1900, w: 128, h: 128, role: 'prop' } } }
    const grownPlan = withStandIns(full, standIn)
    const bottom = Math.max(...Object.values(grownPlan.atlas.frames).map((f) => f.y + f.h))
    expect(grownPlan.atlas.pages[0]!.height).toBeGreaterThanOrEqual(bottom + COPY_GAP)
    expect(grownPlan.atlas.pages[0]!.height % 4).toBe(0)
  })
  it('extrudes the pieces that tile or meet, not the cut-outs', () => {
    expect(['paddock', 'building-wall-stone-1', 'wall-rock', 'riser-quarry'].every((n) => extrudes(atlas.frames[n]!))).toBe(true)
    expect(['mine-mouth', 'herb-box', 'anvil'].some((n) => extrudes(atlas.frames[n]!))).toBe(false)
  })
})
