// The town map as rendered: the Town on the farm map's last row opening `/town`; going in for one of the day's actions;
// the map's places in their groups, walking between them free, who's at each now; an Uma with a routine where it says;
// her menu on the dialogue engine: introducing yourself (her meeting scene plays), a talk and a gift, each an action;
// one of the town's people at her post with her post's menu and her ties; the People list finding anyone by name, with
// where she is today; and a scene's line by the town's smith in her master-data name. Invented outfits (the album
// fixture: 90001–90006, named Aster to Fable) and an invented pack with a town.json; master data and the server are
// stubs.
import 'fake-indexeddb/auto'
import { addGoods, farmDay, newRosterUma, newSave, readScene, readStoryPack, storyOf, townDay, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined, setMasterLens: () => undefined,
}))
vi.mock('../story/load', async (importOriginal) => ({ ...await importOriginal<typeof import('../story/load')>(), loadStoryPack: async () => fixture.pack }))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: { name: 'Owner' } }),
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { Shell } = await import('../shell/Shell')
const { storyReady } = await import('../story/story')
const { castLens, masterCast } = await import('../story/load')
const { namer } = await import('../story/people')
const { default: TownPage } = await import('./TownPage')
const { findPeople, peopleRows, sortPeople } = await import('./town-view')
const { loopMenuGroups } = await import('../shell/MenuSheet')

const AT = '2026-11-13T10:00:00.000Z'
const SISTER = 's81002'
/** The pack: Aster (90001) favours the café and, by her routine, bakes at the bakery on each season's 4th; Fable (90006)
 * is the town's smith and keeps the café, tied to Aster; a sister of Beryl's (her outfit 81002) is in the cast by her own
 * name. The roles town.json leaves go to master data's others, from the last: Ember (90005) the mayor, Dune the
 * shopkeeper, Cinder the farm's last keeper, Beryl the rancher; the rest stay unplayed. So Aster and the sister live in
 * town, and with so few both are out every day. */
const FILES = {
  cast: { umas: [{ characterId: '90001', spot: 'cafe', routine: [{ at: 'bakery', days: [4] }] }, { characterId: SISTER, name: 'Invented Sister' }] },
  ties: { ties: [{ a: '90001', b: '90006', line: 'Invented tie line.' }] },
  umas: { 90001: { townLines: ['An invented hello, {farmer}.'] } }, routes: {},
  town: {
    people: [{ characterId: '90006', game: 'ida-stone', does: 'Invented smith.' }], spots: [{ id: 'cafe', name: 'Invented Café', keeper: '90006' }],
    locations: [{ id: 'bakery', name: 'Invented Bakery', line: 'Warm bread.', kind: 'work' }],
  },
}
const save = (): SaveV4 => useGame.getState().save as SaveV4
/** A farm already in town today (going in takes one of the day's actions). */
const farm = (day = 5): SaveV4 => {
  const base = readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open')
  return { ...base, calendar: { day }, today: { ...base.today, town: true } }
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
  await act(async () => root.render(
    <MemoryRouter key={at} initialEntries={[at]}>
      <Routes><Route element={<Shell />}><Route path="*" element={<>{node}<Where /></>} /></Route></Routes>
    </MemoryRouter>,
  ))
  await settle()
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 150 && !ok(); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
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
const type = async (el: HTMLElement | null, text: string) => {
  const input = el as HTMLInputElement
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle()
}

beforeAll(async () => {
  const view = (await albumFixture()).view
  fixture.pack = storyOf(readStoryPack(FILES).pack, masterCast(view))
  const pack = await storyReady()
  fixture.view = castLens(pack)(view)
})
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
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

describe('the town', () => {
  it('stands among the town\'s places, open from day 1, and opens its screen', () => {
    const town = loopMenuGroups(farm()).find((g) => g.key === 'town')!
    expect(town.places.map((p) => [p.key, p.to, p.locked])).toEqual([
      ['shop', '/?sheet=shop', false], ['festival', '/?peek=festival', true], ['expeditions', '/?peek=expeditions', true], ['town', '/town', false],
    ])
  })

  it('takes one of the day\'s actions to go in, then stays open all day', async () => {
    const home = farm()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...home, today: { ...home.today, town: false } } })
    await render(<TownPage />, '/town')
    expect($('[data-town-today]')).toBeNull()
    await click(await find('[data-action="into-town"]'))
    await until(() => save().today.town === true)
    expect(save().today.actions).toBe(1)
    await find('[data-town-today]')
    expect($('[data-action="shop"]')).not.toBeNull()
  })

  it('shows the map\'s places in their groups; walking between them is free, and each lists who\'s there now', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<TownPage />, '/town')
    await find('[data-town-map]')
    expect($$('[data-map-group]').map((g) => g.dataset.mapGroup)).toEqual(['spots', 'shops', 'work'])
    expect($$('[data-location]').map((l) => l.dataset.location)).toEqual(['plaza', 'market', 'cafe', 'harbour', 'library', 'track', 'store', 'rancher', 'mayor', 'smith', 'bakery'])
    // You arrive at the Plaza.
    expect($('[data-location][data-at]')?.dataset.location).toBe('plaza')
    expect($('[data-place-name]')?.textContent).toBe('The Plaza')
    // Both who live in town are out, somewhere; the counts add up.
    expect($('[data-out]')?.dataset.out).toBe('2')
    expect($$('[data-location]').reduce((n, l) => n + Number(l.dataset.hereCount), 0)).toBe(2)
    const sister = townDay(farm(), fixture.pack!).where.get(SISTER)!
    await click($(`[data-location="${sister}"]`))
    expect(path).toBe(`/town?at=${sister}`)
    expect(save().today.actions).toBe(0)
    expect($$('[data-place-panel] [data-person]').map((p) => p.dataset.person)).toContain(SISTER)
    expect($(`[data-person="${SISTER}"]`)?.textContent).toBe('Invented Sister')
    // The café: Fable keeps it, at her post.
    await click($('[data-location="cafe"]'))
    expect($('[data-place-name]')?.textContent).toBe('Invented Café')
    expect($('[data-keeper]')?.textContent).toBe('Fable · The smith')
    // The general store: its keeper sells seeds; the mayor's office takes build orders and lends toward them.
    await click($('[data-location="store"]'))
    expect($('[data-keeper]')?.textContent).toBe('Dune · The shopkeeper')
    expect($('[data-post-item="seeds"]')?.getAttribute('href')).toBe('/town?at=store&sheet=shop')
    await click($('[data-location="mayor"]'))
    expect($('[data-keeper]')?.textContent).toBe('Ember · The mayor')
    expect($$('[data-post-item]').map((p) => [p.dataset.postItem, p.getAttribute('href')])).toEqual([['build', '/town?at=mayor&sheet=mayor'], ['loan', '/town?at=mayor&sheet=mayor']])
    // The plaza's keeper is at her office, so the plaza shows none.
    await click($('[data-location="plaza"]'))
    expect($('[data-keeper]')).toBeNull()
  })

  it('at the mayor\'s office, borrows toward the Mill, builds it on the loan, and repays it', async () => {
    const day = 5
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(day), gold: 640, items: addGoods(farm(day).items, 'pine-log', 1, 20) } })
    await render(<TownPage />, '/town?at=mayor')
    await click(await find('[data-post-item="build"]'))
    expect(path).toBe('/town?at=mayor&sheet=mayor')
    await find('[data-mayor]')
    // The Mill, short 360g: the office lends 400g. The Dorm's level 2 too, short 360g.
    expect($$('[data-order]').map((o) => [o.dataset.order, o.dataset.borrow])).toEqual([['mill', '400'], ['dorm:2', '400']])
    expect($('[data-order="mill"] [data-order-terms]')?.textContent).toBe('Need 360g more · 440g owed, a tenth a night from income')
    expect($('[data-terms]')?.textContent).toContain('Up to 1,000g at Farm Rank 1')
    expect($('[data-no-loans]')?.textContent).toBe('No loans.')
    await click($('[data-order="mill"] [data-action="borrow"]'))
    await until(() => save().farm.loans.length === 1)
    expect(save()).toMatchObject({ gold: 40, farm: { builds: ['mill'], loans: [{ for: 'mill', lent: 400, fee: 40, owed: 440, nightly: 45 }] } })
    expect(save().today.actions).toBe(0)
    await until(() => $('[data-mayor-note]')?.textContent === 'The Mill stands tomorrow, on a loan.')
    expect($('[data-order="mill"]')?.textContent).toContain('Builds tonight')
    // One loan at a time: the Dorm waits.
    expect($('[data-order="dorm:2"] [data-order-why]')?.textContent).toBe('One loan at a time: this one first.')
    expect($('[data-office-loan="mill"]')?.textContent).toContain('440g owed · 45g a night · clears in about 10 nights (Summer 3)')
    expect($('[data-office-loan="mill"] [data-action="repay"]')?.textContent).toBe('Repay · need 400g more')
    // With the gold, repay it all.
    await act(async () => useGame.setState({ save: { ...save(), gold: 500 } }))
    await click($('[data-office-loan="mill"] [data-action="repay"]'))
    await until(() => save().farm.loans.length === 0)
    expect(save().gold).toBe(60)
  })

  it('puts an Uma with a routine where it says', async () => {
    const day = farmDay({ year: 1, season: 'summer', day: 4 })
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(day) })
    await render(<TownPage />, '/town?at=bakery')
    await find('[data-place-panel="bakery"]')
    expect($('[data-location="bakery"]')?.dataset.hereCount).toBe('1')
    expect($$('[data-place-panel] [data-person]').map((p) => p.dataset.person)).toEqual(['90001'])
  })

  it('introduce yourself, talk and give a gift, each an action: her meeting scene plays, and the save keeps the days', async () => {
    const day = 5
    const at = townDay(farm(day), fixture.pack!).where.get(SISTER)!
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(day), items: addGoods(farm(day).items, 'carrot', 1, 1) } })
    await render(<TownPage />, `/town?at=${at}`)
    await click(await find(`[data-person="${SISTER}"]`))
    expect(path).toBe(`/town?at=${at}&uma=${SISTER}`)
    await find(`[data-her-menu="${SISTER}"]`)
    expect($('[data-standing]')?.textContent).toBe('Not met yet')
    expect($('[data-menu]')?.dataset.menu).toBe('introduce')
    expect($('[data-item="introduce"]')?.textContent).toBe('Introduce yourself · 1 action')
    await click($('[data-action="menu-introduce"]'))
    await until(() => !!save().roster[SISTER])
    expect(save().today.actions).toBe(1)
    expect(save().dorm.home).toEqual([])
    // Her meeting scene plays over the town: the default's, in town.
    await find(`[data-scene="arrival:${SISTER}"]`)
    expect($('[data-scene-title]')?.textContent).toBe('Meeting Invented Sister · Town')
    await click($('[data-action="skip"]'))
    await click($('[data-option="0"]'))
    for (let i = 0; i < 10 && !$('[data-arrival-done]'); i++) await click($('[data-beat]'))
    expect($('[data-lives]')?.textContent).toBe('She lives in town: find her there.')
    await click($('[data-action="welcome"]'))
    await until(() => save().arrivals.includes(SISTER))
    // Met: talk, a gift, her hangout (from Friendship 2), and the invitation to work, coming.
    await find('[data-menu="talk gift hangout work"]')
    expect($('[data-standing]')?.textContent).toBe('New friend')
    expect($('[data-item="work"]')?.dataset.why).toBe('Coming with the farmhands')
    await click($('[data-action="menu-talk"]'))
    await until(() => save().today.chats.includes(SISTER))
    expect(save().today.actions).toBe(2)
    expect(save().town[SISTER]).toEqual({ talks: 1, last: day, gift: 0 })
    await until(() => $('[data-paid]')?.textContent === '+15 ♥')
    expect($('[data-item="talk"]')?.dataset.why).toBe('Talked today ✓')
    await click($('[data-action="menu-gift"]'))
    await click(await find('[data-gift="carrot@1"]'))
    await until(() => save().today.gifts.includes(SISTER))
    expect(save().today.actions).toBe(3)
    expect(save().town[SISTER]).toEqual({ talks: 1, last: day, gift: day })
    await until(() => $('[data-item="gift"]')?.dataset.why === 'Gift given today ✓')
    // Back to where she is.
    await click($('[data-action="back"]'))
    expect($('[data-her-menu]')).toBeNull()
  })

  it('opens a keeper at her post: her role and her ties, and counts nothing', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<TownPage />, '/town?uma=90006')
    await find('[data-keeper-menu="90006"]')
    expect($('[data-her-where]')?.textContent).toBe('Invented Café')
    expect($('[data-keeper-role]')?.textContent).toBe('The smithInvented smith.')
    expect($('[data-keeper-tie="90001"]')?.textContent).toBe('Aster · Invented tie line.')
    await settle()
    expect(save().town).toEqual({})
    expect(save().today.actions).toBe(0)
  })

  it('lists everyone in People, met or not, with where she is today, and finds anyone by name', async () => {
    const met = { ...farm(), roster: { 90001: newRosterUma(1) }, dorm: { level: 1, home: ['90001'], swaps: [] } }
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<TownPage />, '/town?view=people')
    await find('[data-people]')
    // Aster, the sister, and the town's five people.
    expect($('[data-people]')?.dataset.people).toBe('7')
    const rows = $$('[data-person-row]')
    expect(rows[0]?.dataset.personRow).toBe('90001')
    expect(rows[0]?.textContent).toBe('AsterOn the farmMet')
    expect($(`[data-person-row="${SISTER}"]`)?.textContent).toMatch(/^Invented SisterAt [A-Za-z ’]+ today$/)
    expect($('[data-person-row="90006"]')?.textContent).toBe('FableAt Invented Café, most days · The smith')
    expect($('[data-person-row="90002"]')?.textContent).toBe('BerylAt the Rancher’s, most days · The rancher')
    await type($('[data-search]'), 'invented sis')
    expect($$('[data-person-row]').map((r) => r.dataset.personRow)).toEqual([SISTER])
    // A tap goes to her, where she is.
    await click($(`[data-person-row="${SISTER}"]`))
    expect(path).toContain(`uma=${SISTER}`)
    expect(path).toContain(`at=${townDay(met, fixture.pack!).where.get(SISTER)}`)
    await render(<TownPage />, '/town?view=people')
    await type(await find('[data-search]'), 'nobody')
    expect($('[data-none]')?.textContent).toBe('No one by that name.')
  })

  it('says one who lives on the farm is there, with her profile', async () => {
    const love = { stage: 'friendship' as const, level: 0, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] }
    const met = { ...farm(), roster: { 90001: newRosterUma(1) }, dorm: { level: 1, home: ['90001'], swaps: [] }, love: { 90001: love } }
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<TownPage />, '/town?uma=90001')
    await find('[data-on-farm]')
    expect($('[data-on-farm]')?.textContent).toBe('She lives on the farm. Her profile ›')
  })

  it('sorts by name, and searches without minding case or accents', () => {
    const view = fixture.view!
    const rows = peopleRows(farm(), fixture.pack!, townDay(farm(), fixture.pack!), namer(view, fixture.pack!))
    expect(sortPeople(rows, 'name').map((r) => r.name)).toEqual(['Aster', 'Beryl', 'Cinder', 'Dune', 'Ember', 'Fable', 'Invented Sister'])
    expect(findPeople([{ ...rows[0]!, name: 'Éclair' }], 'ecl').length).toBe(1)
  })

  it('speaks the town\'s smith by her master-data name in her scene', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(21), buildings: { dorm: 1, forge: 0 }, summary: null } })
    await render(<div />, '/')
    await find('[data-scene="scene:bench"]')
    await click($('[data-beat]'))
    expect($('[data-speaker]')?.textContent).toBe('Fable')
  })
})
