// The Cooking Contest on screen: the Kitchen's card on its day (and the day before, and before the Kitchen stands), the
// entry sheet (its recipe, ingredients and cook; Enter · 3 opening the stove under the festival's name), the play stopped
// as Rough and judged (the town's cook's scene, then the board), the morning's Contest lines opening the Kitchen, and the
// Farm Rank's sheet listing the festivals' points. The invented stand-in pack; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { newLove, newRosterUma, newSave, readScene, type MorningSummary, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined, setMasterLens: () => undefined,
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
const { storyReady } = await import('../story/story')
const { castLens } = await import('../story/load')
const { Shell } = await import('../shell/Shell')
const { summaryParts } = await import('./summary-words')
const { boardWords, prizeWords, theContest } = await import('./Contest')

const AT = '2026-11-15T10:00:00.000Z'
/** Autumn 10, the game's Contest. */
const CONTEST_DAY = 82
const HAND = '9000001'
const save = (): SaveV4 => useGame.getState().save as SaveV4
const row = (n: number, stars = 1): [number, number, number, number, number] => [0, 1, 2, 3, 4].map((s) => (s === stars - 1 ? n : 0)) as [number, number, number, number, number]
/** A named farm on `day`, the opening read, at Farm Rank 3, Carrot and Basil held; its Kitchen standing unless not. */
function farm(day = CONTEST_DAY, kitchen = true): SaveV4 {
  const fresh = readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day }, gold: 500 }, 'scene:1:open')
  return {
    ...fresh, items: { ...fresh.items, carrot: row(6), basil: row(3) }, farm: { ...fresh.farm, points: 300 },
    ...(kitchen ? { buildings: { ...fresh.buildings, kitchen: 1 } } : {}),
  }
}
/** A friend met and invited to work on day 1, her meeting scene played. */
const withHand = (s: SaveV4): SaveV4 => ({
  ...s, roster: { ...s.roster, [HAND]: { ...newRosterUma(1), farmhand: 1 } }, love: { ...s.love, [HAND]: newLove() }, arrivals: [...s.arrivals, HAND],
})

let host: HTMLDivElement
let root: Root
let path = ''
function Where() {
  const location = useLocation()
  path = `${location.pathname}${location.search}`
  return null
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
async function render(node: ReactNode, at: string) {
  const page = <>{node}<Where /></>
  await act(async () => root.render(
    <MemoryRouter key={at} initialEntries={[at]}>
      <Routes><Route element={<Shell />}><Route path="*" element={page} /></Route></Routes>
    </MemoryRouter>,
  ))
  await settle()
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const until = async (ok: () => boolean, tries = 200) => {
  for (let i = 0; i < tries && !ok(); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(ok()).toBe(true)
}
const find = async (selector: string): Promise<HTMLElement> => {
  await until(() => $(selector) !== null)
  return $(selector)!
}
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await settle()
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const pack = await storyReady()
  fixture.pack = pack
  fixture.view = castLens(pack)((await albumFixture()).view)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('the Kitchen\'s Contest card', () => {
  it('says the Contest tomorrow the day before, and nothing on another day', async () => {
    useGame.setState({ status: 'ready', save: farm(CONTEST_DAY - 1) })
    await render(null, '/?sheet=kitchen')
    expect((await find('[data-contest="tomorrow"]')).textContent).toContain('Cooking Contest tomorrow')
    useGame.setState({ save: farm(CONTEST_DAY - 2) })
    await settle()
    await find('[data-play-menu]')
    expect($('[data-contest]')).toBeNull()
  })

  it('before the Kitchen stands, says "Build the Kitchen to enter." on its day, its Enter greyed', async () => {
    useGame.setState({ status: 'ready', save: farm(CONTEST_DAY, false) })
    await render(null, '/?sheet=kitchen')
    const enter = await find('[data-action="contest-enter"]')
    expect(enter.textContent).toBe('Enter the Cooking Contest · 3')
    expect(enter.getAttribute('data-why')).toBe('Build the Kitchen to enter.')
    expect((enter as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-kitchen-unbuilt]')).not.toBeNull()
    expect($('[data-action="contest-build"]')?.getAttribute('href')).toBe('/?peek=kitchen')
  })
})

describe('the entry, the play and the judging', () => {
  it('enters with a recipe, its ingredients and a cook; plays it at the stove; ✕ judges it as Rough, the cook speaks, then the board', async () => {
    useGame.setState({ status: 'ready', save: withHand(farm()) })
    await render(null, '/?sheet=kitchen')
    await click(await find('[data-action="contest-enter"]'))
    await find('[data-contest-sheet="entry"]')
    expect(path).toContain('sheet=contest')
    // The default: Carrot Salad from Carrot ★1 and Basil ★1, ★1 before the stove.
    expect($('[data-contest-dish="dish-vegetables-1"]')?.getAttribute('aria-pressed')).toBe('true')
    expect($('[data-entry-chip="main"]')?.dataset.key).toBe('carrot@1')
    expect($('[data-entry-stars]')?.dataset.entryStars).toBe('1')
    expect([...document.body.querySelectorAll('[data-rival]')].map((r) => r.textContent)).toEqual(['The orchard58', 'The ranch47'])
    // A recipe it can't make is marked, and refused.
    await click($('[data-contest-dish="dish-fish-1"]'))
    expect($('[data-action="contest-start"]')?.getAttribute('data-why')).toBe('That isn’t a main for Carp Grill.')
    await click($('[data-contest-dish="dish-vegetables-1"]'))
    await click($(`[data-cook="${HAND}"]`))
    const start = $('[data-action="contest-start"]')!
    expect(start.textContent).toBe('Enter · 3')
    expect(start.getAttribute('data-why')).toBeNull()
    await click(start)
    const stove = await find('[data-stove="contest"]')
    expect(stove.textContent).toContain('Cooking Contest')
    expect(save().workshops.current).toMatchObject({ play: 'contest', assistant: HAND, menu: [{ dish: 'dish-vegetables-1', count: 1, main: 'carrot@1', side: 'basil@1' }] })
    expect(save().today).toMatchObject({ eventActions: 3, actions: 0, cook: HAND })
    // Stopped: Rough, its play's score 0; a ★1 dish, 10: 3rd.
    await click($('[data-action="stop"]'))
    await click(await find('[data-action="stop-rough"]'))
    await find('[data-scene="scene:contest"]')
    expect(save().farm.festivals).toEqual([{ id: 'cooking-contest', day: CONTEST_DAY, score: 10, place: 3 }])
    expect(save().gold).toBe(860)
    expect(document.body.textContent).toContain('Three covered plates')
    await click($('[data-action="skip"]'))
    const board = await find('[data-contest-board]')
    expect(board.querySelector('[data-place]')?.textContent).toBe('3rd')
    expect(board.querySelector('[data-prize]')?.textContent).toBe('+360g · +25 Farm Rank points')
    expect(board.querySelector('[data-contest-dish-made]')?.textContent).toContain('Carrot Salad ★1')
    await click($('[data-action="contest-done"]'))
    expect(path).not.toContain('stove=')
    // The entry sheet under it shows the board; one entry a Contest.
    expect((await find('[data-contest-sheet="judged"]')).querySelector('[data-place]')?.textContent).toBe('3rd')
  })

  it('shows the board on the Kitchen\'s card once judged', async () => {
    const judged = { ...farm(), farm: { ...farm().farm, festivals: [{ id: 'cooking-contest', day: CONTEST_DAY, score: 80, place: 1 as const }] } }
    useGame.setState({ status: 'ready', save: judged })
    await render(null, '/?sheet=kitchen')
    const card = await find('[data-contest="judged"]')
    expect(card.querySelector('[data-place]')?.textContent).toBe('1st')
    expect(card.querySelector('[data-prize]')?.textContent).toBe('+1,800g · +150 Farm Rank points')
    expect(boardWords({ score: 78, place: 1, rivals: [{ id: 'wren-ashby', farm: 'the orchard', score: 70 }, { id: 'cole-varga', farm: 'the ranch', score: 61 }] }))
      .toBe('1st · You 78 · the orchard 70 · the ranch 61')
    expect(prizeWords({ gold: 900, points: 75 })).toBe('+900g · +75 Farm Rank points')
    expect([theContest('Cooking Contest'), theContest('The Cooking Contest')]).toEqual(['the Cooking Contest', 'the Cooking Contest'])
  })
})

describe('the morning and the Farm Rank', () => {
  it('opens the Kitchen for the Cooking Contest and the Festival ground for the Flower Show', () => {
    const summary: MorningSummary = {
      day: CONTEST_DAY, bin: [], ranks: [], hearts: [], nudges: [], work: [],
      news: [{ kind: 'festival', festival: 'cooking-contest', when: 'today' }, { kind: 'festival', festival: 'flower-show', when: 'tomorrow' }],
    }
    expect(summaryParts(summary)[0]!.lines).toEqual([
      { key: 'festival:today', text: 'Cooking Contest today · +3 for events', to: '/?sheet=kitchen' },
      { key: 'festival:tomorrow', text: 'Flower Show tomorrow', to: '/?sheet=festival&contest=flower-show' },
    ])
    const eve = summaryParts({ ...summary, news: [{ kind: 'festival', festival: 'cooking-contest', when: 'tomorrow' }] })[0]!.lines
    expect(eve).toEqual([{ key: 'festival:tomorrow', text: 'Cooking Contest tomorrow', to: '/?sheet=kitchen' }])
  })

  it('lists the festivals\' points on the Farm Rank\'s sheet', async () => {
    const won = { ...farm(), farm: { ...farm().farm, festivals: [{ id: 'cooking-contest', day: CONTEST_DAY, score: 80, place: 1 as const }] } }
    useGame.setState({ status: 'ready', save: won })
    await render(null, '/?sheet=rank')
    const row = await find('[data-source="Festivals"]')
    expect(row.textContent).toBe('Festivals · 150 · 75 · 25 a place150')
  })
})
