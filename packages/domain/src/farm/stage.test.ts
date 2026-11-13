// The farm on the HD-2D stage: the save as a farm design, parsed by uma-stage's own format, with
// every recipe's frames in the farm kit's contract, built with no problems on the stand-in farm kit (`farmProblems`, what
// `BandStage.setWorld` refuses on), and the crops by family. All from the stage's three-free `/formats` entry (0.4.0).
import {
  FARM_WAVE_1, FARM_WAVE_2, farmProblems, farmReach, KIT_REQUIRED, parseFarmDesign, SAMPLE_FARM, standInFarmAtlas, type FarmDesign,
} from '@luismlorenzana/uma-stage/formats'
import { describe, expect, it } from 'vitest'
import { CROP_IDS } from '../goods/ids'
import { newSave, newBlock, type Plot, type SaveV3 } from '../save/v3'
import { FARMHOUSE, newSaveV4, type SaveV4 } from '../save/v4'
import { CROPS } from '../fields/crops'
import { FARM_PLACES } from './places'
import {
  CROP_FAMILIES, CROP_FAMILY, cropFrame, FARM_BAND, FARM_STAGE_TILES, farmDesign, farmPlots, FIELDS_CROP_TILES, fieldsFrames, placeStands, plotAt, slotId,
  WINDOW_BOX_LEVEL,
} from './stage'

const AT = '2026-11-12T10:00:00.000Z'
const fresh = (): SaveV3 => newSave('u1', AT)
const plot = (crop: Plot['crop'], growth = 0, ready = false): Plot => ({ crop, growth, ready, regrowing: false, own: false })

/** A played v3 farm: chapter 2 at Farm Rank 3, the Mill and Sawmill built, blocks A and B planted, a night's withering. */
function played(): SaveV3 {
  const save = fresh()
  const a = { ...newBlock('A'), plots: [plot('carrot', 0.5), plot('carrot', 3), plot('carrot', 4, true), plot('potato', 1), ...Array.from({ length: 5 }, () => plot(null))] }
  const b = { ...newBlock('B'), plots: [plot('cabbage', 7.5, true), ...Array.from({ length: 8 }, () => plot(null))] }
  return {
    ...save, farm: { ...save.farm, chapter: 2, points: 1300 }, buildings: { ...save.buildings, mill: 1, sawmill: 1, smokehouse: 0 },
    fields: { blocks: [a, b] },
    summary: { day: 1, bin: [], work: [{ kind: 'withered', block: 'A', crop: 'onion', plots: 2 }], ranks: [], bonds: [], news: [], nudges: [] },
  }
}
/** Every place CS3 can open: chapter 9, Farm Rank 10, the stations built. */
function everyOpen(): SaveV3 {
  const save = fresh()
  return { ...save, farm: { ...save.farm, chapter: 9, points: 30_000 }, buildings: { ...save.buildings, mill: 1, sawmill: 1, smokehouse: 1 }, fields: { blocks: (['A', 'B', 'C', 'D'] as const).map(newBlock) } }
}
/** A v4 farm with the Farmhouse and `houses` more built. */
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

const HOME = { homestead: true }
const M4 = { homestead: false }
const CASES: [string, () => FarmDesign][] = [
  ['a fresh v3', () => farmDesign(fresh(), M4)],
  ['a played v3', () => farmDesign(played(), M4)],
  ['every place open on v3', () => farmDesign(everyOpen(), M4)],
  ['a v4 with three houses', () => farmDesign(v4(3), HOME)],
  ['a v4 with every house and place', () => farmDesign(v4(6, true), HOME)],
]
/** The frames a design draws: its props, mounted pieces and doors, and its ground and building sets' families. */
function framesOf(design: FarmDesign): string[] {
  const out = new Set<string>()
  for (const p of design.props ?? []) out.add(p.name)
  for (const b of design.buildings) {
    for (const m of b.mounts) out.add(m.name)
    if (b.door) out.add(b.door.frame ?? (b.door.wide ? `door-wide-${b.walls}` : `door-${b.walls}`))
    out.add(`building-wall-${b.walls}-1`).add(`window-${b.walls}-1`).add(`roof-${b.roof}-1`)
  }
  const ground: Record<string, string> = { g: 'grass-1', p: 'path-1', t: 'tilled-1', f: 'forest-floor-1', w: 'water-1', v: 'paving-1', d: 'paddock', q: 'quarry-1', '#': 'wall-rock' }
  for (const row of design.cells) for (const c of row) out.add(ground[c]!)
  return [...out]
}

describe('the farm design (decision 2)', () => {
  it.each(CASES)('parses for %s, every slot reached from the Gate, every frame in the kit\'s contract', (_, make) => {
    const design = make()
    expect(parseFarmDesign(JSON.parse(JSON.stringify(design)))).toEqual(design)
    expect(design.cells[0]).toHaveLength(FARM_STAGE_TILES)
    const contract = new Set([...KIT_REQUIRED.farm, ...FARM_WAVE_1, ...FARM_WAVE_2])
    expect(framesOf(design).filter((f) => !contract.has(f))).toEqual([])
    // Blocking props close their tiles: the slots stay reachable past them.
    const blocking = new Set(['tree-1', 'tree-2', 'tree-3', 'stump', 'scarecrow', 'log-pile', 'smoker', 'bin', 'crates', 'barrel', 'sack', 'fence-1', 'fence-2', 'brambles', 'bush-2',
      'lantern', 'ore-cart', 'quarry-rock-1', 'quarry-rock-2', 'stone-stack', 'furnace', 'grindstone', 'anvil', 'ring-bench', 'trough', 'hay-bale', 'cafe-table', 'flagpole',
      'signpost', 'notice-board'])
    const blocked = new Set((design.props ?? []).filter((p) => blocking.has(p.name)).map((p) => `${p.x},${p.z}`))
    const reach = farmReach(design, blocked)
    for (const m of design.markers.filter((k) => k.kind === 'slot' || k.kind === 'place' || k.kind === 'lot')) expect(reach.has(`${m.x},${m.z}`), `${m.kind} ${m.id}`).toBe(true)
  })

  it.each(CASES)('builds %s on the stand-in farm kit with no problems', (_, make) => {
    expect(farmProblems(make(), standInFarmAtlas())).toEqual([])
  })

  it('agrees with the stage\'s own sample on the stand-in (the check is real)', () => {
    expect(farmProblems(SAMPLE_FARM, standInFarmAtlas())).toEqual([])
    expect(farmProblems({ ...SAMPLE_FARM, props: [{ name: 'not-a-frame', x: 0, z: 0 }] }, standInFarmAtlas())).toEqual(['no prop frame not-a-frame'])
  })

  it('lays the map\'s eight rows, 32 tiles deep, the Gate in the middle of the seventh, the town edge last', () => {
    const design = farmDesign(fresh(), M4)
    expect(design.cells).toHaveLength(8 * FARM_BAND)
    expect(design.markers.find((m) => m.kind === 'gate')).toEqual({ kind: 'gate', id: 'gate', x: 4, z: 26 })
    expect(design.markers.filter((m) => m.kind === 'place').map((m) => m.id)).toEqual([...FARM_PLACES.map((p) => p.id)])
    for (const place of FARM_PLACES) {
      const m = design.markers.find((k) => k.kind === 'place' && k.id === place.id)!
      expect([m.x, m.z], place.id).toEqual([place.col * 3 + 1, (place.row - 1) * FARM_BAND + 2])
    }
    // Path rows under every band; the pond and the pit at level 0.
    for (let band = 0; band < 8; band++) expect(design.cells[band * FARM_BAND + 3]).toBe('ppppppppp')
  })

  it('stands open places by their recipe and the rest as overgrown lots (KF4, KF7)', () => {
    const design = farmDesign(fresh(), M4)
    expect(design.buildings.map((b) => b.id)).toEqual(['warehouse', 'dorm', 'shop'])
    const props = (x: number, z: number) => (design.props ?? []).filter((p) => p.x >= x && p.x < x + 3 && p.z >= z && p.z < z + 3).map((p) => p.name)
    expect(props(3, 0)).toEqual(['weeds-1', 'brambles', 'weeds-2', 'fence-broken']) // the Mill, before chapter 1's reward
    expect(props(0, 4)).toContain('tree-1')
    expect(design.heights![8]).toBe('001111111') // the pond
    expect(design.cells[8]).toBe('wwppggpgg') // the lanes: the Smokehouse's and the Kitchen's lots keep theirs
    const open = farmDesign(everyOpen(), M4)
    expect(open.buildings.map((b) => b.id)).toEqual(['mill', 'coop', 'sawmill', 'barn', 'smokehouse', 'kitchen', 'smelter', 'restaurant', 'cutter', 'forge', 'warehouse', 'dorm', 'shop', 'expeditions'])
    expect(open.cells[12]).toBe('###pggvvv') // the Mine's cliff; the Restaurant's paving
    expect(open.heights![16]).toBe('001111111') // the quarry's pit
    // The board and the festival ground wait for M6: still overgrown.
    expect(placeStands(everyOpen(), FARM_PLACES.find((p) => p.id === 'board')!)).toBe(false)
  })

  it('puts a work place\'s four slots and the Fields\' one an owned block', () => {
    const slots = (design: FarmDesign) => design.markers.filter((m) => m.kind === 'slot').map((m) => m.id)
    expect(slots(farmDesign(fresh(), M4))).toEqual(['fields-a', 'forest-1', 'forest-2', 'forest-3', 'forest-4', 'fishery-1', 'fishery-2', 'fishery-3', 'fishery-4'])
    const open = slots(farmDesign(everyOpen(), M4))
    for (const id of ['mill', 'sawmill', 'smokehouse', 'mine', 'smelter', 'quarry', 'cutter']) expect(open.filter((s) => s.startsWith(`${id}-`)), id).toHaveLength(4)
    expect(open.filter((s) => s.startsWith('fields-'))).toEqual(['fields-a', 'fields-b', 'fields-c', 'fields-d'])
    expect(slotId('mill', 0)).toBe('mill-1')
    // A station open by the rule but not built yet is still a lot: no slots.
    expect(slots(farmDesign(played(), M4)).filter((s) => s.startsWith('smokehouse'))).toEqual([])
  })

  it('grows the homestead\'s rows on v4 in the romance build: the Farmhouse, the houses, the next lot (F54)', () => {
    const three = farmDesign(v4(3), HOME)
    expect(three.cells).toHaveLength(10 * FARM_BAND)
    expect(three.markers.filter((m) => m.kind === 'lot')).toEqual([{ kind: 'lot', id: 'house-4', x: 4, z: 34 }])
    expect(three.buildings.filter((b) => b.id === 'farmhouse' || b.id.startsWith('house-')).map((b) => b.id)).toEqual(['farmhouse', 'house-1', 'house-2', 'house-3'])
    expect(three.markers.find((m) => m.kind === 'place' && m.id === 'shop')!.z).toBe(9 * FARM_BAND + 2)
    expect(farmDesign(v4(6, true), HOME).cells).toHaveLength(11 * FARM_BAND)
    // Without the homestead option, or on v3, the map's eight rows only.
    expect(farmDesign(v4(3), M4).cells).toHaveLength(8 * FARM_BAND)
    expect(farmDesign(fresh(), HOME).cells).toHaveLength(8 * FARM_BAND)
  })

  it('hangs every window box just under a ground-floor window\'s sill, at 1¼ levels (D73)', () => {
    const boxes = CASES.flatMap(([, make]) => make().buildings.flatMap((b) => b.mounts.filter((m) => m.name.endsWith('-box')).map((m) => ({ ...m, storeys: b.storeys }))))
    expect(boxes.length).toBeGreaterThan(0)
    expect(new Set(boxes.map((m) => `${m.name} ${m.face} ${m.level}`))).toEqual(new Set(['flower-box front 1.25', 'herb-box front 1.25']))
    expect(WINDOW_BOX_LEVEL).toBe(1.25)
    // The window piece is a storey's levels 1–2: a box between them hangs under the ground floor's windows.
    expect(boxes.every((m) => m.level > 1 && m.level < 2)).toBe(true)
  })

  it('finds the plot under a tile, its path row with it', () => {
    const plots = farmPlots(fresh(), M4)
    expect(plotAt(plots, 4, 3)?.id).toBe('mill')
    expect(plotAt(plots, 7, 26)?.id).toBe('open-ground')
    expect(plotAt(plots, 1, 30)?.id).toBe('shop')
    expect(plotAt(plots, 9, 0)).toBeUndefined()
  })
})

describe('the crops (decision 3, KF6)', () => {
  it('maps every crop of CS11 to one of KF6\'s twelve families', () => {
    expect(Object.keys(CROP_FAMILY).sort()).toEqual([...CROP_IDS].sort())
    expect(new Set(Object.values(CROP_FAMILY))).toEqual(new Set(CROP_FAMILIES))
    expect(Object.keys(CROPS)).toHaveLength(27)
  })

  it('shows a sprout, then growing from half its growth, then its family once Ready', () => {
    expect(cropFrame(plot(null))).toBeNull()
    expect(cropFrame(plot('carrot', 0))).toBe('crop-sprout')
    expect(cropFrame(plot('carrot', 1.75))).toBe('crop-growing')
    expect(cropFrame(plot('corn', 9, true))).toBe('crop-corn')
    expect(cropFrame(plot('emperor-pumpkin', 10, true))).toBe('crop-gourd')
  })

  it('fills the Fields\' eight tiles in block order, with last night\'s withered plots while the morning shows them', () => {
    const save = played()
    const frames = fieldsFrames(save)
    expect(frames).toHaveLength(18)
    expect(frames.slice(0, 7).map((f) => f.frame)).toEqual(['crop-sprout', 'crop-growing', 'crop-root', 'crop-sprout', 'crop-withered', 'crop-withered', null])
    expect(frames[9]).toEqual({ block: 'B', index: 0, frame: 'crop-leafy' })
    expect(fieldsFrames({ ...save, summary: null }).filter((f) => f.frame === 'crop-withered')).toEqual([])
    const design = farmDesign(save, M4)
    const crops = (design.props ?? []).filter((p) => p.name.startsWith('crop-'))
    expect(crops.map((p) => [p.name, p.x, p.z])).toEqual([
      ['crop-sprout', 0, 0], ['crop-growing', 1, 0], ['crop-root', 2, 0], ['crop-sprout', 0, 1], ['crop-withered', 2, 1], ['crop-withered', 0, 2],
    ])
    expect(FIELDS_CROP_TILES).toHaveLength(8)
  })
})
