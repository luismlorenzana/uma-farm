// Married life on screen: the homestead's rows on the map,
// building and naming House 1 on the homestead's sheet, a move and a swap, the wedding's room on Married, Tonight's Sleep at,
// the morning's house line and "misses you", a night level's card, a household scene played and read, and her room on her
// profile. The invented stand-in
// pack (9000001–9000003) and invented outfits; master data and the server are stubs.
import 'fake-indexeddb/auto'
import {
  FARM_PLACES, joinOpening, moveSpouse, newLove, newRosterUma, newSave, readScene, type HouseLine, type Love, type SaveV4, type StoryPack,
} from '@farm/domain'
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
const { default: HeartsPage } = await import('./HeartsPage')
const { FARM_MAP_TILES, placeAt } = await import('./farm-map')
const { homesteadLayout, homesteadPlaces, placeOnV4 } = await import('./homestead-map')
const { homeWords, sleepViews } = await import('./homestead-view')
const { summaryParts } = await import('./summary-words')
const { setAskBeforeEnd } = await import('./ask')

const AT = '2026-11-11T10:00:00.000Z'
const DAY = 30
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 30, the opening three home and their arrivals played; `love` by id. */
function farm(love: Record<string, Partial<Love>> = {}, more: Partial<SaveV4> = {}): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: DAY }, gold: 50_000 }
  const joined = joinOpening(readScene(fresh, 'scene:1:open'), fixture.pack!)
  const loves = Object.fromEntries(Object.entries(love).map(([id, l]) => [id, { ...joined.love[id]!, ...l }]))
  return { ...joined, arrivals: [ONE, TWO, THREE], today: { ...joined.today, bonds: {} }, love: { ...joined.love, ...loves }, ...more }
}
/** 9000001 married on day 2 and housed in the Farmhouse. */
const wedOne = (love: Partial<Love> = {}): SaveV4 => moveSpouse(farm({ [ONE]: { stage: 'spouse', level: 0, points: 0, wed: 2, ...love } }), ONE, 0)

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
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const until = async (ok: () => boolean, tries = 150) => {
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
/** Types into a controlled input. */
async function type(input: HTMLInputElement, value: string) {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    set.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
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
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('the homestead on the map', () => {
  it('adds the Farmhouse and the first row\'s lots after the yard, the town edge last; a built house\'s pips are its residents', () => {
    const one = wedOne()
    const layout = homesteadLayout(one)
    expect(layout).toEqual({ tiles: FARM_MAP_TILES + 4, townRow: 9 })
    const places = homesteadPlaces(one, layout, new Set([ONE]))
    expect(places.map((p) => [p.id, p.name, p.locked])).toEqual([['farmhouse', 'Farmhouse', false], ['house-1', 'Build · 8,000g', true], ['house-2', 'House 2', true]])
    expect(places[2]!.label).toBe('House 2, locked: Opens with your second wedding')
    expect(places[0]!.pips?.map((p) => [p.state, p.badge])).toEqual([['busy', '♥'], ['free', undefined]])
    expect(places[0]!.to).toBe('/?sheet=homestead&house=0')
    const shop = FARM_PLACES.find((p) => p.id === 'shop')!
    expect(placeOnV4(shop, layout)).toEqual({ row: 9, col: 0 })
    expect(placeOnV4(FARM_PLACES.find((p) => p.id === 'dorm')!, layout)).toMatchObject({ row: 6, col: 2 })
    // Before the first wedding the lot waits; with two houses built and one married the map holds one homestead row: the
    // second's lots show from three married.
    expect(homesteadPlaces(farm(), homesteadLayout(farm()), new Set())[1]).toMatchObject({ name: 'House 1', locked: true, label: 'House 1, locked: Opens with your first wedding' })
    const three = { ...one, homestead: { ...one.homestead, houses: [...one.homestead.houses, { name: 'Rose Cottage', extended: false }, { name: 'Willow House', extended: true }], slept: [0, 0, 0] } }
    expect(homesteadLayout(three).townRow).toBe(9)
    expect(homesteadPlaces(three, homesteadLayout(three), new Set()).map((p) => p.id)).toEqual(['farmhouse', 'house-1', 'house-2'])
  })

  it('places the eight rows on 36 tiles before the homestead grows them', () => {
    expect(FARM_MAP_TILES).toBe(36)
    expect(FARM_PLACES.map((p) => placeAt(p))).toEqual(FARM_PLACES.map((p) => ({ x: [0.2, 0.5, 0.8][p.col], y: (3 + (p.row - 1) * 4 + 0.5) / 36 })))
  })
})

describe('the homestead\'s sheet', () => {
  it('builds and names House 1, which stands at once, then moves her there with a tap on her face and a free room', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: wedOne() })
    await render(<p />, '/?sheet=homestead&house=1')
    await find('[data-homestead]')
    expect($('[data-married]')?.textContent).toBe('Married 1/3 · 1/2 rooms')
    expect($$('[data-house-name]').map((n) => n.textContent)).toEqual(['Farmhouse'])
    expect($('[data-lot="1"] [data-action="build"]')?.textContent).toBe('Build · 8,000g')
    await type($('[data-house-field]') as HTMLInputElement, 'Rose 7')
    expect($('[data-house-why]')?.textContent).toBe('Letters, spaces, \' and - only')
    expect(($('[data-action="build"]') as HTMLButtonElement).disabled).toBe(true)
    await type($('[data-house-field]') as HTMLInputElement, 'Rose Cottage')
    await click($('[data-action="build"]'))
    await until(() => $('[data-homestead-note]')?.textContent === 'Built. It stands already.')
    expect(save().homestead.houses[1]).toEqual({ name: 'Rose Cottage', extended: false })
    expect(save().gold).toBe(42_000)
    expect($$('[data-house-name]').map((n) => n.textContent)).toEqual(['Farmhouse', 'Rose Cottage'])
    expect($('[data-lot="2"] [data-lot-locked]')?.textContent).toBe('Opens with your second wedding. · Build · 20,000g')
    // A move: her face, then a free room in Rose Cottage.
    await click($(`[data-house="0"] [data-room="${ONE}"]`))
    expect($('[data-homestead-note]')?.textContent).toContain('tap a free room')
    await click($('[data-house="1"] [data-room="free"]'))
    await until(() => save().love[ONE]!.house === 1 && !($('[data-house="1"] [data-action="extend"]') as HTMLButtonElement).disabled)
    expect(save().gold).toBe(42_000)
    expect($('[data-house="1"] [data-house-count]')?.textContent).toBe('1/2')
    // Extend: two more rooms at once.
    await click($('[data-house="1"] [data-action="extend"]'))
    await until(() => save().homestead.houses[1]!.extended)
    expect($('[data-house="1"] [data-house-count]')?.textContent).toBe('1/4')
  })

  it('swaps two spouses with a tap on one face and then the other\'s', async () => {
    let two = moveSpouse({ ...wedOne(), love: { ...wedOne().love, [TWO]: { ...wedOne().love[TWO]!, stage: 'spouse', level: 0, points: 0, wed: 3 } } }, TWO, 0)
    two = { ...two, homestead: { ...two.homestead, houses: [...two.homestead.houses, { name: 'Rose Cottage', extended: false }], slept: [0, 0] } }
    two = moveSpouse(two, TWO, 1)
    useGame.setState({ uid: 'u1', status: 'ready', save: two })
    await render(<p />, '/?sheet=homestead')
    await click(await find(`[data-room="${ONE}"]`))
    await click($(`[data-room="${TWO}"]`))
    await until(() => save().love[ONE]!.house === 1 && save().love[TWO]!.house === 0)
    expect($('[data-needs]')?.textContent).toBe('Needs a room: none')
  })

  it('says "Opens with your first wedding" before anyone is married', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<p />, '/?sheet=homestead')
    expect((await find('[data-lot-locked]')).textContent).toBe('Opens with your first wedding. · Build · 8,000g')
    expect($('[data-action="build"]')).toBeNull()
  })
})

describe('Tonight\'s Sleep at', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v), removeItem: (k: string) => void items.delete(k) })
    setAskBeforeEnd(true)
  })

  it('opens once anyone is married, the default marked; a tap picks the house at once', async () => {
    let one = wedOne({ level: 1 })
    one = { ...one, homestead: { ...one.homestead, houses: [...one.homestead.houses, { name: 'Rose Cottage', extended: false }], slept: [DAY - 1, 0] } }
    one = moveSpouse({ ...one, love: { ...one.love, [TWO]: { ...one.love[TWO]!, stage: 'spouse', level: 0, points: 0, wed: 3 } } }, TWO, 1)
    useGame.setState({ uid: 'u1', status: 'ready', save: one })
    await render(<p />, '/?sheet=end')
    await find('[data-sleep-at]')
    expect($$('[data-sleep]').map((r) => [r.dataset.sleep, r.textContent])).toEqual([
      ['house:0', '⌂Farmhouse· 1 home · ☕'],
      ['house:1', '⌂Rose Cottage· 1 home'],
    ])
    // Rose Cottage never slept in: the default.
    expect($('[data-sleep][data-picked]')?.dataset.sleep).toBe('house:1')
    await click($('[data-sleep="house:0"]'))
    await until(() => save().homestead.tonight === 0)
    expect($('[data-sleep][data-picked]')?.dataset.sleep).toBe('house:0')
    expect($('[data-end-line]')).not.toBeNull()
  })

  it('offers her room on a birthday-alone wisher\'s birthday', () => {
    const one = wedOne()
    const birthdays = new Map([[ONE, one.calendar.day]])
    const rows = sleepViews(one, fixture.pack!, birthdays, () => 'Stand-in 1')
    expect(rows.map((r) => [r.key, r.name, r.home])).toEqual([['house:0', 'Farmhouse', '· 1 home'], [`room:${ONE}`, 'Her room', '· Stand-in 1, just you two']])
  })
})

describe('the morning', () => {
  it('says the house\'s morning with its house line, and a house that misses you with Tonight › and Another night', async () => {
    const one = wedOne()
    const house: HouseLine = { kind: 'house', house: 0, umas: [ONE], paid: 30, breakfast: 3, items: 1 }
    const morning: SaveV4 = { ...one, summary: { day: DAY, bin: [], work: [], ranks: [], hearts: [house, { kind: 'misses', house: 0 }], news: [{ kind: 'household', married: 1 }], nudges: [] } }
    const home = homeWords(morning, fixture.pack!, () => 'Stand-in 1', () => 'steady')
    const parts = summaryParts(morning.summary!, () => 'Stand-in 1', [], null, home)
    const hearts = parts.find((p) => p.section === 'hearts')!.lines
    expect(hearts[0]).toMatchObject({ key: 'house', text: '⌂ Farmhouse · Stand-in 1 · ♥ +30 · ☕ 3 fed · +1 item', to: '/?sheet=homestead&house=0' })
    expect(fixture.pack!.household!.houseLines![ONE]!.map((l) => `Stand-in 1: “${l.replaceAll('{farmer}', 'Robin')}”`)).toContain(hearts[0]!.quote)
    expect(hearts[1]).toMatchObject({ key: 'misses', text: '⌂ Farmhouse misses you', misses: 0 })
    expect(parts.find((p) => p.section === 'news')!.lines[0]).toMatchObject({ text: 'Married 1 · The homestead opens, and the night’s house', tag: 'Household' })
    // On the card: Tonight › picks it.
    useGame.setState({ uid: 'u1', status: 'ready', save: morning })
    const { default: HouseAnswer } = await import('./HouseAnswer')
    await render(<HouseAnswer house={0} />, '/')
    await click(await find('[data-action="misses-tonight"]'))
    await until(() => save().homestead.tonight === 0)
    expect($('[data-misses-answer]')?.dataset.missesAnswer).toBe('tonight')
  })

  it('shows a night level\'s card at ?level=, and closes a stale one', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: wedOne({ level: 2, morning: DAY }) })
    await render(<p />, `/?level=${ONE}:s2`)
    await find('[data-night-level="s2"] [data-level-up="s2"]')
    expect($('[data-sum]')?.textContent).toBe('Her bar filled overnight: no event, the level comes by itself · now toward Spouse 3')
    expect($('[data-card-perk]')?.textContent).toContain('Perk')
    await click($('[data-action="continue"]'))
    await until(() => !$('[data-night-level]'))
    await render(<p />, `/?level=${ONE}:s4`)
    await until(() => path === '/')
  })
})

describe('household scenes', () => {
  it('plays the scene with each spouse\'s beat, reads it once, and replays from the Diary without reading again', async () => {
    let five = wedOne()
    const ids = ['9000004', '9000005', '9000006', '9000007']
    five = {
      ...five, roster: { ...five.roster, ...Object.fromEntries(ids.map((id) => [id, newRosterUma(1)])) },
      love: { ...five.love, ...Object.fromEntries(ids.map((id) => [id, { ...newLove(), stage: 'spouse' as const, level: 0, wed: 5 }])) },
      homestead: { ...five.homestead, married: 5, furniture: [null, null, null, null, null] }, arrivals: [...five.arrivals, ...ids],
    }
    useGame.setState({ uid: 'u1', status: 'ready', save: five })
    await render(<HeartsPage />, '/hearts')
    await click(await find('[data-household-ready="household:5"]'))
    expect(path).toBe('/hearts?household=household:5')
    await find('[data-scene="household:5:0"]')
    expect($('[data-scene-title]')?.textContent).toBe('Household scene 1 · Orchard bench')
    // open, 9000001's beat (the invented spouses have none), close.
    for (let i = 0; i < 12 && !$('[data-scene="household:5:2"]'); i++) await click($('[data-beat]'))
    await find('[data-scene="household:5:2"]')
    await click($('[data-action="skip"]'))
    await until(() => save().diary.read.includes('household:5'))
    expect(path).toBe('/hearts')
    expect($('[data-household-ready]')).toBeNull()
    await render(<p />, '/diary?household=household:5&replay=1')
    await find('[data-scene="household:5:0"]')
    await click($('[data-action="skip"]'))
    await until(() => !$('[data-scene]'))
    expect(save().diary.read.filter((r) => r === 'household:5')).toHaveLength(1)
  })
})

describe('her room on her profile', () => {
  it('names her house, or says she needs a room, and softly her wish', async () => {
    const waiting = farm({ [ONE]: { stage: 'spouse', level: 0, points: 0, wed: 2 }, [TWO]: { stage: 'spouse', level: 0, points: 0, wed: 3 }, [THREE]: { stage: 'spouse', level: 0, points: 0, wed: 4 } })
    const full = moveSpouse(moveSpouse(waiting, TWO, 0), THREE, 0)
    useGame.setState({ uid: 'u1', status: 'ready', save: full })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-profile-line]')).textContent).toContain('Needs a room · She’d love her own house')
    await render(<HeartsPage />, `/hearts?uma=${TWO}`)
    expect((await find('[data-profile-line]')).textContent).toContain('Farmhouse')
  })
})

describe('before anyone is married', () => {
  it('plays no household scene: a stale ?household= closes', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<p />, '/?household=finale')
    await settle()
    expect($('[data-scene]')).toBeNull()
  })
})
