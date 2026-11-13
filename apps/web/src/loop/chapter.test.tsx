// Farm Rank and chapter 1 as rendered: the Diary's chapter card with each goal's count, the Farm
// Rank's chip and sheet, the morning's chapter, rank and milestone lines, and the closing scene the morning after the
// chapter completes, once the summary is put away, with the recruit as your newest hand. Invented outfits (the album
// fixture); the server is a stub.
import 'fake-indexeddb/auto'
import { CAST, GOLD_SHIPPED, newRosterUma, newSave, type MorningSummary, type SaveV3 } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view), masterRoster: () => fixture.view?.roster ?? null,
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined,
}))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: { name: 'Owner' } }),
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { FarmAccountBar } = await import('../shell/Bars')
const { Shell } = await import('../shell/Shell')
const { default: DiaryPage } = await import('./DiaryPage')
const { default: LoopSheets } = await import('./LoopSheets')
const { dismissSummary, endTheDay } = await import('./actions')
const { summaryParts } = await import('./summary-words')

/** Aster, Beryl and Cinder plain; Dune, Ember and Fable strong at everything, so the chapter's recruit is one of them. */
fixture.view = (await albumFixture(undefined, [
  { star5: [100, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 100] },
  { star5: [160, 160, 160, 160, 160] }, { star5: [160, 160, 160, 160, 160] }, { star5: [160, 160, 160, 160, 160] },
])).view

const AT = '2026-11-09T10:00:00.000Z'
const save = (): SaveV3 => useGame.getState().save as SaveV3
/** The start's three home on day 7, the opening scene read, with `counts`; Aster at Farming Hand when `hand`. */
function farm(counts: Record<string, number> = {}, hand = false): SaveV3 {
  const base = newSave('u1', AT)
  const aster = newRosterUma(1)
  if (hand) aster.ranks.farming = { points: 40, rank: 1, challenge: 0 }
  return {
    ...base, calendar: { day: 7 }, roster: { 81001: aster, 81002: newRosterUma(1), 81003: newRosterUma(1) },
    dorm: { level: 1, home: ['81001', '81002', '81003'], swaps: [] }, diary: { ...base.diary, read: ['scene:1:open'] }, farm: { ...base.farm, counts },
  }
}
/** Every goal met but the Farm Rank, which tonight's milestones reach. */
const ready = (): SaveV3 => ({ ...farm({ [GOLD_SHIPPED]: 10_000, 'plots-harvested': 9, 'home:forest': 6, 'home:fishery': 4 }, true), crops: { carrot: 20, potato: 2 } })

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
async function renderShell(at = '/') {
  await act(async () => root.render(<MemoryRouter key={`shell${at}`} initialEntries={[at]}><Routes><Route element={<Shell />}><Route path="*" element={<Where />} /></Route></Routes></MemoryRouter>))
  await settle()
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !document.body.querySelector(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(document.body.querySelector(selector)).not.toBeNull()
  return document.body.querySelector(selector) as HTMLElement
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await settle()
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
  useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe("the Diary's chapter card (decision 4; CS55)", () => {
  it('shows chapter 1, its six goals with their counts, a check on each met, and the reward', async () => {
    useGame.setState({ save: { ...farm({ 'plots-harvested': 4, [GOLD_SHIPPED]: 620, 'home:forest': 3 }, true), crops: { carrot: 4 } } })
    await render(<DiaryPage />, '/diary')
    expect($('[data-chapter="1"]')?.textContent).toContain('A Field Again')
    expect($$('[data-goal]').map((g) => [g.dataset.goal, g.querySelector('[data-count]')?.textContent, g.dataset.done ?? null])).toEqual([
      ['harvest', '4 / 9', null], ['ship', '620g / 1,000g', null], ['bring-home', '3 / 10', null], ['second-crop', '1 / 2 kinds', null],
      ['rank-hand', 'Done', 'true'], ['farm-rank', 'Farm Rank 1 / 2', null],
    ])
    expect($('[data-met]')?.textContent).toBe('1 of 6')
    expect(host.textContent).toContain('Reward: +500g, the Mill’s plans, a new hand, 250 Farm Rank points')
    expect($('[data-rank-link]')?.getAttribute('href')).toBe('/diary?sheet=rank')
  })

  it("says chapter 2 is soon once chapter 1 is done, and lists the milestones paid", async () => {
    const done = farm()
    useGame.setState({ save: { ...done, farm: { ...done.farm, chapter: 2 }, diary: { ...done.diary, milestones: ['shipped:10000', 'depth:hills'], shipped: { carrot: 3 } } } })
    await render(<DiaryPage />, '/diary')
    expect($('[data-chapter="2"]')?.textContent).toContain('Feathers and Fences')
    expect($('[data-soon]')?.textContent).toBe('Soon')
    expect($('[data-done-chapter]')?.textContent).toBe('Chapter 1 done · +500g, the Mill’s plans, a new hand, 250 Farm Rank points')
    expect($$('[data-milestones] li').map((li) => li.textContent)).toEqual(['10,000g shipped · +300g', 'First haul from the Hills · +500g'])
    expect($('[data-entries]')?.textContent).toBe('1 goods shipped so far')
  })
})

describe('the Farm Rank (decision 8)', () => {
  it('is a chip in the account bar that opens its sheet: points, the way to the next, what it opens, where points come from', async () => {
    useGame.setState({ save: { ...farm({ [GOLD_SHIPPED]: 4_250 }), farm: { ...farm().farm, points: 47, counts: { [GOLD_SHIPPED]: 4_250 } }, diary: { ...farm().diary, shipped: { carrot: 50 } } } })
    await render(<FarmAccountBar />)
    const chip = host.querySelector('a[aria-label="Farm Rank 1: 47 points"]')
    expect(chip?.getAttribute('href')).toBe('/?sheet=rank')
    expect(chip?.textContent).toContain('FR')
    await render(<LoopSheets sheet="rank" />, '/?sheet=rank')
    expect($('[data-rank-sheet="1"]')).not.toBeNull()
    expect($('[data-points]')?.textContent).toBe('47 points')
    expect($('[data-next]')?.textContent).toBe('103 more for Farm Rank 2 (150)')
    expect($$('[data-opens] li').map((li) => li.textContent)).toEqual(['Block B (800g)', 'Dorm level 3 (8 beds)', 'New seeds at the shop'])
    expect($$('[data-source]').map((li) => li.textContent)).toEqual(['Shipping · 1 per 100g42', 'Diary entries · 5 each5', 'Milestones · 25 each0', 'Chapters · 250 each0'])
  })
})

describe("the morning's goal lines (decisions 2, 5 and 8)", () => {
  it('names the chapter done, the Farm Rank and what it opens, and each milestone with its gold', () => {
    const summary: MorningSummary = {
      day: 8, bin: [], work: [], ranks: [], bonds: [], nudges: [],
      news: [{ kind: 'chapter', chapter: 1 }, { kind: 'farm-rank', rank: 2 }, { kind: 'milestone', id: 'rank:hand' }, { kind: 'milestone', id: 'row:woods:refined' }],
    }
    expect(summaryParts(summary)[0]!.lines).toEqual([
      { key: 'chapter', text: 'Chapter 1 done · +500g, the Mill’s plans, a new hand, 250 Farm Rank points', to: '/diary', tag: 'Chapter' },
      { key: 'farm-rank:2', text: 'Farm Rank 2 · Block B (800g), Dorm level 3 (8 beds), New seeds at the shop', to: '/?sheet=rank', tag: 'Farm Rank' },
      { key: 'milestone:rank:hand', text: 'First Uma at Hand · +300g', to: '/diary', tag: 'Milestone' },
      { key: 'milestone:row:woods:refined', text: 'Woods, refined: every grade shipped · +500g', to: '/diary', tag: 'Milestone' },
    ])
  })
})

describe('chapter 1 completes, and the closing scene plays the next morning (decisions 5 and 6)', () => {
  it('ends the day into chapter 2 with the reward, then plays the closing scene after the summary, once', async () => {
    useGame.setState({ save: ready() })
    expect(await endTheDay(7)).toBe(true)
    expect(save()).toMatchObject({ calendar: { day: 8 }, farm: { chapter: 2, points: 400 }, buildings: { mill: 0 }, gold: 500 + 300 + 300 + 500 })
    const recruit = Object.keys(save().roster).find((id) => !['81001', '81002', '81003'].includes(id))!
    expect(['81004', '81005', '81006']).toContain(recruit)
    expect(save().summary!.news.slice(0, 2)).toEqual([{ kind: 'chapter', chapter: 1 }, { kind: 'farm-rank', rank: 2 }])
    await renderShell()
    await settle()
    expect($('[data-scene]')).toBeNull() // the summary comes first
    await act(async () => { await dismissSummary() })
    await find('[data-scene="scene:1:close"] [data-beat]')
    const lines: [string, string][] = []
    while ($('[data-beat]')) {
      lines.push([$('[data-speaker]')?.textContent ?? '', $('[data-line]')!.textContent!])
      await click($('[data-beat]'))
    }
    const name = fixture.view!.album.get(recruit)!.name
    expect(lines).toContainEqual([name, `“I’m ${name}. I heard this farm is coming back to life. May I stay?”`])
    expect(lines).toContainEqual([CAST['ben-carver'].name, '“A mill. Build it beside the Fields, and your grain comes back as flour.”'])
    expect($('[data-chapter-card="2"]')?.textContent).toContain('Feathers and Fences')
    await click($('[data-action="start-day"]'))
    expect(save().diary.read).toEqual(['scene:1:open', 'scene:1:close'])
    expect($('[data-scene]')).toBeNull()
    expect(path).toBe('/')
  })
})
