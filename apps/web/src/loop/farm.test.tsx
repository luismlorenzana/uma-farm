// The farm map as played: the field's sign with its counts, and the field's own screen (`/field`): a plot a page, a
// tile's panel (`?tile=<n>`) clearing, tilling, planting and watering, one action each, and a ripe tile harvested; plot 2
// locked until Farm Rank 3, then cleared; a swipe and the dots between pages; a row's farmhands; the woods' edge foraging and chopping, the pond's edge fishing, an area thin after four hauls; a built station starting its
// loads, a load a level, and buying its next level; the actions chip counting down; and every button greyed once the day's ten are spent. The story pack is the
// stand-in, master data the album fixture; the server is a stub. Invented data only.
import 'fake-indexeddb/auto'
import { fieldTiles, bareTile, isOvergrown, newLove, newRosterUma, newSave, STAND_IN_FILES, storyPackFrom, wildPlot, type SaveV4, type StoryPack, type Tile } from '@farm/domain'
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
const { default: FarmRoute } = await import('./FarmMap')
const { default: FieldRoute } = await import('./FieldScreen')
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
const withTile = (s: SaveV4, index: number, tile: Tile): SaveV4 => ({ ...s, fields: { plots: [{ tiles: fieldTiles(s).map((t, i) => (i === index ? tile : t)) }] } })

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

describe('the field\'s sign on the farm map', () => {
  it('draws the field as a sign a lot\'s size, with its counts, a tap to the field\'s screen; no tiles on the map', async () => {
    let s = withTile(farm(), 0, { ...bareTile('tilled'), crop: 'carrot', growth: 4, ready: true })
    s = withTile(s, 1, { ...bareTile('tilled'), crop: 'carrot' })
    s = withTile(s, 2, { ...bareTile('tilled'), crop: 'carrot' })
    s = withTile(s, 3, bareTile('tilled'))
    useGame.setState({ uid: 'u1', status: 'ready', save: s })
    await render(<FarmRoute />)
    expect($$('[data-tile]')).toHaveLength(0)
    const sign = $('[data-field-sign]')!
    expect(sign.getAttribute('href')).toBe('/field')
    expect(sign.getAttribute('aria-label')).toBe('Fields, 2 to water, 1 ripe, 1 to plant')
    expect($$('[data-field-counts] span').map((e) => e.textContent)).toEqual(['2 to water', '1 ripe', '1 to plant'])
    expect($('[data-field-sign-art]')).not.toBeNull()
    expect($('[data-place="forest"]')?.getAttribute('href')).toBe('/?peek=forest')
    expect($('[data-place="fishery"]')?.getAttribute('href')).toBe('/?peek=fishery')
    expect($('[data-place="road"]')?.getAttribute('href')).toBe('/town')
  })

  it('sends a tile\'s older link to the field\'s screen', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<Routes><Route path="/" element={<FarmRoute />} /><Route path="/field" element={<FieldRoute />} /></Routes>, '/?tile=4')
    expect(path).toBe('/field?tile=4')
    expect($('[data-tile-sheet="4"]')).not.toBeNull()
  })
})

describe('the field\'s screen', () => {
  it('draws a plot a page, 40 tiles, each a link to its panel, the page dots with the plots past 1 locked by their Farm Rank', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FieldRoute />, '/field')
    expect($('[data-field-screen]')?.dataset.plotPage).toBe('1')
    expect($$('[data-tile]')).toHaveLength(40)
    expect($('[data-tile="0"]')?.getAttribute('href')).toBe('/field?tile=0')
    expect($('[data-tile="0"]')?.getAttribute('aria-label')).toBe('Row 1, tile 1: Cleared ground')
    expect($$('[data-row-tab]')).toHaveLength(5)
    expect($$('[data-page-dot]').map((d) => d.getAttribute('aria-label'))).toEqual(['Plot 1', ...[3, 4, 5, 6, 7, 8, 9].map((rank, i) => `Plot ${i + 2}, locked: Opens at Farm Rank ${rank}`)])
    expect($('[data-plot-counts]')?.textContent).toBe('40 to clear or till')
    expect($('[data-action="prev-plot"]')).toBeNull()
    expect($('[data-action="next-plot"]')?.getAttribute('aria-label')).toBe('Plot 2, locked')
  })

  it('clears, tills, plants and waters a tile, one action each, and its own strip counts them down', async () => {
    const start = farm()
    const rough = fieldTiles(start).findIndex((t) => isOvergrown(t.ground))
    useGame.setState({ uid: 'u1', status: 'ready', save: start })
    await render(<KitStage layout="landscape"><FieldRoute /></KitStage>, `/field?tile=${rough}`)
    expect($(`[data-tile-sheet="${rough}"]`)).not.toBeNull()
    expect($('[data-left]')?.textContent).toBe('10 actions left of 10')
    await click('[data-action="clear"]')
    await until(() => fieldTiles(save())[rough]!.ground === 'clear')
    expect(await note()).toMatch(/^Cleared/)
    await click('[data-action="till"]')
    await until(() => fieldTiles(save())[rough]!.ground === 'tilled')
    expect($('[data-tile-line]')?.textContent).toBe('Plant a seed, then water it.')
    expect($('[data-seed="seed-carrot"]')?.textContent).toContain('4 watered nights to ripe')
    await click('[data-seed="seed-carrot"] [data-action="plant"]')
    await until(() => fieldTiles(save())[rough]!.crop === 'carrot')
    expect(save().items['seed-carrot']).toEqual([8, 0, 0, 0, 0])
    expect($('[data-tile-line]')?.textContent).toBe('0 of 4 nights · dry: water it to grow tonight')
    await click('[data-action="water"]')
    await until(() => fieldTiles(save())[rough]!.watered)
    expect($('[data-tile-line]')?.textContent).toBe('0 of 4 nights · watered: it grows tonight')
    expect($('[data-action="water"]')).toBeNull()
    expect(save().today.actions).toBe(4)
    expect($('[data-bar-chip="actions"]')?.getAttribute('aria-label')).toBe('Actions left: 6 of 10. Morning')
    expect($('[data-left]')?.textContent).toBe('6 actions left of 10')
    // Closing the panel leaves the page as it was.
    await click('[data-action="close-panel"]')
    expect(path).toBe('/field')
  })

  it('harvests a ripe one into the Warehouse, leaving the soil tilled', async () => {
    const ripe = withTile(farm(), 0, { ...bareTile('tilled'), crop: 'carrot', growth: 4, ready: true })
    useGame.setState({ uid: 'u1', status: 'ready', save: ripe })
    await render(<FieldRoute />, '/field?tile=0')
    expect($('[data-plot-counts]')?.textContent).toBe('1 ripe')
    expect($('[data-tile-line]')?.textContent).toBe('Ripe: harvest it.')
    await click('[data-action="harvest"]')
    await until(() => fieldTiles(save())[0]!.crop === null)
    expect(fieldTiles(save())[0]!.ground).toBe('tilled')
    expect(save().items.carrot?.[0]).toBe(1)
    expect(await note()).toMatch(/^\+1 Carrot/)
  })

  it('keeps a harvested tree on its tile until the player confirms removal', async () => {
    const ripe = withTile(farm(), 0, { ...bareTile('tilled'), crop: 'apple', growth: 6, ready: true, fruitSeason: 2 })
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...ripe, calendar: { ...ripe.calendar, day: 49 } } })
    await render(<FieldRoute />, '/field?tile=0')
    await click('[data-action="harvest"]')
    await until(() => !fieldTiles(save())[0]!.ready)
    expect(save().items.apple?.reduce((a, b) => a + b)).toBe(3)
    expect(fieldTiles(save())[0]!.crop).toBe('apple')
    expect($('[data-action="water"]')).toBeNull()
    await click('[data-action="remove-orchard"]')
    expect(save().today.actions).toBe(1)
    await click('[data-action="confirm-remove-orchard"]')
    await until(() => fieldTiles(save())[0]!.crop === null)
    expect(fieldTiles(save())[0]).toEqual(bareTile('tilled'))
    expect(save().today.actions).toBe(2)
  })

  it('saves an Autumn orchard plan without replacing the Spring rotation', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FieldRoute />, '/field?row=1')
    const select = async (index: number, value: string) => {
      const el = $$('[data-row-panel] select')[index] as HTMLSelectElement
      await act(async () => {
        el.value = value
        el.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await settle()
    }
    await select(1, 'carrot')
    await until(() => save().farm.fieldPlans?.['0:0:spring']?.crop === 'carrot')
    await select(0, 'autumn')
    expect($('[data-row-panel] option[value="carrot"]')).toBeNull()
    await select(1, 'apple')
    await until(() => save().farm.fieldPlans?.['0:0:autumn']?.crop === 'apple')
    await select(2, '2')
    await until(() => {
      const plan = save().farm.fieldPlans?.['0:0:autumn']
      return plan?.crop === 'apple' && plan.grade === 2
    })
    expect(save().farm.fieldPlans?.['0:0:spring']).toEqual({ crop: 'carrot', grade: 1, harvestNext: false })
    expect(save().today.actions).toBe(0)
  })

  it('greys every button once the day\'s ten are spent', async () => {
    const spent = farm()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...spent, today: { ...spent.today, actions: 10 } } })
    await render(<FieldRoute />, '/field?tile=0')
    expect(($('[data-action="till"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-left]')?.textContent).toBe('No actions left today.')
    await render(<FarmRoute />, '/?peek=forest')
    expect($$('[data-action="forage"]').every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
  })

  it('pages to plot 2, locked until Farm Rank 3, then cleared for 2,500g and an action, at once', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FieldRoute />, '/field')
    await click('[data-action="next-plot"]')
    expect(path).toBe('/field?plot=2')
    expect($('[data-plot-locked="2"]')).not.toBeNull()
    expect($('[data-plot-lock]')?.textContent).toBe('Opens at Farm Rank 3')
    expect($('[data-action="clear-plot"]')).toBeNull()
    expect($$('[data-tile]')).toHaveLength(0)
    // At Farm Rank 3, with its gold, it can be cleared.
    const fr3 = farm()
    await act(async () => useGame.setState({ save: { ...fr3, gold: 3_000, farm: { ...fr3.farm, points: 250 } } }))
    await settle()
    expect($('[data-plot-lock]')?.textContent).toBe('Ready to clear')
    expect($('[data-action="clear-plot"]')?.textContent).toBe('Clear Plot 2 · 2,500g · 1 action')
    await click('[data-action="clear-plot"]')
    await until(() => save().fields.plots.length === 2)
    expect(save().gold).toBe(500)
    expect(save().today.actions).toBe(1)
    await until(() => $$('[data-tile]').length === 40)
    expect($('[data-tile="0"]')?.getAttribute('href')).toBe('/field?plot=2&tile=0')
    expect($('[data-plot-note]')?.textContent).toBe('Plot 2 is yours: clear and till its tiles.')
    // Its tiles are wild, and plot 1's are as they were.
    expect(save().fields.plots[1]!.tiles.every((t) => isOvergrown(t.ground))).toBe(true)
    expect(save().fields.plots[0]).toEqual(fr3.fields.plots[0])
    await click('[data-tile="0"]')
    expect($('[data-tile-where]')?.textContent).toBe('Plot 2 · Row 1, tile 1')
    await click('[data-action="clear"]')
    await until(() => save().fields.plots[1]!.tiles[0]!.ground === 'clear')
  })

  it('turns the page with a swipe across the plot, and with the dots', async () => {
    const fr3 = farm()
    const two = { ...fr3, fields: { plots: [fr3.fields.plots[0]!, wildPlot('u1', 1)] } }
    useGame.setState({ uid: 'u1', status: 'ready', save: two })
    await render(<FieldRoute />, '/field')
    const area = $('[data-plot-area]')!
    await act(async () => {
      area.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 400, clientY: 200 }))
      area.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 250, clientY: 210 }))
    })
    await settle()
    expect(path).toBe('/field?plot=2')
    expect($('[data-plot="2"]')).not.toBeNull()
    await click('[data-page-dot="1"]')
    expect(path).toBe('/field')
  })

  it('shows a row\'s farmhands on its tab, and the row\'s panel what each does there an action', async () => {
    const base = farm()
    const hand = { ...newRosterUma(1), farmhand: 1, tasks: [{ kind: 'water' as const, tiles: [0, 1, 2, 3, 4, 5, 6, 7] }], practice: { water: 150 } }
    const s: SaveV4 = { ...base, roster: { 101: hand }, love: { 101: newLove() } }
    useGame.setState({ uid: 'u1', status: 'ready', save: s })
    await render(<FieldRoute />, '/field')
    expect($('[data-row-tab="1"]')?.dataset.rowHands).toBe('1')
    expect($('[data-row-tab="1"] [data-row-trick]')).not.toBeNull()
    expect($('[data-row-tab="2"]')?.dataset.rowHands).toBeUndefined()
    await click('[data-row-tab="1"]')
    expect(path).toBe('/field?row=1')
    expect($('[data-row-sheet="1"]')).not.toBeNull()
    expect($('[data-row-hand="101"]')?.textContent).toContain('Watering 6 · the whole row in one action')
    await click('[data-row-tab="2"]')
    expect($('[data-row-none]')?.textContent).toBe('No farmhand works this row.')
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
    expect(save().loads.sawmill).toEqual([{ item: 'pine-plank@1', count: 8 }])
    expect(save().items['pine-log']).toEqual([4, 0, 0, 0, 0])
    expect(save().today.actions).toBe(1)
    expect($('[data-load="pine-plank@1"]')?.textContent).toContain('Ready tomorrow morning')
    expect($('[data-action="load"]')).toBeNull()
    expect(path).toBe('/?peek=sawmill')
  })

  it('takes a load a day a level, and buys its next level from its Farm Rank: gold now, the level tomorrow', async () => {
    const base = farm()
    const built: SaveV4 = {
      ...base, gold: 3_000, buildings: { ...base.buildings, mill: 2 }, items: { ...base.items, wheat: [20, 0, 0, 0, 0] }, farm: { ...base.farm, points: 250 },
    }
    useGame.setState({ uid: 'u1', status: 'ready', save: built })
    await render(<FarmRoute />, '/?peek=mill')
    expect($('[data-station-level]')?.textContent).toBe('Level 2')
    expect($('[data-loads]')?.textContent).toBe('0 of 2 loads today')
    await click('[data-option="wheat-flour@1"] [data-action="load"]')
    await until(() => save().loads.mill?.length === 1)
    expect($('[data-loads]')?.textContent).toBe('1 of 2 loads today')
    await until(() => $('[data-option="wheat-flour@1"] [data-action="load"]')?.hasAttribute('disabled') === false)
    await click('[data-option="wheat-flour@1"] [data-action="load"]')
    await until(() => save().loads.mill?.length === 2)
    expect($$('[data-load]')).toHaveLength(2)
    expect($('[data-action="load"]')).toBeNull()
    // Level 3 opens at Farm Rank 4: greyed with why.
    expect($('[data-next-level="3"]')?.textContent).toContain('Opens at Farm Rank 4')
    expect($('[data-action="upgrade"]')?.hasAttribute('disabled')).toBe(true)
    useGame.setState({ save: { ...save(), farm: { ...save().farm, points: 950 }, gold: 6_000 } })
    await settle()
    await click('[data-action="upgrade"]')
    await until(() => save().gold === 1_000)
    expect(save().farm.builds).toEqual(['mill'])
    expect(save().buildings.mill).toBe(2)
    expect($('[data-next-level="3"]')?.textContent).toContain('Ready tomorrow')
    expect($('[data-action="upgrade"]')).toBeNull()
  })
})

describe('thin and eased', () => {
  it('marks an area thin after its four full hauls today, and counts them down before', async () => {
    const base = farm()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...base, today: { ...base.today, hauls: { woods: 3 } } } })
    await render(<FarmRoute />, '/?peek=forest')
    expect($('[data-where="woods"] [data-thin]')?.textContent).toBe('1 full haul left')
    await click('[data-where="woods"] [data-action="forage"]')
    await until(() => save().today.hauls?.woods === 4)
    expect($('[data-where="woods"] [data-thin]')?.textContent).toBe('Thin · half hauls')
    expect($('[data-where="hills"] [data-thin]')).toBeNull()
  })
})
