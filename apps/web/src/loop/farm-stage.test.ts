// The stage Home's pure half: what a tap opens, the band Home opens on, the fade's markers, the seasons'
// grades and the ground under a finger. The design's build on the stand-in kit is the domain's test now, from the stage's
// three-free `/formats` entry (0.4.0). No WebGL: the stage itself needs a phone's canvas; the preview checks it. Invented
// saves only.
import { farmPlots, FARMHOUSE, newSave, newSaveV4, type SaveV3, type SaveV4 } from '@farm/domain'
import { project, validGrade, type FarmMarker, type PickHit, type View } from '@luismlorenzana/uma-stage'
import { describe, expect, it } from 'vitest'
import { bandCentre, fadeMarkers, groundTile, peekLink, rememberCentre, rememberedCentre, SEASON_GRADES, slotPlace, startPlot, tapTarget } from './farm-stage'

const AT = '2026-11-12T10:00:00.000Z'
const fresh = (): SaveV3 => newSave('u1', AT)
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
const M4 = { homestead: false }
const HOME = { homestead: true }
const marker = (kind: FarmMarker['kind'], id: string, x = 0, z = 0): PickHit => ({ ref: { kind: 'marker', marker: { kind, id, x, z } }, at: { x, y: 1, z }, depth: 1 })

describe('taps', () => {
  const plots = farmPlots(v4(3), HOME)
  const places = [
    { id: 'fields', to: '/?peek=fields' }, { id: 'mill', to: '/?peek=mill' }, { id: 'warehouse', to: '/warehouse' }, { id: 'gate', to: '/?peek=gate' },
    { id: 'house-1', to: '/?sheet=homestead&house=1' }, { id: 'house-4', to: '/?sheet=homestead&house=4' },
  ]
  it('opens a place by its marker, a slot\'s place, the Gate, a building, a prop\'s plot, a lot\'s sheet, nearest first', () => {
    expect(tapTarget([marker('place', 'mill')], null, plots, places)).toEqual({ id: 'mill', to: '/?peek=mill' })
    expect(tapTarget([marker('slot', 'fields-a')], null, plots, places)?.to).toBe('/?peek=fields')
    expect(tapTarget([marker('gate', 'gate')], null, plots, places)?.to).toBe('/?peek=gate')
    expect(tapTarget([{ ref: { kind: 'building', id: 'warehouse' }, at: { x: 4, y: 2, z: 21 }, depth: 2 }], null, plots, places)?.to).toBe('/warehouse')
    expect(tapTarget([{ ref: { kind: 'prop', name: 'crop-sprout', tile: { x: 0, z: 0 } }, at: { x: 0, y: 1, z: 0 }, depth: 1 }], null, plots, places)?.to).toBe('/?peek=fields')
    expect(tapTarget([marker('lot', 'house-4')], null, plots, places)?.to).toBe('/?sheet=homestead&house=4')
    // A figure and a path point open nothing themselves: what's under them does.
    expect(tapTarget([{ ref: { kind: 'figure', id: 'x' }, at: { x: 4, y: 1, z: 2 }, depth: 0.5 }, marker('place', 'mill')], null, plots, places)?.id).toBe('mill')
  })
  it('falls back to the plot of the ground under the finger, never the open ground', () => {
    expect(tapTarget([], { x: 4, z: 3 }, plots, places)?.id).toBe('mill')
    expect(tapTarget([], { x: 7, z: 25 }, plots, places)).toBeNull()
    expect(tapTarget([], { x: 4, z: 30 }, plots, places)?.id).toBe('house-1')
    expect(tapTarget([], null, plots, places)).toBeNull()
  })
  it('long-presses to a place\'s quick look, a house to its sheet', () => {
    expect(peekLink('warehouse', '/warehouse')).toBe('/?peek=warehouse')
    expect(peekLink('house-1', '/?sheet=homestead&house=1')).toBe('/?sheet=homestead&house=1')
    expect(slotPlace('fields-a')).toBe('fields')
    expect(slotPlace('mill-4')).toBe('mill')
  })
  it('finds the tile under a stage point, the camera\'s own projection reversed', () => {
    const view: View = { look: { x: 4.5, y: 1, z: 10 }, width: 390, height: 700, ratio: 3, scale: 1 }
    for (const [x, z] of [[0, 8], [4, 10], [8, 13]] as const) {
      const p = project(view, { x: x + 0.5, y: 1, z: z + 0.5 })
      expect(groundTile(view, p.x, p.y)).toEqual({ x, z })
    }
  })
})

describe('the camera, the fade and the light', () => {
  it('opens on the first Ready place\'s band, else the Fields\'', () => {
    const plots = farmPlots(fresh(), M4)
    expect(startPlot(plots, [{ id: 'fields' }, { id: 'warehouse' }])?.id).toBe('fields')
    expect(startPlot(plots, [{ id: 'fields' }, { id: 'fishery', ready: 'Ready' }, { id: 'forest', ready: 'Ready' }])?.id).toBe('forest')
    expect(bandCentre({ band: 2 }, 5)).toBe(13)
    rememberCentre(17.5)
    expect(rememberedCentre()).toBe(17.5)
    rememberCentre(null)
  })
  it('fades for nothing at rest, and for only the open place\'s slots', () => {
    const slot = (id: string): FarmMarker => ({ kind: 'slot', id, x: 0, z: 0 })
    expect(fadeMarkers(null)(slot('mill-1'))).toBe(false)
    expect(fadeMarkers('mill')(slot('mill-1'))).toBe(true)
    expect(fadeMarkers('mill')(slot('fields-a'))).toBe(false)
    expect(fadeMarkers('mill')({ kind: 'place', id: 'mill', x: 0, z: 0 })).toBe(false)
    expect(fadeMarkers('fields')(slot('fields-b'))).toBe(true)
  })
  it('grades the four seasons as valid light, each its own', () => {
    for (const grade of Object.values(SEASON_GRADES)) expect(validGrade(grade)).toBe(true)
    expect(new Set(Object.values(SEASON_GRADES).map((g) => g.background)).size).toBe(4)
    expect(SEASON_GRADES.winter.lamps).toBeGreaterThan(SEASON_GRADES.autumn.lamps)
  })
})
