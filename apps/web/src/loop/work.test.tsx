// The forest, the Fishery and the stations as rendered: a job sheet's areas and spots
// with their locks, sizes in days, a job started, a night, the haul collected by stars with a fish's size, a queue, a
// station built and a station job, the quick look, and the view model behind them. Invented outfit ids; master data and
// the server are stubs.
import 'fake-indexeddb/auto'
import { DAY_MS, newRosterUma, newSave, type SaveV3 } from '@farm/domain'
import { jobQuery } from '@luismlorenzana/uma-kit/work'
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
const { default: WorkPlace, WorkPlacePeek } = await import('./WorkPlace')
const { endTheDay } = await import('./actions')
const { dayWords, daysFor, gatherSizes, haulWords, requestWords, stationSizeRule, whereRows } = await import('./work-view')
const { talentsD } = await import('@farm/domain')

const AT = '2026-11-09T10:00:00.000Z'
/** Day 1 with two Umas home, Novice everywhere. */
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
async function render(node: ReactNode, at: string) {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={<>{node}<Where /></>} /></Routes></MemoryRouter>))
  await settle()
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
const page = (place: 'forest' | 'fishery' | 'mill' | 'sawmill' | 'smokehouse') => <WorkPlace place={place} />

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

describe('the forest\'s page', () => {
  it('sends an Uma to the Woods for two days, the rows in days, and collects each morning\'s haul by stars', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(page('forest'), '/forest')
    expect($('[data-stats]')?.textContent).toBe('Foraging · 4 slots')
    expect($$('[data-slot-card="free"]')).toHaveLength(4)

    await render(page('forest'), `/forest${jobQuery({ slot: 0 })}`)
    expect($$('[data-where]').map((b) => `${b.getAttribute('data-where')} ${(b as HTMLButtonElement).disabled}`)).toEqual([
      'woods false', 'hills true', 'old-forest true', 'mountain true', 'misty-vale true', 'world-tree true',
    ])
    expect($('[data-where="hills"]')?.textContent).toContain('From Hand')
    expect($('[data-where="woods"]')?.textContent).toContain('About 5 a day · G1–G2')
    expect($('[data-where="woods"]')?.getAttribute('aria-checked')).toBe('true')
    expect($$('[data-size]').map((b) => b.textContent)).toEqual(['×51 day', '×102 days', '×153 days', '×204 days'])
    await click('[data-size="10"]')
    expect($('[data-action="job-submit"]')?.textContent).toBe('Start · ×10 · 2 days')
    await click('[data-action="job-submit"]')
    const entry = save().work['101']!.entries[0]!
    expect(entry.request).toEqual({ kind: 'forage', item: 'woods', count: 2 })
    expect(entry.outputs).toHaveLength(10)
    expect(save().account.updatedAt).toBe('2026-11-09T20:00:00.000Z')

    await render(page('forest'), '/forest')
    expect($('[data-slot-card="running"]')?.textContent).toContain('In 2 days')
    expect($('[data-slot-card="running"]')?.textContent).not.toContain('24h')

    expect(await endTheDay(1)).toBe(true)
    await render(page('forest'), '/forest')
    expect($('[data-slot-card="running"]')?.textContent).toContain('Tomorrow')
    await click('[data-slot-card="running"] [data-action="collect"]')
    expect($('[data-work-note]')?.textContent).toMatch(/^\+5 · ★1 × \d/)
    expect(save().farm.counts['home:forest']).toBe(5)
    expect(Object.values(save().items).flat().reduce((a, b) => a + b, 0)).toBe(9 + 5)
    expect(save().roster['101']!.ranks.foraging.challenge).toBe(5)
    expect(save().roster['101']!.ranks.foraging.points).toBe(10)
  })

  it('queues another day behind a running job, which starts at the night\'s boundary', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(page('forest'), `/forest${jobQuery({ slot: 1 })}`)
    await click('[data-action="job-submit"]')
    await render(page('forest'), `/forest${jobQuery({ uma: '101', queue: true })}`)
    expect($('[data-action="job-submit"]')?.textContent).toBe('Queue next · ×5 · 1 day')
    await click('[data-action="job-submit"]')
    expect(save().work['101']!.queue).toEqual([{ kind: 'forage', item: 'woods', count: 1 }])
    expect(await endTheDay(1)).toBe(true)
    expect(save().work['101']!.entries.map((e) => [e.startedAt, e.fromQueue])).toEqual([[0, false], [DAY_MS, true]])
  })

  it('says how long ago a queue stopped in days, never "ago" twice', async () => {
    const base = { ...farm(), calendar: { day: 3 } }
    const dropped = {
      at: DAY_MS, slot: { building: 'forest', slot: 0 }, requests: [{ kind: 'forage', item: 'hills', count: 1 }], short: [],
      refused: { refused: true as const, code: 'locked', message: 'Opens at {rank}.', data: { rank: 'Hand' } },
    }
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...base, work: { 101: { outfitId: '101', slot: null, entries: [], queue: [], last: null, dropped } } } })
    await render(page('forest'), '/forest')
    expect($('[data-kit="stopped-queue"]')?.textContent).toContain('Forest · stopped yesterday')
    expect($('[data-kit="stopped-queue"]')?.textContent).toContain('Hills')
    expect($('[data-kit="stopped-queue"]')?.textContent).toContain('Opens at Hand.')
  })
})

describe('the Fishery\'s page', () => {
  it('fishes the Pond, offers the River from Hand and the sea from chapter 7, and measures the catch', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(page('fishery'), `/fishery${jobQuery({ slot: 0 })}`)
    expect($$('[data-where]').filter((b) => !(b as HTMLButtonElement).disabled).map((b) => b.getAttribute('data-where'))).toEqual(['pond'])
    expect($('[data-where="river"]')?.textContent).toContain('From Hand')
    expect($('[data-where="sea-pier"]')?.textContent).toContain('Chapter 7')
    expect($('[data-where="pond"]')?.textContent).toContain('About 3 a day')
    await click('[data-action="job-submit"]')
    expect(save().work['101']!.entries[0]!.outputs).toHaveLength(3)
    expect(await endTheDay(1)).toBe(true)
    expect(save().summary!.work).toEqual([{ kind: 'jobs', place: 'fishery', jobs: 1, items: 3 }, expect.objectContaining({ kind: 'catch' })])
    await render(page('fishery'), '/fishery')
    await click('[data-action="collect-here"]')
    expect($('[data-work-note]')?.textContent).toMatch(/^\+3 · .* cm, a record$/)
    expect(Object.keys(save().diary.records).every((k) => k.startsWith('size:'))).toBe(true)
    expect(save().farm.counts['home:fishery']).toBe(3)
  })
})

describe('the stations', () => {
  it('locks an unbuilt Sawmill until Farm Rank 3, builds it, and saws a day of logs', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(), gold: 2000 } })
    await render(page('sawmill'), '/sawmill')
    expect($('[data-build-lock]')?.textContent).toBe('Opens at Farm Rank 3.')
    expect(($('[data-action="build"]') as HTMLButtonElement).disabled).toBe(true)
    useGame.setState({ save: { ...farm(), gold: 2000, farm: { ...farm().farm, points: 500 }, items: { 'pine-log': [12, 0, 3, 0, 0] } } })
    await render(page('sawmill'), '/sawmill')
    expect($('[data-action="build"]')?.textContent).toBe('Build · 1,500g')
    await click('[data-action="build"]')
    expect(save()).toMatchObject({ gold: 500, buildings: { sawmill: 1 } })
    expect($('[data-work-note]')?.textContent).toBe('The Sawmill is built.')
    expect($('[data-stats]')?.textContent).toBe('Foraging · 4 slots')

    await render(page('sawmill'), `/sawmill${jobQuery({ slot: 0 })}`)
    expect($$('[data-option]').map((b) => b.getAttribute('data-option'))).toEqual(['pine-plank@1', 'pine-plank@3'])
    expect($$('[data-size]').map((b) => b.textContent)).toEqual(['×81 day', '×122 days'])
    await click('[data-size="8"]')
    await click('[data-action="job-submit"]')
    expect(save().items['pine-log']).toEqual([4, 0, 3, 0, 0])
    expect(await endTheDay(1)).toBe(true)
    await render(page('sawmill'), '/sawmill')
    await click('[data-action="collect"]')
    expect(save().items['pine-plank']).toEqual([8, 0, 0, 0, 0])
  })

  it('says what to bring when the Warehouse holds nothing a station takes', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(), buildings: { dorm: 1, smokehouse: 1 }, items: {} } })
    await render(page('smokehouse'), `/smokehouse${jobQuery({ slot: 0 })}`)
    expect($('[data-what="smokehouse"]')?.textContent).toBe('Nothing to process yet: bring fish home first.')
    expect(($('[data-action="job-submit"]') as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('the quick look on the farm map', () => {
  it('shows the forest\'s four slots and opens its job sheet, and a station\'s Build', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<WorkPlacePeek save={save()} place="forest" />, '/?peek=forest')
    expect($$('[data-kit="peek-row"]')).toHaveLength(4)
    expect($('[data-action="open-place"]')?.getAttribute('href')).toBe('/forest')
    await click('[data-kit="peek-row"] button')
    expect(path).toBe(`/forest${jobQuery({ slot: 0 })}`)
    await render(<WorkPlacePeek save={{ ...save(), gold: 100, farm: { ...save().farm, points: 500 } }} place="smokehouse" />, '/?peek=smokehouse')
    expect($('[data-build-lock]')?.textContent).toBe('Need 1,900g more.')
  })
})

describe('the work screens\' view (pure)', () => {
  it('words days for the kit: left, length and ago', () => {
    expect([dayWords(DAY_MS, 'left'), dayWords(2 * DAY_MS, 'left'), dayWords(1.75 * DAY_MS, 'left')]).toEqual(['Tomorrow', 'In 2 days', 'In 2 days'])
    expect([dayWords(DAY_MS, 'length'), dayWords(3 * DAY_MS, 'length'), dayWords(DAY_MS / 8, 'length')]).toEqual(['1 day', '3 days', '1 day'])
    expect([dayWords(0, 'ago'), dayWords(DAY_MS, 'ago'), dayWords(3 * DAY_MS, 'ago')]).toEqual(['today', 'yesterday', '3 days ago'])
  })

  it('reads sizes in days, requests, locks and a collect\'s words', () => {
    const save = farm()
    expect(gatherSizes(save, 'forest', '101', talentsD)).toEqual([5, 10, 15, 20])
    expect([daysFor(5, [5, 10, 15, 20]), daysFor(6, [5, 10, 15, 20]), daysFor(99, [5, 10, 15, 20])]).toEqual([1, 2, 4])
    expect(whereRows(save, 'fishery', '101', talentsD).map((r) => r.lock)).toEqual([null, 'From Hand', 'From Skilled', 'From Expert', 'From Legend', 'Chapter 7', 'Chapter 7'])
    expect(requestWords({ kind: 'forage', item: 'old-forest', count: 2 }, 1)).toEqual({ name: 'Old Forest', item: 'maple-log' })
    expect(requestWords({ kind: 'planks', item: 'pine-plank@3', count: 8 }, 1)).toEqual({ name: 'Pine Plank ★3', item: 'pine-plank@3', count: 8 })
    const held = { ...save, items: { apple: [5, 0, 0, 0, 0] } } as SaveV3
    expect(stationSizeRule(held, 'apple-preserve@1', '101', talentsD)).toEqual({ mode: 'duration', sizes: [5, 16, 32], max: 32 })
    expect(haulWords({ goods: ['carp@1', 'carp@2', 'trout@1'], sizes: [{ fish: 'carp', stars: 1, cm: 30.2, record: false }, { fish: 'trout', stars: 1, cm: 41.5, record: true }] }))
      .toBe('+3 · ★1 × 2, ★2 × 1 · Trout 41.5 cm, a record')
    expect(haulWords({ goods: [], sizes: [] })).toBeNull()
  })
})
