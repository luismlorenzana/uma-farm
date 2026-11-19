// The farm grows by building, as rendered: the Diary's projects (what you can build now with what it lacks, the next
// rank's offers, the milestones with the Umas), a place's Build card in its quick look, paying for the Mill and seeing it
// stand the next morning with its "Built overnight" line, "Not built yet" for a place whose game isn't built, the Farm
// Rank's chip and sheet, and the morning's goal lines. Invented outfits (the album fixture) and a cast of them built from
// the stand-in pack; the server is a stub.
import 'fake-indexeddb/auto'
import { GOLD_SHIPPED, newLove, newRosterUma, newSave, STAND_IN_FILES, storyPackFrom, type MorningSummary, type SaveV4, type StoryPack } from '@farm/domain'
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
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: { name: 'Owner' } }),
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { default: BookPage } = await import('../book/BookPage')
const { Shell } = await import('../shell/Shell')
const { default: DiaryPage } = await import('./DiaryPage')
const { default: FarmRoute } = await import('./FarmMap')
const { default: LoopSheets } = await import('./LoopSheets')
const { endTheDay } = await import('./actions')
const { summaryParts } = await import('./summary-words')

/** Aster, Beryl and Cinder plain; Dune, Ember and Fable strong at everything. */
fixture.view = (await albumFixture(undefined, [
  { star5: [100, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 100] },
  { star5: [160, 160, 160, 160, 160] }, { star5: [160, 160, 160, 160, 160] }, { star5: [160, 160, 160, 160, 160] },
])).view

/** A cast of the invented outfits: Aster, Beryl and Cinder, on the farm from day 1. */
const standIn = storyPackFrom(STAND_IN_FILES)
const entry = (from: number, characterId: string) => ({ ...standIn.cast.umas[from]!, characterId, outfitId: characterId })
fixture.pack = {
  ...standIn, bibles: new Map(), ties: { ...standIn.ties, ties: [] },
  cast: { ...standIn.cast, umas: [entry(0, '81001'), entry(1, '81002'), entry(2, '81003')] },
}

const AT = '2026-11-09T10:00:00.000Z'
const save = (): SaveV4 => useGame.getState().save as SaveV4
/** The three home on day 7, the farmer named, the opening and their arrivals read, with `counts`; Aster at
 * Farming Hand when `hand`. */
function farm(counts: Record<string, number> = {}, hand = false): SaveV4 {
  const base = newSave('u1', AT)
  const aster = newRosterUma(1)
  if (hand) aster.ranks.farming = { points: 40, rank: 1, challenge: 0 }
  return {
    ...base, farmer: { name: 'Robin' }, calendar: { day: 7 }, roster: { 81001: aster, 81002: newRosterUma(1), 81003: newRosterUma(1) },
    love: { 81001: newLove(), 81002: newLove(), 81003: newLove() }, arrivals: ['81001', '81002', '81003'],
    dorm: { level: 1, home: ['81001', '81002', '81003'], swaps: [] }, diary: { ...base.diary, read: ['scene:1:open'] }, farm: { ...base.farm, counts },
  }
}

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

describe("the Diary's projects", () => {
  it('lists the Mill to build now with what it lacks, the next rank\'s offers, and the milestones with the Umas', async () => {
    useGame.setState({ save: { ...farm(), gold: 600, items: { 'pine-log': [8, 0, 0, 0, 0] } } })
    await render(<DiaryPage />, '/diary')
    expect($$('[data-project]').map((p) => [p.dataset.project, p.querySelector('[data-state]')?.textContent])).toEqual([['mill', 'Need 400g and 12 logs more']])
    expect($('[data-project="mill"]')?.textContent).toContain('1,000g · 20 logs')
    expect($('[data-project="mill"]')?.getAttribute('href')).toBe('/?peek=mill')
    expect($('[data-next-offers]')?.textContent).toContain('At Farm Rank 2 · 150 points')
    expect($$('[data-offer]').map((o) => o.textContent)).toEqual(['Coop2,000g · 30 logs · 20 vegetables'])
    expect($$('[data-milestone]').map((m) => [m.dataset.milestone, m.querySelector('[data-count]')?.textContent])).toEqual([
      ['bench', 'Not yet'], ['house', '0 / 1 married'], ['row', '0 / 3 married'], ['row', '0 / 6 married'], ['board', '3 / 5 met'],
    ])
    expect(host.textContent).toContain('Your first wedding')
    expect($('[data-rank-link]')?.getAttribute('href')).toBe('/diary?sheet=rank')
  })

  it('shows each loan as a goal, what\'s owed and when it clears, and points a build short of gold to the mayor\'s office', async () => {
    const base = farm()
    useGame.setState({ save: {
      ...base, gold: 600, items: { 'pine-log': [20, 0, 0, 0, 0] },
      farm: { ...base.farm, loans: [{ for: 'dorm:2', day: 1, lent: 700, fee: 70, owed: 770, nightly: 80 }] },
    } })
    await render(<DiaryPage />, '/diary')
    expect($$('[data-project-loan]').map((l) => [l.dataset.projectLoan, l.textContent, l.getAttribute('href')])).toEqual([
      // Day 7 and ten nights: Summer 5.
      ['dorm:2', 'Dorm level 2770g owed · 80g a night · clears in about 10 nights (Summer 5)', '/book'],
    ])
    // The Mill wants only gold now.
    expect($('[data-project="mill"] [data-state]')?.textContent).toBe('Need 400g more')
    expect($('[data-to-office]')?.getAttribute('href')).toBe('/town?at=mayor')
  })

  it('says Build when it can, "Builds tonight" once paid, and names what\'s offered but not built yet', async () => {
    useGame.setState({ save: { ...farm(), gold: 5000, items: { 'pine-log': [60, 0, 0, 0, 0] } } })
    await render(<DiaryPage />, '/diary')
    expect($('[data-project="mill"] [data-state]')?.textContent).toBe('Build ›')
    useGame.setState({ save: { ...farm(), farm: { ...farm().farm, points: 300, builds: ['sawmill'] }, buildings: { dorm: 1, mill: 1 } } })
    await render(<DiaryPage />, '/diary')
    expect($$('[data-project]').map((p) => [p.dataset.project, p.querySelector('[data-state]')?.textContent])).toEqual([
      ['coop', 'Need 1,500g, 30 logs and 20 vegetables more'], ['sawmill', 'Builds tonight'], ['barn', 'Need 3,000g, 30 logs and 20 vegetables more'],
      ['smokehouse', 'Need 1,500g, 30 logs and 20 fish more'], ['kitchen', 'Need 2,500g, 40 logs and 20 vegetables more'],
    ])
    expect($('[data-waiting]')).toBeNull()
    expect($$('[data-offer]').map((o) => o.dataset.offer)).toEqual(['mine', 'smelter'])
  })

  it('lists the milestones paid so far', async () => {
    const done = farm()
    useGame.setState({ save: { ...done, diary: { ...done.diary, milestones: ['shipped:10000', 'depth:hills'], shipped: { carrot: 3 } } } })
    await render(<DiaryPage />, '/diary')
    expect($$('[data-milestones] li').map((li) => li.textContent)).toEqual(['10,000g shipped · +300g', 'First haul from the Hills · +500g'])
    expect($('[data-entries]')?.textContent).toBe('1 goods shipped so far')
  })
})

describe('building a place', () => {
  it('offers the Mill in its quick look, builds it overnight, and says so in the morning', async () => {
    useGame.setState({ save: { ...farm(), gold: 1200, items: { 'pine-log': [25, 0, 0, 0, 0] } } })
    await render(<FarmRoute />, '/?peek=mill')
    const card = await find('[data-build="mill"]')
    expect([...card.querySelectorAll('[data-cost]')].map((c) => c.textContent)).toEqual(['✓1,000g1,200g held', '✓20 logs25 held'])
    await click($('[data-build="mill"] [data-action="build"]'))
    expect(save()).toMatchObject({ gold: 200, farm: { builds: ['mill'] }, items: { 'pine-log': [5, 0, 0, 0, 0] } })
    expect((await find('[data-build-note]')).textContent).toBe('The Mill stands tomorrow.')
    expect($('[data-build="mill"] [data-build-lock]')?.textContent).toBe('Builds tonight')
    expect(await endTheDay(7)).toBe(true)
    expect(save().buildings.mill).toBe(1)
    expect(save().summary!.news).toContainEqual({ kind: 'built', place: 'mill' })
    expect(summaryParts(save().summary!).find((p) => p.section === 'news')!.lines[0]).toEqual({ key: 'built:mill', text: 'Built overnight · the Mill', to: '/?peek=mill', tag: 'Built' })
  })

  it('shows a place whose game isn\'t built yet as "Not built yet", which can\'t be bought', async () => {
    useGame.setState({ save: { ...farm(), gold: 99_999, farm: { ...farm().farm, points: 10_000 } } })
    await render(<FarmRoute />, '/?peek=forge')
    const card = await find('[data-build="forge"]')
    expect(card.dataset.lock).toBe('game')
    expect(card.querySelector('[data-build-lock]')).toBeNull()
    const button = card.querySelector('[data-action="build"]') as HTMLButtonElement
    expect(button.textContent).toBe('Not built yet')
    expect(button.disabled).toBe(true)
  })

  it('offers the Boat at the Dock once the Dock stands', async () => {
    useGame.setState({ save: { ...farm(), gold: 99_999, farm: { ...farm().farm, points: 5000 }, buildings: { dorm: 1, dock: 1 } } })
    await render(<FarmRoute />, '/?peek=dock')
    await find('[data-build="boat"]')
    expect($('[data-dock-open]')?.textContent).toContain('The Sea Pier is open at the pond’s edge.')
  })
})

describe('the Farm Rank', () => {
  it('is a card in the Book that opens its sheet: points, the way to the next, what it opens, where points come from', async () => {
    useGame.setState({ save: { ...farm({ [GOLD_SHIPPED]: 4_250 }), farm: { ...farm().farm, points: 47, counts: { [GOLD_SHIPPED]: 4_250 } }, diary: { ...farm().diary, shipped: { carrot: 50 } } } })
    await render(<BookPage />, '/book')
    const card = host.querySelector('a[data-book="rank"]')
    expect(card?.getAttribute('href')).toBe('/book?sheet=rank')
    expect(card?.querySelector('[data-figure]')?.textContent).toBe('1')
    expect(card?.querySelector('[data-line]')?.textContent).toBe('47 points')
    await render(<LoopSheets sheet="rank" />, '/?sheet=rank')
    expect($('[data-rank-sheet="1"]')).not.toBeNull()
    expect($('[data-points]')?.textContent).toBe('47 points')
    expect($('[data-next]')?.textContent).toBe('103 more for Farm Rank 2 (150)')
    expect($$('[data-opens] li').map((li) => li.textContent)).toEqual([
      'The Coop to build (2,000g · 30 logs · 20 vegetables)', 'The Hills', 'The River', 'The Sea Pier (with the Dock)', 'Chickens at the rancher’s', 'New seeds at the shop',
    ])
    expect($$('[data-source]').map((li) => li.textContent)).toEqual(['Shipping · 1 per 100g42', 'Diary entries · 5 each5', 'Milestones · 25 each0', 'Festivals · 150 · 75 · 25 a place0'])
  })
})

describe("the morning's goal lines", () => {
  it('names a place built overnight, the Farm Rank and what it opens, and each milestone with its gold', () => {
    const summary: MorningSummary = {
      day: 8, bin: [], work: [], ranks: [], hearts: [], nudges: [],
      news: [{ kind: 'built', place: 'boat' }, { kind: 'farm-rank', rank: 2 }, { kind: 'milestone', id: 'rank:hand' }, { kind: 'milestone', id: 'row:woods:refined' }],
    }
    expect(summaryParts(summary)[0]!.lines).toEqual([
      { key: 'built:boat', text: 'Built overnight · the Boat', to: '/?peek=dock', tag: 'Built' },
      {
        key: 'farm-rank:2', to: '/?sheet=rank', tag: 'Farm Rank',
        text: 'Farm Rank 2 · The Coop to build (2,000g · 30 logs · 20 vegetables), The Hills, The River, The Sea Pier (with the Dock), Chickens at the rancher’s, New seeds at the shop',
      },
      { key: 'milestone:rank:hand', text: 'First Uma at Hand · +300g', to: '/diary', tag: 'Milestone' },
      { key: 'milestone:row:woods:refined', text: 'Woods, refined: every grade shipped · +500g', to: '/diary', tag: 'Milestone' },
    ])
  })
})
