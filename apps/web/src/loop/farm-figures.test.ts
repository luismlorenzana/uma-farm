// The farm's Umas on the stage: who stands where, checked against the Hub's own counts (the work
// view's cards the pips draw, the Fields' tenders, the places' Ready badges), the idle spots and their staying put, the
// bubbles, and what moves between two readings. Invented saves and ids only; the kit's blocking is the stand-in's.
import {
  farmDesign, farmEnv, farmHome, farmPlots, FARMHOUSE, LOOP_WORK_PLACES, loopReadyWork, loopWorld, newBlock, newLove, newRosterUma, newSave, startLoopJob, workNow, type FarmSave, type SaveV4,
} from '@farm/domain'
import { workView } from '@luismlorenzana/uma-kit/work'
import { standInFarmAtlas } from '@luismlorenzana/uma-stage/formats'
import { describe, expect, it } from 'vitest'
import { fieldsPips } from './FieldsPeek'
import {
  assignSpots, farmFigures, figureMoves, idleTiles, moveMode, slotFacing, standable, yardSpots, type FarmFigure,
} from './farm-figures'

const AT = '2026-11-12T10:00:00.000Z'
const atlas = standInFarmAtlas()
const blocks = (name: string) => atlas.frames[name]?.blocks ?? false

/** Day 1 of a farm with six Umas home, blocks A and B owned, A tended by 505. */
function farm(): SaveV4 {
  const save = newSave('u1', AT)
  const ids = ['101', '202', '303', '404', '505', '606']
  return {
    ...save, roster: Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])), love: Object.fromEntries(ids.map((id) => [id, newLove()])), dorm: { level: 3, home: ids, swaps: [] },
    fields: { blocks: [{ ...newBlock('A'), tender: '505' }, newBlock('B')] },
  }
}
const forage = (count: number) => ({ kind: 'forage', item: 'woods', count })
const fish = (count: number) => ({ kind: 'fish', item: 'pond', count })
/** 101 and 202 in the forest (2 and 1 days), 303 at the Fishery (1 day). */
function working(): SaveV4 {
  let save = farm()
  save = startLoopJob(save, { outfitId: '101', place: 'forest', slot: 0, request: forage(2) }, AT)
  save = startLoopJob(save, { outfitId: '202', place: 'forest', slot: 2, request: forage(1) }, AT)
  save = startLoopJob(save, { outfitId: '303', place: 'fishery', slot: 1, request: fish(1) }, AT)
  return save
}
/** The next morning, read without a night: each finished day waits to be collected. */
const morning = <S extends FarmSave>(save: S): S => ({ ...save, calendar: { day: save.calendar.day + 1 } })

function input(save: FarmSave, hearts: ReadonlySet<string> = new Set()) {
  return { save, design: farmDesign(save), plots: farmPlots(save), work: workView(loopWorld(save), workNow(save), farmEnv()), hearts, blocks }
}
const byId = (figures: readonly FarmFigure[]) => new Map(figures.map((f) => [f.id, f]))

describe('who stands on the farm', () => {
  it('matches the Hub\'s pips: the workers at their slots, the tenders on the Fields, everyone else home in the yard', () => {
    const save = working()
    const view = input(save)
    const figures = farmFigures(view)
    // Every work place's figures are its held cards, the pips' own source.
    for (const place of LOOP_WORK_PLACES) {
      expect(figures.filter((f) => f.place === place).map((f) => f.id).sort())
        .toEqual(view.work.cards(place).flatMap((c) => (c.kind === 'held' ? [c.outfitId] : [])).sort())
    }
    // The Fields' pips with a face are the tenders.
    expect(figures.filter((f) => f.place === 'fields')).toHaveLength(fieldsPips(save).filter((p) => p.face !== undefined).length)
    // Everyone on the farm stands once; nobody else does.
    expect(figures.map((f) => f.id).sort()).toEqual(farmHome(save).sort())
    expect(figures.filter((f) => f.where === 'yard').map((f) => f.id)).toEqual(['404', '606'])
    const at = byId(figures)
    const design = view.design
    const slot = (id: string) => design.markers.find((m) => m.kind === 'slot' && m.id === id)!
    expect(at.get('101')!.tile).toEqual({ x: slot('forest-1').x, z: slot('forest-1').z })
    expect(at.get('202')!.tile).toEqual({ x: slot('forest-3').x, z: slot('forest-3').z })
    expect(at.get('303')!.tile).toEqual({ x: slot('fishery-2').x, z: slot('fishery-2').z })
    expect(at.get('505')!.tile).toEqual({ x: slot('fields-a').x, z: slot('fields-a').z })
  })

  it('stands nobody who\'s away: an Uma on the roster but not home has no figure', () => {
    const save = { ...farm(), dorm: { level: 3, home: ['101', '202'], swaps: [] }, fields: { blocks: [newBlock('A')] } }
    expect(farmFigures(input(save)).map((f) => f.id)).toEqual(['101', '202'])
  })

  it('puts a housed spouse on her house\'s apron, and the rest in the yard', () => {
    const base = newSave('u1', AT)
    const save: SaveV4 = {
      ...base, farmer: { name: 'Robin' },
      roster: { 9001: newRosterUma(1), 9002: newRosterUma(1), 9003: newRosterUma(1) },
      dorm: { level: 3, home: ['9001', '9002'], swaps: [] },
      love: { 9003: { ...newLove(), stage: 'spouse', wed: 3, house: 1 } },
      homestead: { ...base.homestead, houses: [FARMHOUSE, { name: 'Home 1', extended: false }], slept: [0, 0] },
    }
    const view = input(save)
    const figures = farmFigures(view)
    const house = view.plots.find((p) => p.kind === 'house' && p.house === 1)!
    const spouse = byId(figures).get('9003')!
    expect(spouse.where).toBe('house')
    expect(spouse.tile).toEqual({ x: house.x + 1, z: house.z + 2 })
    expect(figures.filter((f) => f.where === 'yard').map((f) => f.id)).toEqual(['9001', '9002'])
  })

  it('faces the place\'s work: toward a building beside her, else into the place; the idle face the camera', () => {
    const design = farmDesign({ ...farm(), farm: { ...farm().farm, points: 1300 }, buildings: { dorm: 1, mill: 1 } })
    const mill = (n: number) => design.markers.find((m) => m.id === `mill-${n}`)!
    expect([1, 2, 3, 4].map((n) => slotFacing(design, mill(n)))).toEqual(['right', 'right', 'right', 'back'])
    const forest = design.markers.find((m) => m.id === 'forest-1')!
    expect(slotFacing(design, forest)).toBe('back')
    expect(farmFigures(input(farm())).filter((f) => f.where === 'yard').every((f) => f.facing === 'front')).toBe(true)
  })
})

describe('the idle Umas\' spots', () => {
  const save = farm()
  const design = farmDesign(save)
  const plots = farmPlots(save)
  const ok = standable(design, blocks)
  const spots = yardSpots(design, plots, ok)

  it('are the Dorm\'s apron, middle first, the path in front of it, then the path row on to the bin', () => {
    const dorm = plots.find((p) => p.id === 'dorm')!
    expect(spots.slice(0, 6)).toEqual([
      { x: dorm.x + 1, z: dorm.z + 2 }, { x: dorm.x, z: dorm.z + 2 }, { x: dorm.x + 2, z: dorm.z + 2 },
      { x: dorm.x + 1, z: dorm.z + 3 }, { x: dorm.x, z: dorm.z + 3 }, { x: dorm.x + 2, z: dorm.z + 3 },
    ])
    expect(spots.slice(6, 12)).toEqual([5, 4, 3, 2, 1, 0].map((x) => ({ x, z: dorm.z + 3 })))
    expect(spots).toHaveLength(12)
    expect(spots.every(ok)).toBe(true)
  })

  it('hold: an idle Uma keeps her spot when another goes to work, a newcomer takes the first free one, and extras share', () => {
    const first = assignSpots(['a', 'b', 'c'], spots)
    expect([...first.values()]).toEqual(spots.slice(0, 3))
    const after = assignSpots(['b', 'c'], spots, first)
    expect(after.get('b')).toEqual(first.get('b'))
    expect(after.get('c')).toEqual(first.get('c'))
    expect(assignSpots(['b', 'c', 'd'], spots, after).get('d')).toEqual(spots[0])
    const many = assignSpots(Array.from({ length: spots.length + 2 }, (_, i) => `u${i}`), spots)
    expect(many.get(`u${spots.length}`)).toEqual(spots[0])
    expect(many.get(`u${spots.length + 1}`)).toEqual(spots[1])
  })

  it('follow the stage\'s last reading through farmFigures', () => {
    const before = farmFigures(input(save))
    const yard = before.filter((f) => f.where === 'yard')
    // 101 goes to work: the others stay where they stood.
    const next = startLoopJob(save, { outfitId: '101', place: 'forest', slot: 0, request: forage(1) }, AT)
    const after = farmFigures(input(next), idleTiles(before))
    for (const f of yard.filter((y) => y.id !== '101')) expect(byId(after).get(f.id)!.tile).toEqual(f.tile)
  })
})

describe('the bubbles', () => {
  it('show a worker\'s work when she has some to collect, as many a place as its Ready badge, and nothing while none waits', () => {
    const today = farmFigures(input(working()))
    expect(today.filter((f) => f.bubble)).toEqual([])
    const save = morning(working())
    const figures = farmFigures(input(save))
    const ready = loopReadyWork(save)
    for (const place of LOOP_WORK_PLACES) expect(figures.filter((f) => f.place === place && f.bubble?.kind === 'work')).toHaveLength(ready.get(place) ?? 0)
    // 101's two days: the first day's haul waits while she works on.
    expect(byId(figures).get('101')!.bubble).toEqual({ kind: 'work', request: forage(2), heart: false })
  })

  it('show the Fields\' crop over a tender whose block has Ready plots', () => {
    const save = farm()
    const plots = save.fields.blocks[0]!.plots.map((p, i) => (i === 3 ? { ...p, crop: 'carrot' as const, growth: 4, ready: true } : p))
    const ripe = { ...save, fields: { blocks: [{ ...save.fields.blocks[0]!, plots }, save.fields.blocks[1]!] } }
    expect(byId(farmFigures(input(ripe))).get('505')!.bubble).toEqual({ kind: 'crop', block: 'A', crop: 'carrot', heart: false })
  })

  it('carry ♥ for a Ready heart event, alone over an Uma with nothing to collect', () => {
    const figures = byId(farmFigures(input(morning(working()), new Set(['101', '404']))))
    expect(figures.get('101')!.bubble).toMatchObject({ kind: 'work', heart: true })
    expect(figures.get('404')!.bubble).toEqual({ kind: 'heart' })
    expect(figures.get('606')!.bubble).toBeNull()
  })
})

describe('what moves', () => {
  const save = farm()
  const before = farmFigures(input(save))

  it('places everyone at once at boot, the morning and a sync; walks for a change made here today', () => {
    expect(moveMode(null, 1, true)).toBe('place')
    expect(moveMode(1, 2, true)).toBe('place')
    expect(moveMode(1, 1, false)).toBe('place')
    expect(moveMode(1, 1, true)).toBe('walk')
    expect(figureMoves([], before, 'place')).toHaveLength(before.length)
    expect(figureMoves(before, before, 'place')).toEqual([])
    expect(figureMoves(before, before, 'walk')).toEqual([])
  })

  it('walks a newly put-to-work Uma from her spot to her slot, and only her', () => {
    const next = startLoopJob(save, { outfitId: '101', place: 'forest', slot: 0, request: forage(1) }, AT)
    const after = farmFigures(input(next), idleTiles(before))
    const slot = byId(after).get('101')!
    expect(figureMoves(before, after, 'walk')).toEqual([{ id: '101', kind: 'walk', to: slot.tile, facing: 'back' }])
  })

  it('runs a recalled Uma home, walks a newcomer in from the Gate and runs a leaver out of it', () => {
    const at = startLoopJob(save, { outfitId: '101', place: 'forest', slot: 0, request: forage(1) }, AT)
    const working = farmFigures(input(at), idleTiles(before))
    const home = farmFigures(input(save), idleTiles(working))
    expect(figureMoves(working, home, 'walk')).toEqual([{ id: '101', kind: 'run', to: byId(home).get('101')!.tile, facing: 'front' }])
    const joined = { ...save, roster: { ...save.roster, 707: newRosterUma(1) }, dorm: { ...save.dorm, home: [...save.dorm.home, '707'] } }
    const arrived = farmFigures(input(joined), idleTiles(before))
    expect(figureMoves(before, arrived, 'walk')).toEqual([{ id: '707', kind: 'arrive', to: byId(arrived).get('707')!.tile, facing: 'front' }])
    expect(figureMoves(arrived, before, 'walk')).toEqual([{ id: '707', kind: 'leave' }])
    expect(figureMoves(arrived, before, 'place')).toEqual([{ id: '707', kind: 'remove' }])
  })
})
