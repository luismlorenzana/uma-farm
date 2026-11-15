// The stove and the Kitchen on screen: At the stove in the farmhouse kitchen opens the stove, ✕ stops it as Rough; a play
// left behind settles as Rough when the shell finds it; the Kitchen's sheet (its menu and refusals, Play opening the
// stove, the staff meal served, its level), the shop's Recipes shelf, and the morning's staff meal line. The invented
// stand-in pack; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { newSave, readScene, type SaveV4, type StoryPack } from '@farm/domain'
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
const { moneyLines } = await import('./money-words')
const { builtWords } = await import('./goal-words')
const { pickDish } = await import('./KitchenSheet')

const AT = '2026-11-15T10:00:00.000Z'
const save = (): SaveV4 => useGame.getState().save as SaveV4
const row = (n: number, stars = 1): [number, number, number, number, number] => [0, 1, 2, 3, 4].map((s) => (s === stars - 1 ? n : 0)) as [number, number, number, number, number]
/** A named farm on day 20, the opening read, with `items`; its Kitchen standing when `kitchen`. */
function farm(items: SaveV4['items'] = {}, kitchen = false): SaveV4 {
  const fresh = readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: 20 }, gold: 5000 }, 'scene:1:open')
  return { ...fresh, items: { ...fresh.items, ...items }, ...(kitchen ? { buildings: { ...fresh.buildings, kitchen: 1 }, farm: { ...fresh.farm, points: 300 } } : {}) }
}

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

describe('the stove', () => {
  it('opens from the farmhouse kitchen\'s At the stove, and ✕ stops it as Rough: the plain batch\'s six meals', async () => {
    useGame.setState({ status: 'ready', save: farm({ carp: row(2, 2) }) })
    await render(null, '/?sheet=homestead')
    await click(await find('[data-action="stove-batch"]'))
    const stove = await find('[data-stove="batch"]')
    expect(path).toContain('stove=1')
    expect(save().workshops.current).toMatchObject({ play: 'batch', goods: ['carp@2', 'carp@2'] })
    expect(stove.querySelector('[data-stove-seed]')?.textContent).toBe(`Seed ${save().workshops.current!.seed}`)
    expect(document.body.querySelectorAll('[data-burner]')).toHaveLength(3)
    await click($('[data-action="stop"]'))
    await click(await find('[data-action="stop-rough"]'))
    const result = await find('[data-result]')
    expect(result.dataset.result).toBe('rough')
    expect(result.querySelector('[data-made]')?.textContent).toBe('6 meals ★2 into the pantry')
    expect(save().workshops.current).toBeNull()
    expect(save().farm.pantry).toEqual([{ day: 20, stars: 2, meals: 6 }])
    await click($('[data-action="stove-done"]'))
    expect(path).not.toContain('stove=')
  })

  it('settles a play left behind as Rough when the shell finds it, and never replays it', async () => {
    const { startStoveBatch } = await import('@farm/domain')
    const left = startStoveBatch(farm({ carp: row(2, 1) }), ['carp@1', 'carp@1'])
    useGame.setState({ status: 'ready', save: left })
    await render(null, '/?stove=1')
    await until(() => save().workshops.current === null)
    expect(save().farm.pantry).toEqual([{ day: 20, stars: 1, meals: 6 }])
    // Unstamped: the night's own rule run early.
    expect(save().account.updatedAt).toBe(left.account.updatedAt)
    expect($('[data-stove]')).toBeNull()
  })
})

describe('the Kitchen\'s sheet', () => {
  it('offers a menu from the recipes known, refuses in the loop\'s words, and opens the stove on Play', async () => {
    useGame.setState({ status: 'ready', save: farm({ carp: row(4), basil: row(6) }, true) })
    await render(null, '/?sheet=kitchen')
    await find('[data-play-menu]')
    expect($('[data-menu-line="dish-fish-1"]')).not.toBeNull()
    expect($('[data-action="kitchen-play"]')?.getAttribute('data-why')).toBe('Short 8 Carp.')
    useGame.setState({ save: farm({ carp: row(12), basil: row(6) }, true) })
    await settle()
    const play = await find('[data-action="kitchen-play"]')
    expect(play.textContent).toBe('Play · 1 · 6 dishes')
    await click(play)
    await find('[data-stove="kitchen"]')
    expect(save().workshops.current).toMatchObject({ play: 'kitchen', menu: [{ dish: 'dish-fish-1', count: 6, main: 'carp@1', side: 'basil@1' }] })
    expect(save().workshops.played.kitchen).toBe(20)
  })

  it('serves the staff meal from the dishes held: free, once a day; then says who ate and how long they\'re well fed', async () => {
    useGame.setState({ status: 'ready', save: farm({ 'dish-fish-1': row(3, 3) }, true) })
    await render(null, '/?sheet=kitchen')
    expect((await find('[data-staff-table]')).textContent).toBe('Tonight · 1 at the table · 1 dish')
    await click($('[data-action="serve-staff"]'))
    expect(save().today.staff).toEqual({ mouths: 1, days: 2 })
    expect((await find('[data-served-staff]')).textContent).toBe('Served · 1 at the table · well fed 2 days')
    expect(save().items['dish-fish-1']).toEqual(row(2, 3))
    expect(pickDish([], 'dish-fish-1@3', 3, 2)).toEqual(['dish-fish-1@3'])
    expect(pickDish(['a', 'b'], 'c', 1, 2)).toEqual(['b', 'c'])
  })
})

describe('the shop\'s Recipes shelf, and the morning', () => {
  it('sells the recipes not known once the Kitchen stands, in town', async () => {
    useGame.setState({ status: 'ready', save: { ...farm({}, true), today: { ...farm().today, town: true } } })
    await render(null, '/?sheet=shop')
    const shelf = await find('[data-recipe-shelf]')
    expect(shelf.dataset.recipeShelf).toBe('77')
    const grill = $('[data-shelf-recipe="dish-fish-2"]')!
    expect(grill.textContent).toContain('2 Trout or Trout Fillet + any herb or spice')
    await click(grill.querySelector('[data-action="buy-recipe"]') as HTMLElement)
    expect(save().workshops.recipes).toContain('dish-fish-2')
    // Before the Kitchen stands, no shelf.
    useGame.setState({ save: { ...farm(), today: { ...farm().today, town: true } } })
    await render(null, '/?sheet=shop')
    await find('[data-shop]')
    expect($('[data-recipe-shelf]')).toBeNull()
  })

  it('says the staff meal in the morning, and the Kitchen\'s new level', () => {
    const names = { place: (id: string) => id, house: (n: number) => `House ${n}` }
    expect(moneyLines([{ kind: 'staff', mouths: 12, days: 2 }], names)).toEqual([{ key: 'staff', text: 'Staff meal · 12 at the table · well fed 2 days', tag: 'Well fed' }])
    expect(moneyLines([{ kind: 'staff', mouths: 3, days: 1 }], names)[0]!.text).toBe('Staff meal · 3 at the table · well fed today')
    expect(builtWords('kitchen', 2)).toBe('The Kitchen · level 2 · 8 dishes a play')
  })
})
