// The farm map as played: a tile's panel (`?tile=<n>`) clearing, tilling, planting and watering, one action each, and a
// ripe tile harvested; the woods' edge foraging and chopping, the pond's edge fishing, a built station starting its one
// load; the actions chip counting down; and every button greyed once the day's ten are spent. The story pack is the
// stand-in, master data the album fixture; the server is a stub. Invented data only.
import 'fake-indexeddb/auto'
import { bareTile, isOvergrown, newSave, STAND_IN_FILES, storyPackFrom, type SaveV4, type StoryPack, type Tile } from '@farm/domain'
import { KitStage } from '@luismlorenzana/uma-kit/ui'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../story/story', async (importOriginal) => ({
  ...await importOriginal<typeof import('../story/story')>(),
  storyReady: async () => fixture.pack!, useStory: () => fixture.pack, storyPack: () => fixture.pack, castIds: () => fixture.pack!.cast.umas.map((u) => u.characterId),
}))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined,
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { FarmBar } = await import('../shell/Bars')
const { default: FarmRoute } = await import('./FarmMap')
const { tileLabel, tileView } = await import('./farm-view')

fixture.view = (await albumFixture()).view
fixture.pack = storyPackFrom(STAND_IN_FILES)

const AT = '2026-11-09T10:00:00.000Z'
const save = (): SaveV4 => useGame.getState().save as SaveV4
/** Day 1 with the farmer named and the opening read: the cleared patch, 9 Carrot seeds, 500g. */
function farm(): SaveV4 {
  const base = newSave('u1', AT)
  return { ...base, farmer: { name: 'Robin' }, diary: { ...base.diary, read: ['scene:1:open'] } }
}
/** A save with one tile set by hand. */
const withTile = (s: SaveV4, index: number, tile: Tile): SaveV4 => ({ ...s, fields: { tiles: s.fields.tiles.map((t, i) => (i === index ? tile : t)) } })

let host: HTMLDivElement
let root: Root
let path = ''
function Where() {
  const location = useLocation()
  path = `${location.pathname}${location.search}`
  return null
}
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={<>{node}<Where /></>} /></Routes></MemoryRouter>))
  await settle()
}
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 100 && !ok(); i++) await settle()
  expect(ok()).toBe(true)
}
/** The panel's note, once the action's promise has said it. */
const note = async (): Promise<string> => {
  await until(() => $('[data-note]') !== null)
  return $('[data-note]')!.textContent ?? ''
}
const click = async (selector: string) => {
  const el = $(selector)
  if (!el) throw new Error(`No ${selector}`)
  await act(async () => el.click())
  await settle()
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  // jsdom doesn't scroll: the map scrolls a tile into view beside its panel.
  Element.prototype.scrollTo = () => undefined
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('a tile', () => {
  it('draws the field, 40 tiles, each a link to its panel', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FarmRoute />)
    expect($$('[data-tile]')).toHaveLength(40)
    expect($('[data-tile="0"]')?.getAttribute('href')).toBe('/?tile=0')
    expect($('[data-tile="0"]')?.getAttribute('aria-label')).toBe('Row 1, tile 1: Cleared ground')
    expect($('[data-place="forest"]')?.getAttribute('href')).toBe('/?peek=forest')
    expect($('[data-place="fishery"]')?.getAttribute('href')).toBe('/?peek=fishery')
    expect($('[data-place="road"]')?.getAttribute('href')).toBe('/town')
  })

  it('is cleared, tilled, planted and watered, one action each, and the chip counts them down', async () => {
    const start = farm()
    const rough = start.fields.tiles.findIndex((t) => isOvergrown(t.ground))
    useGame.setState({ uid: 'u1', status: 'ready', save: start })
    await render(<><KitStage layout="landscape"><FarmBar /></KitStage><FarmRoute /></>, `/?tile=${rough}`)
    expect($(`[data-tile-sheet="${rough}"]`)).not.toBeNull()
    expect($('[data-left]')?.textContent).toBe('10 actions left of 10')
    await click('[data-action="clear"]')
    await until(() => save().fields.tiles[rough]!.ground === 'clear')
    expect(await note()).toMatch(/^Cleared/)
    await click('[data-action="till"]')
    await until(() => save().fields.tiles[rough]!.ground === 'tilled')
    expect($('[data-tile-line]')?.textContent).toBe('Plant a seed, then water it.')
    expect($('[data-seed="seed-carrot"]')?.textContent).toContain('4 watered nights to ripe')
    await click('[data-seed="seed-carrot"] [data-action="plant"]')
    await until(() => save().fields.tiles[rough]!.crop === 'carrot')
    expect(save().items['seed-carrot']).toEqual([8, 0, 0, 0, 0])
    expect($('[data-tile-line]')?.textContent).toBe('0 of 4 nights · dry: water it to grow tonight')
    await click('[data-action="water"]')
    await until(() => save().fields.tiles[rough]!.watered)
    expect($('[data-tile-line]')?.textContent).toBe('0 of 4 nights · watered: it grows tonight')
    expect($('[data-action="water"]')).toBeNull()
    expect(save().today.actions).toBe(4)
    expect($('[data-bar-chip="actions"]')?.getAttribute('aria-label')).toBe('Actions left: 6 of 10')
    expect($('[data-left]')?.textContent).toBe('6 actions left of 10')
  })

  it('harvests a ripe one into the Warehouse, leaving the soil tilled', async () => {
    const ripe = withTile(farm(), 0, { ...bareTile('tilled'), crop: 'carrot', growth: 4, ready: true })
    useGame.setState({ uid: 'u1', status: 'ready', save: ripe })
    await render(<FarmRoute />, '/?tile=0')
    expect($('[data-tile-line]')?.textContent).toBe('Ripe: harvest it.')
    await click('[data-action="harvest"]')
    await until(() => save().fields.tiles[0]!.crop === null)
    expect(save().fields.tiles[0]!.ground).toBe('tilled')
    expect(save().items.carrot?.[0]).toBe(1)
    expect(await note()).toMatch(/^\+1 Carrot/)
  })

  it('greys every button once the day\'s ten are spent', async () => {
    const spent = farm()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...spent, today: { ...spent.today, actions: 10 } } })
    await render(<FarmRoute />, '/?tile=0')
    expect(($('[data-action="till"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-left]')?.textContent).toBe('No actions left today.')
    await render(<FarmRoute />, '/?peek=forest')
    expect($$('[data-action="forage"]').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('reads in words: its place, what it is, and how far it has grown', () => {
    const s = withTile(farm(), 9, { ...bareTile('tilled'), crop: 'potato', growth: 2, watered: true })
    expect(tileView(s, 9)).toMatchObject({ title: 'Potato', where: 'Row 2, tile 2', line: '2 of 6 nights · watered: it grows tonight', actions: [] })
    expect(tileLabel(s, 9)).toBe('Row 2, tile 2: Potato, watered')
    const stump = withTile(farm(), 9, bareTile('stump'))
    expect(tileView(stump, 9)).toMatchObject({ title: 'A stump', line: 'Clear it to till it. It leaves a Pine Log.', actions: [{ kind: 'clear', leaves: 'pine-log' }] })
  })
})

describe('the woods\' and the pond\'s edges', () => {
  it('forage and chop at the Woods, two goods each, and fish the Pond, one catch, straight into the Warehouse', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FarmRoute />, '/?peek=forest')
    expect($('[data-where="woods"] [data-action="forage"]')?.textContent).toBe('Forage · 1')
    // Deeper areas wait for the Farm Rank.
    expect($$('[data-gather="forest"] [data-where]').filter((li) => li.textContent?.includes('Opens at Farm Rank')).length).toBeGreaterThan(0)
    const held = () => Object.values(save().items).reduce((n, row) => n + row.reduce((a, b) => a + b, 0), 0)
    const before = held()
    await click('[data-where="woods"] [data-action="forage"]')
    await until(() => save().today.actions === 1)
    expect(held()).toBe(before + 2)
    expect(await note()).toMatch(/^Foraged · \+/)
    await click('[data-where="woods"] [data-action="chop"]')
    await until(() => save().today.actions === 2)
    expect(held()).toBe(before + 4)
    expect(save().farm.counts['logs-chopped']).toBe(2)
    await render(<FarmRoute />, '/?peek=fishery')
    await click('[data-where="pond"] [data-action="fish"]')
    await until(() => save().today.actions === 3)
    expect(held()).toBe(before + 5)
    expect(await note()).toMatch(/★1 · [\d.]+ cm, a record$/)
    expect(save().today.gathered).toEqual(['woods', 'pond'])
  })
})

describe('a station', () => {
  it('starts one load of up to eight for one action, ready tomorrow', async () => {
    const base = farm()
    const built: SaveV4 = { ...base, buildings: { ...base.buildings, sawmill: 1 }, items: { ...base.items, 'pine-log': [12, 0, 0, 0, 0] } }
    useGame.setState({ uid: 'u1', status: 'ready', save: built })
    await render(<FarmRoute />, '/?peek=sawmill')
    expect($('[data-option="pine-plank@1"]')?.textContent).toContain('From Pine Log · 12 held')
    await click('[data-option="pine-plank@1"] [data-action="load"]')
    await until(() => save().loads.sawmill !== undefined)
    expect(save().loads.sawmill).toEqual({ item: 'pine-plank@1', count: 8 })
    expect(save().items['pine-log']).toEqual([4, 0, 0, 0, 0])
    expect(save().today.actions).toBe(1)
    expect($('[data-load="pine-plank@1"]')?.textContent).toContain('Ready tomorrow morning')
    expect($('[data-action="load"]')).toBeNull()
    expect(path).toBe('/?peek=sawmill')
  })
})
