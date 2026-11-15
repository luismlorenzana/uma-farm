// Married life on screen: the homestead's rows on the map,
// building and naming House 1 on the homestead's sheet, a move and a swap, the wedding's room on Married, Tonight's companion,
// the morning's house line and "misses you", a night level's card, a household scene played and read, and her room on her
// profile. The invented stand-in
// pack (9000001–9000003) and invented outfits; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { homesteadShown, inviteToFarm, meet, moveSpouse, newLove, newRosterUma, newSave, readScene, type HouseLine, type Love, type SaveV4, type StoryPack } from '@farm/domain'
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
const { mapLots } = await import('./farm-map')
const { houseLot } = await import('./homestead-map')
const { companionViews, homeWords } = await import('./homestead-view')
const { summaryParts } = await import('./summary-words')
const { setAskBeforeEnd } = await import('./ask')

/** The stand-in's three home, ties seeded, as if met: the opening brings nobody, and day 1's visitor waits at the Gate. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : inviteToFarm(meet(s, id, pack).save, id)), save)
const AT = '2026-11-11T10:00:00.000Z'
const DAY = 30
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 30, the stand-in's three home (`joinStandIns`) and their arrivals played; `love` by id. */
function farm(love: Record<string, Partial<Love>> = {}, more: Partial<SaveV4> = {}): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: DAY }, gold: 50_000 }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), fixture.pack!)
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
  it('stands the Farmhouse and the first lots beside the yard, a built house with its residents; more lots from three married', () => {
    const one = wedOne()
    const shown = homesteadShown(one)
    const places = shown.map((place) => houseLot(one, place, (id) => (id === ONE ? 'Stand-in 1' : 'An Uma')))
    expect(places.map((p) => [p.id, p.name, p.locked])).toEqual([['farmhouse', 'Farmhouse', false], ['house-1', 'Build · 8,000g', true], ['house-2', 'House 2', true]])
    expect(places[2]!.label).toBe('House 2, locked: Opens with your second wedding')
    expect(places[0]).toMatchObject({ residents: [ONE], rooms: '1/2', to: '/?sheet=homestead&house=0', label: 'Farmhouse, 1 of 2 rooms: Stand-in 1' })
    // Its column stands after the yard's.
    const { lots } = mapLots(shown)
    expect(lots.slice(3, 6).map((l) => (l.kind === 'house' ? l.place.id : l.id))).toEqual(['farmhouse', 'house-1', 'house-2'])
    // Before the first wedding the lot waits; with two houses built and one married the map holds one homestead column:
    // the second's lots show from three married.
    expect(houseLot(farm(), homesteadShown(farm())[1]!)).toMatchObject({ name: 'House 1', locked: true, label: 'House 1, locked: Opens with your first wedding' })
    const three = { ...one, homestead: { ...one.homestead, houses: [...one.homestead.houses, { name: 'Rose Cottage', extended: false }, { name: 'Willow House', extended: true }], slept: [0, 0, 0] } }
    expect(homesteadShown(three).map((p) => p.id)).toEqual(['farmhouse', 'house-1', 'house-2'])
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

describe('Tonight\'s companion', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v), removeItem: (k: string) => void items.delete(k) })
    setAskBeforeEnd(true)
  })

  it('opens once anyone is married, the default marked; a tap picks her at once, and her house is tonight\'s', async () => {
    let one = wedOne({ level: 1 })
    one = { ...one, homestead: { ...one.homestead, houses: [...one.homestead.houses, { name: 'Rose Cottage', extended: false }], slept: [DAY - 1, 0] } }
    one = moveSpouse({ ...one, love: { ...one.love, [TWO]: { ...one.love[TWO]!, stage: 'spouse', level: 0, points: 0, wed: 3 } } }, TWO, 1)
    useGame.setState({ uid: 'u1', status: 'ready', save: one })
    await render(<p />, '/?sheet=end')
    await find('[data-tonight-with]')
    expect($$('[data-companion]').map((r) => [r.dataset.companion, r.textContent])).toEqual([
      [ONE, 'Stand-in 1⌂Farmhouse · ☕'],
      [TWO, 'Stand-in 2⌂Rose Cottage'],
    ])
    // Rose Cottage never slept in: its resident is the default.
    expect($('[data-companion][data-picked]')?.dataset.companion).toBe(TWO)
    await click($(`[data-companion="${ONE}"]`))
    await until(() => save().homestead.companion === ONE)
    expect(save().homestead.tonight).toBe(0)
    expect($('[data-companion][data-picked]')?.dataset.companion).toBe(ONE)
    expect($('[data-end-line]')).not.toBeNull()
  })

  it('makes it her room on a birthday-alone wisher\'s birthday', () => {
    const one = wedOne()
    const birthdays = new Map([[ONE, one.calendar.day]])
    const rows = companionViews(one, fixture.pack!, birthdays, () => 'Stand-in 1')
    expect(rows.map((r) => [r.id, r.home, r.alone, r.picked])).toEqual([[ONE, 'Her room · her birthday, just you two', true, true]])
    expect(companionViews(one, fixture.pack!, new Map(), () => 'Stand-in 1').map((r) => [r.home, r.alone])).toEqual([['Farmhouse', false]])
  })
})

describe('married life: the night\'s companion and the household\'s meals', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v), removeItem: (k: string) => void items.delete(k) })
    setAskBeforeEnd(true)
  })

  it('ends the day with her as the night\'s companion, and she greets you in the morning in a short scene', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: wedOne() })
    await render(<p />, '/?sheet=end')
    await find(`[data-companion="${ONE}"][data-picked]`)
    await click($('[data-action="end-day"]'))
    await until(() => save().calendar.day === DAY + 1, 300)
    // The morning comes up on her greeting: in pajamas, her temperament's line.
    await find('[data-life="morning"]')
    expect(path).toBe(`/?life=morning:${ONE}`)
    expect($('[data-scene-title]')?.textContent).toBe('Morning · Stand-in 1')
    await until(() => $('[data-life="morning"] [data-portrait]') !== null)
    expect($('[data-life="morning"] [data-portrait]')?.dataset.portrait).toBe('pajamas-playful')
    expect(save().love[ONE]!.night).toBe(DAY)
    await click($('[data-action="skip"]'))
    await until(() => path === '/')
    // The morning's first line: a tap plays her greeting again.
    const parts = summaryParts(save().summary!, () => 'Stand-in 1', [], null, homeWords(save(), fixture.pack!, () => 'Stand-in 1', () => 'steady'))
    expect(parts.find((p) => p.section === 'hearts')!.lines[0]).toMatchObject({ key: 'morning', text: '☾ Morning with Stand-in 1', to: `/?life=morning:${ONE}`, tag: 'Play' })
  }, 20_000)

  it('cooks a meal from the homestead: an action, everyone at the table fed and pleased, and her line as you sit down', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: wedOne() })
    await render(<p />, '/?sheet=homestead')
    await find('[data-meals]')
    expect($('[data-action="cook-breakfast"]')?.textContent).toBe('Breakfast · 1')
    const before = save().love[TWO]!.points
    await click($('[data-action="cook-breakfast"]'))
    await until(() => (save().today.meals ?? []).includes('breakfast'))
    expect(save().today.actions).toBe(1)
    expect(save().love[TWO]!.points - before).toBe(10)
    expect(save().roster[THREE]!.wellFed).toBe(2)
    await find('[data-life="breakfast"]')
    expect(decodeURIComponent(path)).toBe(`/?sheet=homestead&life=breakfast:${ONE}`)
    expect($('[data-scene-title]')?.textContent).toBe('Breakfast · Stand-in 1')
    await click($('[data-action="skip"]'))
    await until(() => path === '/?sheet=homestead')
    expect($('[data-action="cook-breakfast"]')?.textContent).toBe('Breakfast ✓')
    expect(($('[data-action="cook-breakfast"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('plays her moving in from the morning\'s line when she took a room overnight', async () => {
    // A stale link (no wedding today, no "moved into" this morning) plays nothing.
    useGame.setState({ uid: 'u1', status: 'ready', save: wedOne() })
    await render(<p />, `/?stale=1&life=moving-in:${ONE}`)
    await until(() => path === '/?stale=1')
    expect($('[data-life]')).toBeNull()
    // The morning she took a room: its line plays her moving in.
    const moved: SaveV4 = { ...wedOne(), summary: { day: DAY, bin: [], work: [], ranks: [], hearts: [{ kind: 'moved', id: ONE, house: 0 }], news: [], nudges: [] } }
    useGame.setState({ uid: 'u1', status: 'ready', save: moved })
    await render(<p />, `/?life=moving-in:${ONE}`)
    await find('[data-life="moving-in"]')
    expect($('[data-scene-title]')?.textContent).toBe('Moving in · Stand-in 1')
    expect($('[data-step] [data-line]')?.dataset.line).toBe('A cart of her things rolls up the lane to the farm.')
    const parts = summaryParts({ day: DAY, bin: [], work: [], ranks: [], hearts: [{ kind: 'moved', id: ONE, house: 0 }], news: [], nudges: [] }, () => 'Stand-in 1', [], null, homeWords(wedOne(), fixture.pack!, () => 'Stand-in 1', () => 'steady'))
    expect(parts.find((p) => p.section === 'hearts')!.lines[0]).toMatchObject({ text: '⌂ Stand-in 1 moved into Farmhouse', to: `/?life=moving-in:${ONE}`, tag: 'Play' })
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

  it('plays a night level\'s scene at ?level=, then its card, and closes a stale one', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: wedOne({ level: 2, morning: DAY }) })
    await render(<p />, `/?level=${ONE}:s2`)
    // Her S2: the default story's (the stand-in route writes none), first.
    await find('[data-night-scene="s2"]')
    expect($('[data-scene-title]')?.textContent).toBe('Spouse 2 · Stand-in 1')
    expect($('[data-step] [data-line]')?.dataset.line).toBe('She brings lunch out to you at noon.')
    await click($('[data-action="skip"]'))
    await find('[data-night-level="s2"] [data-level-up="s2"]')
    expect($('[data-sum]')?.textContent).toBe('Her bar filled overnight · now toward Spouse 3')
    expect($('[data-card-line]')?.textContent).toBe('“Sit with me a minute. The work will wait.”')
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

describe('scene links play only what the game has given you', () => {
  it('closes each stale or typed link quietly: no scene, no pay, no picture, the save untouched', async () => {
    // 9000001 married (day 2) and housed; 9000002 a new friend at F0; nothing cooked, no night together, no event Ready.
    const start = wedOne({ points: 10 })
    const links = [
      `life=morning:${ONE}`, `life=moving-in:${ONE}`, `life=invited-to-work:${TWO}`, `life=breakfast:${ONE}`, `life=dinner:${ONE}`,
      `event=${TWO}`, `ask=${TWO}`, `memory=${TWO}:f5`, `evening=${TWO}`, `occasion=${TWO}`, 'household=household:5', `level=${ONE}:s2`,
      'life=morning:9000009', 'event=9000009',
    ]
    for (const [n, link] of links.entries()) {
      useGame.setState({ uid: 'u1', status: 'ready', save: start })
      await render(<p />, `/?stale=${n}&${link}`)
      await until(() => path === `/?stale=${n}`)
      await settle()
      expect($('[data-life]'), link).toBeNull()
      expect($('[data-event-player]'), link).toBeNull()
      expect($('[data-evening-kinds]'), link).toBeNull()
      expect($('[data-evening-picker]'), link).toBeNull()
      expect($('[data-scene]'), link).toBeNull()
      expect(save(), link).toBe(start)
    }
  }, 30_000)

  it('plays the invitation to work and a meal\'s line the moment the game gives them', async () => {
    const one = wedOne()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...one, roster: { ...one.roster, [TWO]: { ...one.roster[TWO]!, farmhand: DAY } } } })
    await render(<p />, `/?life=invited-to-work:${TWO}`)
    await find('[data-life="invited-to-work"]')
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...one, today: { ...one.today, meals: ['dinner'] } } })
    await render(<p />, `/?life=dinner:${ONE}`)
    await find('[data-life="dinner"]')
  })
})
