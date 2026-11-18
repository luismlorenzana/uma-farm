// The goods as rendered: gold beside the date, opening the bin; a crate picked in the Warehouse's pick mode and shipped
// for one action, and Ship all from a good's sheet; Take back in the bin's sheet; the night paying it into the morning;
// and the shop, in town, buying with gold. Master data and the server are stubs; the story pack is the stand-in.
import 'fake-indexeddb/auto'
import { farmDay, newSave, shopLines, tileAt, type SaveV4, type ShopLine } from '@farm/domain'
import { KitStage } from '@luismlorenzana/uma-kit/ui'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ stats: new Map(), birthdays: new Map() })), setMasterLens: vi.fn() }))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: { name: 'Tester' } }),
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { useGame, useLoopSave, resetGame } = await import('../save/game')
const { FarmBar } = await import('../shell/Bars')
const { default: LoopSheets } = await import('./LoopSheets')
const { default: WarehousePage } = await import('./WarehousePage')
const { ShopList } = await import('./GoodsSheets')
const { TilePanel } = await import('./FarmPanels')
const { buyLine, endTheDay } = await import('./actions')
const { storyReady } = await import('../story/story')
// The night reads the story pack: the stand-in, loaded once.
await storyReady()

const AT = '2026-11-09T10:00:00.000Z'
const SUMMER_3 = farmDay({ year: 1, season: 'summer', day: 3 })
/** Summer 3 with salmon at ★1 and ★2, and Pine Logs. */
function stocked(): SaveV4 {
  const save = newSave('u1', AT)
  return { ...save, calendar: { day: SUMMER_3 }, items: { ...save.items, salmon: [2, 2, 0, 0, 0], 'pine-log': [3, 0, 0, 0, 0] } }
}
const save = () => useGame.getState().save as SaveV4

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
}
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const click = async (selector: string) => {
  const el = $(selector)
  if (!el) throw new Error(`No ${selector}`)
  await act(async () => el.click())
  await settle()
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-09T20:00:00.000Z'))
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('gold in the bar', () => {
  it('shows the farm\'s gold beside the date, and opens the bin', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<KitStage layout="landscape"><FarmBar /></KitStage>)
    const chip = host.querySelector('a[aria-label="Gold: 500g. The bin"]')
    expect(chip?.getAttribute('href')).toBe('/?sheet=bin')
    const labels = [...host.querySelectorAll('header a')].map((a) => a.getAttribute('aria-label') ?? '')
    expect(labels.findIndex((l) => l.startsWith('Calendar'))).toBe(labels.findIndex((l) => l.startsWith('Gold')) - 1)
  })
})

describe('shipping', () => {
  it('saves improved seed at the Warehouse, then plants and harvests G2 from the tile panel', async () => {
    const fresh = newSave('u1', AT)
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...fresh, crops: { carrot: 3 }, items: { ...fresh.items, carrot: [3, 0, 0, 0, 0] } } })
    await render(<WarehousePage />, '/warehouse')
    await click('[data-item="carrot"]')
    const improve = [...document.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === 'Improve to G2 seed · 1')
    expect(improve?.disabled).toBe(false)
    await act(async () => improve!.click())
    await settle()
    expect(save().items).toMatchObject({ carrot: [2, 0, 0, 0, 0], 'seed-carrot-grade-2-own': [1, 0, 0, 0, 0] })
    expect(save().today.actions).toBe(1)
    expect($('[data-crop-discovery="2"]')?.textContent).toBe('G2 · Undiscovered')
    function Tile() {
      const active = useLoopSave()
      return active ? <TilePanel save={active} index={0} /> : null
    }
    const tileClick = async (selector: string) => {
      await vi.waitFor(() => expect($(selector)).toMatchObject({ disabled: false }))
      await click(selector)
    }
    await render(<Tile />, '/field')
    await tileClick('[data-action="till"]')
    await tileClick('[data-seed="seed-carrot-grade-2-own"] [data-action="plant"]')
    expect(tileAt(save(), 0)).toMatchObject({ crop: 'carrot', grade: 2 })
    for (let day = 1; day <= 4; day++) {
      await tileClick('[data-action="water"]')
      await act(async () => { expect(await endTheDay(day)).toBe(true) })
    }
    expect($('[data-action="harvest"]')?.textContent).toContain('Harvest G2')
    await tileClick('[data-action="harvest"]')
    expect($('[data-note]')?.textContent).toContain('+1 Carrot G2')
    await render(<WarehousePage />, '/warehouse')
    expect($('[data-crop-discovery="2"]')?.textContent).toBe('G2 · Discovered')
  })

  it('picks a crate in pick mode, ships it for one action, takes a line back in the bin, and the night pays the rest into the morning', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    expect($('[data-pick-bar]')?.textContent).toContain('Tap a star to put one in the crate.')
    expect($('[data-shelf-rows]')?.getAttribute('data-shelf-rows')).toBe('woods')
    expect(($('[data-action="ship-crate"]') as HTMLButtonElement).disabled).toBe(true)
    await click('[data-shelf="fish"]')
    await click('[data-pick="salmon@1"]')
    await click('[data-pick="salmon@1"]')
    await click('[data-pick="salmon@2"]')
    // The crate is picked, not shipped: nothing moves until Ship.
    expect($('[data-crate]')?.getAttribute('data-crate')).toBe('3')
    expect($('[data-pick-bar]')?.textContent).toContain('Crate: 3 · about 425g')
    expect(($('[data-pick="salmon@1"]') as HTMLButtonElement).disabled).toBe(true)
    expect(save().bin).toEqual({})
    expect(save().today.actions).toBe(0)
    await click('[data-action="ship-crate"]')
    expect(save().bin).toEqual({ salmon: [2, 1, 0, 0, 0] })
    expect(save().items.salmon).toEqual([0, 1, 0, 0, 0])
    expect(save().today.actions).toBe(1)
    expect(save().account.updatedAt).toBe('2026-11-09T20:00:00.000Z')
    // Then back to the bin.
    for (let i = 0; i < 20 && path !== '/?sheet=bin'; i++) await settle()
    expect(path).toBe('/?sheet=bin')

    await render(<LoopSheets sheet="bin" />, '/?sheet=bin')
    expect($('[data-estimate]')?.textContent).toBe('About 425g tonight')
    expect([...document.body.querySelectorAll('[data-bin-line]')].map((li) => li.getAttribute('data-bin-line'))).toEqual(['salmon@1', 'salmon@2'])
    expect($('[data-bin-line="salmon@1"]')?.textContent).toContain('Salmon ★1 × 2260gIn demand')
    // Taking back is free.
    await click('[data-bin-line="salmon@1"] [data-action="take-back"]')
    expect(save().bin).toEqual({ salmon: [0, 1, 0, 0, 0] })
    expect(save().items.salmon).toEqual([2, 1, 0, 0, 0])
    expect(save().today.actions).toBe(1)
    expect($('[data-estimate]')?.textContent).toBe('About 165g tonight')
    await click('[data-action="ship"]')
    expect(path).toBe('/warehouse?pick=bin')

    expect(await endTheDay(SUMMER_3)).toBe(true)
    // The bin's 165g, less the farmer's takeout (30g).
    expect(save()).toMatchObject({ gold: 635, bin: {}, diary: { shipped: { salmon: 1 } }, farm: { counts: { 'gold-shipped': 165 } } })
    expect(save().summary!.bin).toEqual([{ kind: 'sold', id: 'salmon', stars: 2, count: 1, gold: 165, demand: true }])
    await render(<KitStage layout="landscape"><FarmBar /></KitStage>)
    expect(host.querySelector('a[aria-label="Gold: 635g. The bin"]')).not.toBeNull()
  })

  it('puts a good\'s every star in with All, and ships all of one from its sheet, one action each', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    await click('[data-shelf="fish"]')
    await click('[data-item="salmon"] [data-action="pick-all"]')
    await click('[data-action="ship-crate"]')
    expect(save().bin).toEqual({ salmon: [2, 2, 0, 0, 0] })
    expect(save().items.salmon).toBeUndefined()

    await render(<WarehousePage />, '/warehouse')
    await click('[data-shelf="woods"]')
    await click('[data-item="pine-log"]')
    expect($('[data-good="pine-log"]')?.textContent).toContain('Woods · G1 · raw')
    expect($('[data-good="pine-log"]')?.textContent).toContain('Refines into Pine Plank')
    expect($('[data-action="ship-all"]')?.textContent).toContain('1 action')
    await click('[data-action="ship-all"]')
    expect(save().bin['pine-log']).toEqual([3, 0, 0, 0, 0])
    expect(save().items['pine-log']).toBeUndefined()
    expect(save().today.actions).toBe(2)
  })

  it('won\'t ship once the day\'s actions are spent', async () => {
    const spent = stocked()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...spent, today: { ...spent.today, actions: 10 } } })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    await click('[data-shelf="fish"]')
    await click('[data-pick="salmon@1"]')
    expect(($('[data-action="ship-crate"]') as HTMLButtonElement).disabled).toBe(true)
    expect(save().bin).toEqual({})
  })

  it('shows the seeds, and no way to ship them', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: newSave('u1', AT) })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    await click('[data-shelf="seeds"]')
    expect($('[data-item="seed-carrot"]')?.textContent).toContain('Carrot seeds')
    expect($('[data-pick^="seed-carrot"]') ?? $('[data-item="seed-carrot"] [data-action="pick-all"]')).toBeNull()
  })
})

describe('the shop', () => {
  /** Spring 1, gone into town. */
  const SPRING = (): SaveV4 => {
    const save = newSave('u1', AT)
    return { ...save, today: { ...save.today, town: true } }
  }

  it('is in town: one action goes in, and it stays open for the day', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: newSave('u1', AT) })
    await render(<LoopSheets sheet="shop" />, '/?sheet=shop')
    expect($('[data-row]')).toBeNull()
    expect($('[data-into-town]')?.textContent).toContain('The shop is in town.')
    await click('[data-action="into-town"]')
    expect(save().today).toMatchObject({ town: true, actions: 1 })
    expect(document.body.querySelectorAll('[data-row]').length).toBeGreaterThan(0)
  })

  it('sells the season\'s seeds, a shut tier showing its Farm Rank', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: SPRING() })
    await render(<LoopSheets sheet="shop" />, '/?sheet=shop')
    expect($('[data-shop-empty]')).toBeNull()
    expect([...document.body.querySelectorAll('[data-row]')].map((b) => b.getAttribute('data-row'))).toEqual([
      'seed-carrot', 'seed-potato', 'seed-mint', 'seed-onion', 'seed-cabbage', 'seed-asparagus',
      'seed-radish', 'seed-lettuce', 'seed-green-peas', 'seed-strawberry', 'seed-raspberry', 'seed-plum',
    ])
    expect(($('[data-row="seed-onion"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-row="seed-onion"]')?.textContent).toContain('From Farm Rank 2')
    expect($('[data-row="seed-asparagus"]')?.textContent).toContain('From Farm Rank 4')
    expect(($('[data-row="seed-potato"]') as HTMLButtonElement).disabled).toBe(false)
  })

  it('buys a line with gold and refuses short gold', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: SPRING() })
    await render(<ShopList save={save()} lines={shopLines(save())} />)
    await click('[data-row="seed-carrot"]')
    const buy = () => [...document.body.querySelectorAll('[data-kit="buy-sheet"]')].at(-1)!.closest('[role="dialog"]')!.querySelectorAll('button')
    const chip = (n: number) => [...buy()].find((b) => b.textContent === `×${n}`)!
    await act(async () => chip(25).click())
    const buyButton = () => [...buy()].find((b) => b.textContent?.startsWith('Buy'))!
    expect(buyButton().textContent).toBe('Buy 25 ·g500')
    await act(async () => buyButton().click())
    await settle()
    expect(save().gold).toBe(0)
    expect(save().items['seed-carrot']).toEqual([34, 0, 0, 0, 0])
  })

  it('won\'t buy last season\'s seeds from a sheet left open', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    const line: ShopLine = { id: 'seed-carrot', price: 20, opens: { by: 'start' } }
    await expect(buyLine(line, 1)).rejects.toThrow('Not in the shop this season.')
    expect(save().gold).toBe(500)
  })
})
