// The town map as rendered: the Town on the farm map's last row opening `/town`; going in for one of the day's actions;
// the map's places in their groups, walking between them free, who's at each now; an Uma with a routine where it says;
// her menu on the dialogue engine: introducing yourself (her meeting scene plays), a talk and a gift, each an action;
// one of the town's people at her post with her post's menu and her ties; the People list finding anyone by name, with
// where she is today; and a scene's line by the town's smith in her master-data name. Invented outfits (the album
// fixture: 90001–90006, named Aster to Fable) and an invented pack with a town.json; master data and the server are
// stubs.
import 'fake-indexeddb/auto'
import { addGoods, farmDay, GOLD_PER_POINT, GOLD_SHIPPED, newLove, runNight, newRosterUma, newSave, readScene, readStoryPack, storyOf, townDay, type SaveV4, type StoryPack } from '@farm/domain'
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
const { default: HeartsPage } = await import('../loop/HeartsPage')
const { findPeople, locationViews, peopleRows, sortPeople } = await import('./town-view')
const { findHer } = await import('../loop/schedule-words')
const { loopMenuGroups } = await import('../shell/MenuSheet')

const AT = '2026-11-13T10:00:00.000Z'
const SISTER = 's81002'
/** The pack: Aster (90001), by her routine, bakes at the bakery on each season's 4th and is at the café every other day;
 * Fable (90006) is the town's smith and keeps the café, tied to Aster; a sister of Beryl's (her outfit 81002) is in the
 * cast by her own name, on the default schedule: the second in the cast, at the plaza on days 2, 5, 8 and 11. The roles
 * town.json leaves go to master data's others, from the last: Ember (90005) the mayor, Dune the shopkeeper, Cinder the
 * farm's last keeper, Beryl the rancher; the rest stay unplayed. So Aster and the sister live in town. */
const CAFE_DAYS = Array.from({ length: 30 }, (_, i) => i + 1).filter(day => day !== 4)
const FILES = {
  cast: { umas: [{ characterId: '90001', spot: 'cafe', routine: [{ at: 'bakery', days: [4] }, { at: 'cafe', days: CAFE_DAYS }] }, { characterId: SISTER, name: 'Invented Sister' }] },
  ties: { ties: [{ a: '90001', b: '90006', line: 'Invented tie line.' }] },
  umas: { 90001: { townLines: ['An invented hello, {farmer}.'] } }, routes: {},
  town: {
    people: [{ characterId: '90006', game: 'ida-stone', does: 'Invented smith.' }], spots: [{ id: 'cafe', name: 'Invented Café', keeper: '90006' }],
    locations: [{ id: 'bakery', name: 'Invented Bakery', line: 'Warm bread.', kind: 'work' }],
  },
}
const save = (): SaveV4 => useGame.getState().save as SaveV4
/** A farm already in town today. */
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
/** An element's words, leaving out the letters on a blank profile's face (its avatar). */
const words = (el: Element | null | undefined): string | undefined => {
  if (!el) return undefined
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let out = ''
  for (let node = walk.nextNode(); node; node = walk.nextNode()) if (!node.parentElement?.closest('[data-avatar]')) out += node.textContent ?? ''
  return out
}
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
  it('leaves non-resident legacy conversation links on the town map', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<TownPage />, '/town?talk=99997')
    await find('[data-town-today]')
    expect($('[data-her-menu]')).toBeNull()
  })

  it('shows working spouses at the counter and self-service on its own day off', () => {
    const id = '90001'
    const legacy = fixture.pack!
    const pack: StoryPack = {
      ...legacy, town: {
        ...legacy.town, professions: [{ id: 'grocer', name: 'Grocer', at: 'store', off: 'wednesday',
          partners: [id, SISTER], role: 'marta-quill' }],
      },
    }
    const spouse = { ...farm(4), roster: { [id]: { ...newRosterUma(1), farmhand: 1 } },
      love: { [id]: { ...newLove(), stage: 'spouse' as const, house: 0, wed: 2 } } }
    const store = (at: SaveV4) => locationViews(townDay(at, pack), pack, at).find(view => view.loc.id === 'store')!
    expect(store(spouse)).toMatchObject({ here: [id], selfService: false })
    expect(findHer(spouse, pack, id)).toMatchObject({
      today: 'The General Store, at work', season: 'Each week', farm: false,
      lines: [{ at: 'store', text: 'Grocer · Mon, Tue, Thu' }, { at: 'farm', text: 'Farm shifts · Fri, Sat, Sun' }, { at: null, text: 'Day off · Wed' }],
    })
    const off = { ...spouse, calendar: { day: 3 } }
    expect(store(off)).toMatchObject({ here: [], selfService: true })
    expect(findHer(off, pack, id)).toMatchObject({ today: 'Day off', farm: true })
    const late = { ...spouse, calendar: { day: 5 } }
    expect(store(late)).toMatchObject({ here: [SISTER], selfService: false })
  })

  it('opens the expedition post at Rank 7 and follows a party out and back', async () => {
    const id = '90001'
    const base = farm(5)
    useGame.setState({ save: { ...base, farm: { ...base.farm, points: 6249 } } })
    await render(<TownPage />, '/town?at=expeditions&sheet=expeditions')
    expect($('[data-expedition-build]')).toBeNull()
    const ready = {
      ...base, gold: 50000, items: addGoods(addGoods(base.items, 'oak-plank', 1, 60), 'carp-fillet', 1, 40),
      farm: { ...base.farm, points: 6250, counts: { [GOLD_SHIPPED]: 6250 * GOLD_PER_POINT } }, roster: { [id]: { ...newRosterUma(1), farmhand: 2 } },
      love: { [id]: { ...newLove(), level: 3 } },
    }
    await act(async () => useGame.setState({ save: ready }))
    await click(await find('[data-action="build-expeditions"]'))
    expect(save().farm.builds).toContain('expeditions')
    const morning = runNight(save(), { story: fixture.pack! })
    expect(morning.buildings.expeditions).toBe(1)
    await act(async () => useGame.setState({ save: { ...morning, today: { ...morning.today, town: true } } }))
    await click(await find('[data-expedition-region="echo-cave"]'))
    await click(await find(`[data-expedition-hand="${id}"]`))
    await click(await find('[data-action="send-expedition"]'))
    expect(save().expeditions).toMatchObject([{ region: 'echo-cave', party: [id] }])
    expect($('[data-expedition-away]')?.textContent).toContain('Leaves tonight')
    const away = runNight(save(), { story: fixture.pack! })
    await act(async () => useGame.setState({ save: { ...away, today: { ...away.today, town: true } } }))
    await render(<TownPage />, '/town?view=people')
    expect($(`[data-person-row="${id}"]`)?.textContent).toContain('Away · Echo Cave · back Spring 8')
    await render(<HeartsPage />, `/hearts?uma=${id}`)
    expect((await find('[data-find-today]')).textContent).toContain('Away · Echo Cave')
    const back = runNight(away, { story: fixture.pack! })
    expect(back.summary?.work).toContainEqual(expect.objectContaining({ kind: 'expedition', region: 'echo-cave', result: 'retreat' }))
    await act(async () => useGame.setState({ save: { ...back, today: { ...back.today, town: true } } }))
    await render(<TownPage />, '/town?at=expeditions&sheet=expeditions')
    const log = $$('button').find((b) => b.textContent?.trim() === 'Away and log')
    await click(log)
    expect($('[data-expedition-log]')?.textContent).toContain('Echo Cave · Retreat')
  })

  it('stands among the town\'s places, open from day 1, and opens its screen', () => {
    const town = loopMenuGroups(farm()).find((g) => g.key === 'town')!
    expect(town.places.map((p) => [p.key, p.to, p.locked])).toEqual([
      ['shop', '/?sheet=shop', false], ['festival', '/?sheet=festival', false], ['expeditions', '/?peek=expeditions', true], ['town', '/town', false],
    ])
  })

  it('arrives directly with the full day spent and keeps shopping available', async () => {
    const home = farm()
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...home, today: { ...home.today, actions: 10, town: false } } })
    await render(<TownPage />, '/town')
    await until(() => save().today.town === true)
    expect(save().today.actions).toBe(10)
    await find('[data-town-today]')
    expect($('[data-action="into-town"]')).toBeNull()
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
    expect(words($(`[data-person="${SISTER}"]`))).toBe('Invented Sister')
    // The café: Fable keeps it, at her post.
    await click($('[data-location="cafe"]'))
    expect($('[data-place-name]')?.textContent).toBe('Invented Café')
    expect(words($('[data-keeper]'))).toBe('Fable · The smith')
    // The general store: its keeper sells seeds; the mayor's office takes build orders and lends toward them.
    await click($('[data-location="store"]'))
    expect(words($('[data-keeper]'))).toBe('Dune · The shopkeeper')
    expect($('[data-post-item="seeds"]')?.getAttribute('href')).toBe('/town?at=store&sheet=shop')
    await click($('[data-location="mayor"]'))
    expect(words($('[data-keeper]'))).toBe('Ember · The mayor')
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
    // The Mill, short 360g: the office offers an exact quote.
    expect($$('[data-order]').map((o) => [o.dataset.order, o.dataset.borrow])).toEqual([['mill', '360']])
    expect($('[data-terms]')?.textContent).toContain('100,000g credit left · 3 slots free')
    await click($('[data-order="mill"] [data-action="review-build-credit"]'))
    expect($('[data-order="mill"] dl')?.textContent).toContain('Total owed400g')
    expect($('[data-no-loans]')?.textContent).toBe('No loans.')
    await click($('[data-order="mill"] [data-action="borrow"]'))
    await until(() => save().farm.loans.length === 1)
    expect(save()).toMatchObject({ gold: 0, farm: { builds: ['mill'], loans: [{ for: 'mill', lent: 360, fee: 40, owed: 400, nightly: 0 }] } })
    expect(save().today.actions).toBe(0)
    await until(() => $('[data-mayor-note]')?.textContent === 'The Mill stands tomorrow, on a loan.')
    expect($('[data-order="mill"]')?.textContent).toContain('Builds tonight')
    expect($('[data-office-loan="mill"]')?.textContent).toContain('400g owed · Waiting for sales')
    expect($('[data-office-loan="mill"] [data-action="repay"]')?.textContent).toBe('Pay off · 400g')
    // With the gold, repay it all.
    await act(async () => useGame.setState({ save: { ...save(), gold: 500 } }))
    await click($('[data-office-loan="mill"] [data-action="repay"]'))
    await until(() => save().farm.loans.length === 0)
    expect(save().gold).toBe(100)
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
    // Met: talk, a gift, Ask her out and the invitation to work (both from Friendship 3).
    await find('[data-menu="talk gift evening work"]')
    expect($('[data-standing]')?.textContent).toBe('Acquaintance · F0')
    expect($('[data-item="work"]')?.dataset.why).toBe('From Friendship 3')
    await click($('[data-action="menu-talk"]'))
    await until(() => save().today.chats.includes(SISTER))
    // Today's talk plays over the town (no greetings or small talk of hers: her line alone); Skip closes it.
    await find('[data-life="talk"]')
    expect(decodeURIComponent(path)).toBe(`/town?at=${at}&uma=${SISTER}&life=talk:${SISTER}`)
    expect($('[data-life="talk"] [data-speaker]')?.textContent).toBe('Invented Sister')
    await click($('[data-action="skip"]'))
    await until(() => !path.includes('life='))
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
    // Aster is a farmhand. Her schedule has her out every day, so her farm days are the default schedule's other days
    // (Spring 2, 3, 5, 6, 8, 9, 11 and 12): Spring 5 is one.
    const met = { ...farm(), roster: { 90001: { ...newRosterUma(1), farmhand: 1 } } }
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<TownPage />, '/town?view=people')
    await find('[data-people]')
    // Aster, the sister, and the town's five people.
    expect($('[data-people]')?.dataset.people).toBe('7')
    const rows = $$('[data-person-row]')
    expect(rows[0]?.dataset.personRow).toBe('90001')
    expect(words(rows[0])).toBe('AsterOn the farm todayMet')
    // On her town day (Spring 4) she's in town, where her schedule puts her.
    const fourth = peopleRows({ ...met, calendar: { day: 4 } }, fixture.pack!, townDay({ ...met, calendar: { day: 4 } }, fixture.pack!), namer(fixture.view!, fixture.pack!))
    expect(fourth.find((r) => r.id === '90001')).toMatchObject({ farm: false, at: 'bakery', where: 'At Invented Bakery today' })
    expect(words($(`[data-person-row="${SISTER}"]`))).toMatch(/^Invented SisterAt [A-Za-z ’]+ today$/)
    expect(words($('[data-person-row="90006"]'))).toBe('FableAt Invented Café, most days · The smith')
    expect(words($('[data-person-row="90002"]'))).toBe('BerylAt the Rancher’s, most days · The rancher')
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

  it('her profile talks and gifts only where you meet her, and says where to find her', async () => {
    const love = { stage: 'friendship' as const, level: 3, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] }
    const met: SaveV4 = { ...farm(), roster: { 90001: newRosterUma(1) }, love: { 90001: love }, arrivals: ['90001'], today: { ...farm().today, town: false } }
    const at = townDay(met, fixture.pack!).where.get('90001')!
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<HeartsPage />, '/hearts?uma=90001')
    // Before going into town: Chat and Gift wait, and a line says where she is, a tap to her there.
    expect((await find('[data-profile-actions] [data-action="chat"]') as HTMLButtonElement).disabled).toBe(true)
    expect(($('[data-profile-actions] [data-action="gift"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-meet]')?.dataset.meet).toBe(at)
    expect($('[data-profile-actions] [data-action="evening"]')?.textContent).toBe('In town')
    // Where to find her: today's place, and this season's days and places.
    expect($('[data-find-her]')?.dataset.findHer).toBe(at)
    expect($('[data-find-today]')?.textContent).toBe('Today · Invented CaféFind her ›')
    expect($$('[data-find-line]').map((l) => l.textContent)).toEqual(['Spring · Invented Café · 1–3, 5–30', 'Invented Bakery · 4'])
    await click($('[data-action="find-her"]'))
    expect(path).toBe(`/town?at=${at}&uma=90001`)
  })

  it('invites a friend to work from her menu, an action: on the farm on her farm days from then, in town on her town days', async () => {
    const love = { stage: 'friendship' as const, level: 3, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] }
    const met: SaveV4 = { ...farm(), roster: { 90001: newRosterUma(1) }, love: { 90001: love }, arrivals: ['90001'] }
    const at = townDay(met, fixture.pack!).where.get('90001')!
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<TownPage />, `/town?at=${at}&uma=90001`)
    await find('[data-her-menu="90001"]')
    expect($('[data-standing]')?.textContent).toBe('Friend · F3')
    // In front of you in town: Ask her out, 2 actions, opens her evening.
    expect($('[data-item="evening"]')?.textContent).toBe('Ask her out · 2 ›')
    expect($('[data-item="work"]')?.textContent).toBe('Invite her to work · 1')
    await click($('[data-action="menu-work"]'))
    await until(() => save().roster['90001']?.farmhand === 5)
    expect(save().today.actions).toBe(1)
    // Her scene plays over the town, the action spent: the default story's, at the farm gate.
    await find('[data-life="invited-to-work"]')
    expect(decodeURIComponent(path)).toBe(`/town?at=${at}&uma=90001&life=invited-to-work:90001`)
    expect($('[data-scene-title]')?.textContent).toMatch(/^Invited to work · /)
    expect($('[data-scene="life:invited-to-work:90001"] [data-line]')?.dataset.line).toBe('She meets you at the farm gate, sleeves already rolled up.')
    await click($('[data-action="skip"]'))
    await until(() => !path.includes('life='))
    await until(() => $('[data-standing]')?.textContent === 'Farmhand · F3')
    expect($('[data-item="work"]')?.dataset.why).toBe('Works the farm ✓')
    // Spring 5 is her farm day: she's on the farm, off the town's map, and her menu says so.
    expect($('[data-on-farm]')?.textContent).toBe('On the farm today, her farm day. Her book ›')
    expect($(`[data-place-panel="${at}"] [data-person="90001"]`)).toBeNull()
    // Her profile: on the farm today, she's in front of you, in town or not, so Chat is open.
    useGame.setState({ save: { ...save(), today: { ...save().today, town: false } } })
    await render(<HeartsPage />, '/hearts?uma=90001')
    const chat = await find('[data-profile-actions] [data-action="chat"]') as HTMLButtonElement
    expect(chat.disabled).toBe(false)
    expect($('[data-stage-name]')?.textContent).toBe('Farmhand')
    expect($('[data-meet]')).toBeNull()
    expect($('[data-find-today]')?.textContent).toBe('Today · On the farm')
    expect($$('[data-find-line]').map((l) => l.textContent)).toEqual(['Spring · On the farm · 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30', 'Invented Café · 1, 7, 10, 13, 16, 19, 22, 25, 28', 'Invented Bakery · 4'])
    expect($('[data-profile-actions] [data-action="evening"]')?.textContent).toBe('Outings unavailable')
    // Spring 7, her town day: she's in town at the café, and the town shows her there.
    useGame.setState({ save: { ...save(), calendar: { day: 7 }, today: { ...save().today, town: true } } })
    await render(<TownPage />, '/town?at=cafe')
    await find('[data-place-panel="cafe"] [data-person="90001"]')
    await render(<HeartsPage />, '/hearts?uma=90001')
    await until(() => $('[data-find-today]')?.textContent === 'Today · Invented CaféFind her ›')
  })

  it('says one who lives on the farm (a spouse in her room) is there, with her profile', async () => {
    const love = { stage: 'spouse' as const, level: 1, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [], wed: 2, house: 0 }
    const met = { ...farm(), roster: { 90001: newRosterUma(1) }, love: { 90001: love } }
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<TownPage />, '/town?uma=90001')
    await find('[data-on-farm]')
    expect($('[data-on-farm]')?.textContent).toBe('She lives on the farm. Her book ›')
  })

  it('sorts by name, and searches without minding case or accents', () => {
    const view = fixture.view!
    const rows = peopleRows(farm(), fixture.pack!, townDay(farm(), fixture.pack!), namer(view, fixture.pack!))
    expect(sortPeople(rows, 'name', farm()).map((r) => r.name)).toEqual(['Aster', 'Beryl', 'Cinder', 'Dune', 'Ember', 'Fable', 'Invented Sister'])
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
