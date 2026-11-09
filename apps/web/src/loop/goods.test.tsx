// The goods as rendered (F19 decisions 4 and 7–10): gold beside the date, opening the bin; shipping from the Warehouse's
// pick mode and from a good's sheet; Ship all; Take back in the bin's sheet; the night paying it into the morning; and
// the shop's frame buying with gold. Master data and the server are stubs.
import 'fake-indexeddb/auto'
import { farmDay, newSave, type SaveV3, type ShopLine } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ roster: [] })), masterRoster: () => null }))
vi.mock('@luismlorenzana/uma-kit/auth', () => ({ useAuth: () => ({ user: { name: 'Tester' } }) }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { useGame, resetGame } = await import('../save/game')
const { FarmAccountBar } = await import('../shell/Bars')
const { default: LoopSheets } = await import('./LoopSheets')
const { default: WarehousePage } = await import('./WarehousePage')
const { ShopList } = await import('./GoodsSheets')
const { endTheDay } = await import('./actions')

const AT = '2026-11-09T10:00:00.000Z'
const SUMMER_3 = farmDay({ year: 1, season: 'summer', day: 3 })
/** Summer 3 with salmon at ★1 and ★2, and Pine Logs. */
function stocked(): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, calendar: { day: SUMMER_3 }, items: { ...save.items, salmon: [2, 2, 0, 0, 0], 'pine-log': [3, 0, 0, 0, 0] } }
}
const save = () => useGame.getState().save as SaveV3

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

describe('gold in the account bar (decision 10)', () => {
  it('shows the farm\'s gold beside the date, and opens the bin', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<FarmAccountBar />)
    const chip = host.querySelector('a[aria-label="Gold: 500g. The bin"]')
    expect(chip?.getAttribute('href')).toBe('/?sheet=bin')
    const labels = [...host.querySelectorAll('header a')].map((a) => a.getAttribute('aria-label') ?? '')
    expect(labels.findIndex((l) => l.startsWith('Calendar'))).toBe(labels.findIndex((l) => l.startsWith('Gold')) - 1)
  })
})

describe('shipping (decisions 4, 8 and 9)', () => {
  it('ships one a tap in pick mode, takes a line back in the bin, and the night pays the rest into the morning', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    expect($('[data-pick-bar]')?.textContent).toContain('Tap a star to ship one.')
    expect($('[data-shelf-rows]')?.getAttribute('data-shelf-rows')).toBe('woods')
    await click('[data-shelf="fish"]')
    await click('[data-ship="salmon@1"]')
    await click('[data-ship="salmon@1"]')
    await click('[data-ship="salmon@2"]')
    expect(save().bin).toEqual({ salmon: [2, 1, 0, 0, 0] })
    expect(save().items.salmon).toEqual([0, 1, 0, 0, 0])
    expect(save().account.updatedAt).toBe('2026-11-09T20:00:00.000Z')
    expect($('[data-pick-bar] [data-estimate]')?.textContent).toBe('In the bin: about 425g tonight')
    expect(($('[data-ship="salmon@1"]') as HTMLButtonElement).disabled).toBe(true)

    await render(<LoopSheets sheet="bin" />, '/?sheet=bin')
    expect($('[data-estimate]')?.textContent).toBe('About 425g tonight')
    expect([...document.body.querySelectorAll('[data-bin-line]')].map((li) => li.getAttribute('data-bin-line'))).toEqual(['salmon@1', 'salmon@2'])
    expect($('[data-bin-line="salmon@1"]')?.textContent).toContain('Salmon ★1 × 2260gIn demand')
    await click('[data-bin-line="salmon@1"] [data-action="take-back"]')
    expect(save().bin).toEqual({ salmon: [0, 1, 0, 0, 0] })
    expect(save().items.salmon).toEqual([2, 1, 0, 0, 0])
    expect($('[data-estimate]')?.textContent).toBe('About 165g tonight')
    await click('[data-action="ship"]')
    expect(path).toBe('/warehouse?pick=bin')

    expect(await endTheDay(SUMMER_3)).toBe(true)
    expect(save()).toMatchObject({ gold: 665, bin: {}, diary: { shipped: { salmon: 1 } }, farm: { counts: { 'gold-shipped': 165 } } })
    expect(save().summary!.bin).toEqual([{ kind: 'sold', id: 'salmon', stars: 2, count: 1, gold: 165, demand: true }])
    await render(<FarmAccountBar />)
    expect(host.querySelector('a[aria-label="Gold: 665g. The bin"]')).not.toBeNull()
  })

  it('ships every star with Ship all, and from a good\'s sheet', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    await click('[data-shelf="fish"]')
    await click('[data-item="salmon"] [data-action="ship-all"]')
    expect(save().bin).toEqual({ salmon: [2, 2, 0, 0, 0] })
    expect(save().items.salmon).toBeUndefined()

    await render(<WarehousePage />, '/warehouse')
    await click('[data-shelf="woods"]')
    await click('[data-item="pine-log"]')
    expect($('[data-good="pine-log"]')?.textContent).toContain('Woods · G1 · raw')
    expect($('[data-good="pine-log"]')?.textContent).toContain('Refines into Pine Plank')
    await click('[data-good="pine-log"] [data-ship="pine-log@1"]')
    expect(save().bin['pine-log']).toEqual([1, 0, 0, 0, 0])
    expect(save().items['pine-log']).toEqual([2, 0, 0, 0, 0])
  })

  it('shows the seeds, and no way to ship them', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: newSave('u1', AT) })
    await render(<WarehousePage />, '/warehouse?pick=bin')
    await click('[data-shelf="seeds"]')
    expect($('[data-item="seed-carrot"]')?.textContent).toContain('Carrot seeds')
    expect($('[data-ship^="seed-carrot"]') ?? $('[data-item="seed-carrot"] [data-action="ship-all"]')).toBeNull()
  })
})

describe('the shop (decision 7)', () => {
  const CARROT: ShopLine = { id: 'seed-carrot', price: 20, opens: { by: 'start' } }
  const ONION: ShopLine = { id: 'seed-onion', price: 30, opens: { by: 'farm-rank', rank: 2 } }

  it('says when there\'s nothing for sale (until F20)', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<LoopSheets sheet="shop" />, '/?sheet=shop')
    expect($('[data-shop-empty]')?.textContent).toBe('Nothing for sale yet.')
  })

  it('buys a line with gold, refuses short gold, and shows a shut line\'s gate', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: stocked() })
    await render(<ShopList save={save()} lines={[CARROT, ONION]} />)
    expect(($('[data-row="seed-onion"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-row="seed-onion"]')?.textContent).toContain('From Farm Rank 2')
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
})
