// The Fields as rendered: the four block cards, Plant all and a plot's plant sheet, a tender's row,
// nights left and Ready, Harvest all and a single harvest into the Warehouse by stars, a locked block's Buy, the quick
// look with Harvest all on every block, the map's Collect all, and the view model behind them. Invented outfit ids;
// master data and the server are stubs.
import 'fake-indexeddb/auto'
import { FARM_RANK_POINTS, newRosterUma, newSave, type SaveV3 } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ roster: [], stats: new Map() })), masterRoster: () => null, useMaster: () => ({ status: 'loading' }) }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { useGame, resetGame } = await import('../save/game')
const { default: FieldsPage } = await import('./FieldsPage')
const { FieldsPeek, fieldsPips } = await import('./FieldsPeek')
const { collectFarm, endTheDay, tendBlock } = await import('./actions')
const { blockLine, fieldsView, nightsWords, plotKey, seedOptions } = await import('./fields-view')

const AT = '2026-11-09T10:00:00.000Z'
/** Day 1 with two Umas home and the 9 Carrot seeds. */
function farm(): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, roster: { 101: newRosterUma(1), 202: newRosterUma(1) }, dorm: { level: 1, home: ['101', '202'], swaps: [] } }
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
async function render(node: ReactNode, at = '/fields') {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={<>{node}<Where /></>} /></Routes></MemoryRouter>))
}
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const click = async (selector: string) => {
  const el = $(selector)
  if (!el) throw new Error(`No ${selector}`)
  await act(async () => el.click())
  await settle()
}
const states = (block = 'A') => $$(`[data-block="${block}"] [data-plot]`).map((b) => b.getAttribute('data-state'))

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

describe('the Fields\' page', () => {
  it('plants all, tends, grows to Ready over three nights, and harvests all into the Warehouse by stars', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FieldsPage />)
    expect($$('[data-block]').map((b) => b.getAttribute('data-block'))).toEqual(['A', 'B', 'C', 'D'])
    expect(states()).toEqual(Array(9).fill('empty'))
    expect($('[data-block="A"] [data-growth]')?.textContent).toBe('Untended · 1 a night')

    await click('[data-block="A"] [data-action="plant-all"]')
    expect(path).toBe('/fields?plant=A')
    expect($$('[data-seed]').map((b) => b.getAttribute('data-seed'))).toEqual(['carrot'])
    expect($('[data-seed="carrot"]')?.textContent).toContain('Carrot')
    expect($('[data-seed="carrot"]')?.textContent).toContain('× 9')
    await click('[data-seed="carrot"]')
    expect(states()).toEqual(Array(9).fill('growing'))
    expect(save().items['seed-carrot']).toBeUndefined()
    expect(save().farm.counts['plots-planted']).toBe(9)
    expect(save().account.updatedAt).toBe('2026-11-09T20:00:00.000Z')
    expect($('[data-block="A"] [data-plot="0"]')?.getAttribute('aria-label')).toBe('Plot 1, Carrot, Ready in 4 nights')

    await act(async () => void (await tendBlock('A', '101')))
    await render(<FieldsPage />)
    expect($('[data-block="A"] [data-tender]')?.getAttribute('data-tender')).toBe('101')
    expect($('[data-block="A"] [data-growth]')?.textContent).toBe('Tended · 1.25 a night')
    expect($('[data-block="A"] [data-plot="0"]')?.getAttribute('aria-label')).toBe('Plot 1, Carrot, Ready in 3 nights')

    for (const day of [1, 2, 3]) expect(await endTheDay(day)).toBe(true)
    await render(<FieldsPage />)
    expect(save().calendar.day).toBe(4)
    expect(states()).toEqual(Array(9).fill('ready'))
    expect(save().summary!.work).toEqual([{ kind: 'crops', block: 'A', plots: 9 }])
    expect($('[data-block="A"] [data-action="harvest-all"]')?.textContent).toBe('Harvest all · 9')

    await click('[data-block="A"] [data-plot="4"]')
    expect(save().fields.blocks[0]!.plots[4]!.crop).toBeNull()
    expect($('[data-fields-note]')?.textContent).toMatch(/^\+1 Carrot/)
    await click('[data-block="A"] [data-action="harvest-all"]')
    expect(states()).toEqual(Array(9).fill('empty'))
    const carrots = save().items.carrot!
    expect(carrots.reduce((a, b) => a + b, 0)).toBe(9)
    expect(carrots[0]! + carrots[1]!).toBe(9)
    expect(save().crops.carrot).toBe(9)
    expect(save().farm.counts['plots-harvested']).toBe(9)
    expect(save().roster['101']!.ranks.farming.challenge).toBe(9)
  })

  it('shows a growing plot, offers the shop with no seeds, and stops a tender', async () => {
    const base = farm()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...base, items: {} } })
    await render(<FieldsPage />)
    await click('[data-block="A"] [data-plot="2"]')
    expect(path).toBe('/fields?plant=A.2')
    expect($('[data-no-seeds]')?.textContent).toBe('No seeds for Spring.')
    await click('[data-action="shop"]')
    expect(path).toBe('/fields?sheet=shop')

    useGame.setState({ save: { ...base, items: { 'seed-carrot-own': [1, 0, 0, 0, 0], 'seed-carrot': [2, 0, 0, 0, 0], 'seed-tomato': [5, 0, 0, 0, 0] } } })
    await render(<FieldsPage />, '/fields?plant=A.2')
    expect($$('[data-seed]').map((b) => b.getAttribute('data-seed'))).toEqual(['seed-carrot-own', 'seed-carrot'])
    await click('[data-seed="seed-carrot-own"]')
    expect(save().fields.blocks[0]!.plots[2]).toMatchObject({ crop: 'carrot', own: true })
    await render(<FieldsPage />)
    await click('[data-block="A"] [data-plot="2"]')
    expect(path).toBe('/fields?plot=A.2')
    expect($('[data-plot-sheet="A.2"]')?.textContent).toContain('Ready in 4 nights')
    expect($('[data-plot-sheet="A.2"]')?.textContent).toContain('own seeds')
    expect($('[data-plot-sheet="A.2"]')?.textContent).toContain('Untended · 1 a night')

    await act(async () => void (await tendBlock('A', '202')))
    await render(<FieldsPage />)
    await click('[data-block="A"] [data-action="stop-tending"]')
    expect(save().fields.blocks[0]!.tender).toBeNull()
  })

  it('shows a locked block\'s Farm Rank, then buys it with gold', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FieldsPage />)
    expect($('[data-block="B"]')?.textContent).toContain('Opens at Farm Rank 2')
    expect(($('[data-block="B"] [data-action="buy-block"]') as HTMLButtonElement).disabled).toBe(true)
    const rank2 = { ...farm(), gold: 600, farm: { ...farm().farm, points: FARM_RANK_POINTS[1]! } }
    useGame.setState({ save: rank2 })
    await render(<FieldsPage />)
    expect($('[data-block="B"]')?.textContent).toContain('Need 200g more')
    useGame.setState({ save: { ...rank2, gold: 900 } })
    await render(<FieldsPage />)
    await click('[data-block="B"] [data-action="buy-block"]')
    expect(save().gold).toBe(100)
    expect(save().fields.blocks.map((b) => b.id)).toEqual(['A', 'B'])
    expect($('[data-fields-note]')?.textContent).toBe('Block B is yours')
    expect(states('B')).toEqual(Array(9).fill('empty'))
  })
})

describe('the Fields on the farm map', () => {
  /** Block A Ready with carrots, tended by 101. */
  function ripe(): SaveV3 {
    const save = farm()
    const plot = { crop: 'carrot' as const, growth: 3.75, ready: true, regrowing: false, own: false }
    return { ...save, fields: { blocks: [{ id: 'A', tender: '101', plots: save.fields.blocks[0]!.plots.map((p, i) => (i < 3 ? { ...plot } : p)) }] } }
  }

  it('opens a quick look with a row a block and Harvest all on every block', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: ripe() })
    await render(<FieldsPeek save={save()} />, '/?peek=fields')
    expect($$('[data-peek-block]').map((a) => a.textContent)).toEqual(['Block A3 ready', 'Block BFarm Rank 2 · 800g', 'Block CFarm Rank 4 · 3,000g', 'Block DFarm Rank 6 · 8,000g'])
    expect($('[data-action="harvest-fields"]')?.textContent).toBe('Harvest all · 3')
    expect($('[data-action="open-fields"]')?.getAttribute('href')).toBe('/fields')
    await click('[data-action="harvest-fields"]')
    expect(save().items.carrot!.reduce((a, b) => a + b, 0)).toBe(3)
    expect($('[role="status"]')?.textContent).toBe('+3 harvested')
  })

  it('draws a pip a block, and Collect all harvests every block', async () => {
    expect(fieldsPips(ripe()).map((p) => p.state)).toEqual(['ready'])
    expect(fieldsPips(farm())).toEqual([{ state: 'free' }])
    useGame.setState({ uid: 'u1', status: 'ready', save: ripe() })
    expect(await collectFarm()).toBe(3)
    expect(save().fields.blocks[0]!.plots.every((p) => p.crop === null)).toBe(true)
    expect(save().account.updatedAt).toBe('2026-11-09T20:00:00.000Z')
    expect(await collectFarm()).toBe(0)
  })
})

describe('the Fields\' view (pure)', () => {
  it('reads blocks, plots, seeds and the quick look\'s lines', () => {
    const view = fieldsView(farm())
    expect(view.map((b) => (b.owned ? `${b.id} ${b.empty}` : `${b.id} ${b.opens} ${b.cost}`))).toEqual(['A 9', 'B Farm Rank 2 800', 'C Farm Rank 4 3000', 'D Farm Rank 6 8000'])
    expect([nightsWords(1), nightsWords(3)]).toEqual(['Ready tomorrow', 'Ready in 3 nights'])
    expect([plotKey('A.4'), plotKey('B'), plotKey('E.1'), plotKey('A.9'), plotKey(null)]).toEqual([{ block: 'A', index: 4 }, { block: 'B', index: -1 }, null, null, null])
    const held = { ...farm(), items: { 'seed-carrot': [2, 0, 0, 0, 0], 'seed-carrot-own': [1, 0, 0, 0, 0], 'seed-mint': [3, 0, 0, 0, 0] } } as SaveV3
    expect(seedOptions(held, false).map((o) => `${o.name} ${o.count}`)).toEqual(['Carrot (own) 1', 'Carrot 2', 'Mint 3'])
    expect(seedOptions(held, true).map((o) => `${o.name} ${o.count}`)).toEqual(['Carrot 3', 'Mint 3'])
    expect(blockLine(view[0]!)).toBe('Empty')
  })

  it('warns on a season\'s last day which crops wither tonight', () => {
    const base = farm()
    const plots = base.fields.blocks[0]!.plots.map((p, i) => (i === 0 ? { ...p, crop: 'carrot' as const, growth: 1 }
      : i === 1 ? { ...p, crop: 'carrot' as const, growth: 3 } : i === 2 ? { ...p, crop: 'corn' as const, growth: 1 } : p))
    // Summer's last day: a growing Carrot withers, one Ready by the morning doesn't, and Corn carries into Autumn.
    const lastDay = { ...base, calendar: { day: 24 }, fields: { blocks: [{ ...base.fields.blocks[0]!, plots }] } }
    const view = fieldsView(lastDay)[0]!
    if (!view.owned) throw new Error('Block A')
    expect(view.plots.slice(0, 3).map((p) => [p.withers, p.label])).toEqual([
      [true, 'Plot 1, Carrot, withers tonight'], [false, 'Plot 2, Carrot, Ready tomorrow'], [false, 'Plot 3, Corn, Ready in 8 nights'],
    ])
    const day11 = fieldsView({ ...lastDay, calendar: { day: 23 } })[0]!
    expect(day11.owned && day11.plots[0]!.withers).toBe(false)
  })
})
