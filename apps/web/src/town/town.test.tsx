// The town as rendered: the Town on the farm map's last row opening `/town`; going in for one of the day's actions; its
// six spots with their keepers and the day's few; a talk that counts once a day; the People list finding anyone by
// name, with where she is today; a sister by the pack's name and her own outfit's face; one of the town's people with
// her role and her tie's line; and a scene's line by the town's smith in her master-data name; a talk that meets her
// trigger playing her meeting scene, one met who lives in town marked Met, and a gift for one not met. Invented outfits
// (the album fixture: 90001–90006, named Aster to Fable) and an invented pack with a town.json; master data and the
// server are stubs.
import 'fake-indexeddb/auto'
import { newRosterUma, newSave, readScene, readStoryPack, storyOf, townDay, type SaveV4, type StoryPack } from '@farm/domain'
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
/** The pack: Aster (90001) favours the café; Fable (90006) is the town's smith and keeps the café, tied to Aster; a
 * sister of Beryl's (her outfit 81002) is in the cast by her own name. The roles town.json leaves go to master data's
 * others, from the last: Ember (90005) the mayor, Dune the shopkeeper, Cinder the farm's last keeper, Beryl the rancher;
 * the rest stay unplayed. So Aster and the sister live in town. The welcome list names no one in the cast, so nobody
 * visits the Gate and both are out. */
const FILES = {
  cast: { umas: [{ characterId: '90001', spot: 'cafe' }, { characterId: SISTER, name: 'Invented Sister' }], welcome: ['90099'] },
  ties: { ties: [{ a: '90001', b: '90006', line: 'Invented tie line.' }] },
  umas: { 90001: { townLines: ['An invented hello, {farmer}.'] } }, routes: {},
  town: { people: [{ characterId: '90006', game: 'ida-stone', does: 'Invented smith.' }], spots: [{ id: 'cafe', name: 'Invented Café', keeper: '90006' }] },
}
const save = (): SaveV4 => useGame.getState().save as SaveV4
/** A farm already in town today (going in takes one of the day's actions). */
const farm = (day = 4): SaveV4 => {
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

  it('shows the day\'s six spots with their keepers and the few out; a talk counts once a day', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<TownPage />, '/town')
    await find('[data-town-today]')
    expect($$('[data-spot]').map((s) => s.dataset.spot)).toEqual(['plaza', 'market', 'cafe', 'harbour', 'library', 'track'])
    // With so few, everyone who lives in town is out: Aster and the sister.
    expect($('[data-out]')?.dataset.out).toBe('2')
    expect($$('[data-person]').map((p) => p.dataset.person).sort()).toEqual(['90001', SISTER])
    expect($('[data-spot="cafe"] h2')?.textContent).toBe('Invented Café')
    expect($('[data-spot="cafe"] [data-keeper]')?.textContent).toBe('Fable · The smith')
    expect($('[data-spot="plaza"] h2')?.textContent).toBe('The Plaza')
    expect($('[data-spot="plaza"] [data-keeper]')?.textContent).toBe('Ember · The mayor')
    expect($('[data-spot="harbour"] [data-keeper]')).toBeNull()
    const sister = $(`[data-person="${SISTER}"]`)
    expect(sister?.textContent).toBe('Invented Sister')
    // Tap her: the sheet, her line, and the talk counted once.
    const first = $('[data-person]')!
    const id = first.dataset.person!
    await click(first)
    await find(`[data-talk="${id}"]`)
    expect(path).toBe(`/town?talk=${id}`)
    await until(() => save().town[id]?.talks === 1)
    expect(save().town[id]).toEqual({ talks: 1, last: 4 })
    await until(() => $('[data-talks]')?.textContent === 'Talked 1 day · today ✓')
    // Again today: the sheet, and nothing counted or saved.
    const updated = save().account.updatedAt
    await render(<TownPage />, `/town?talk=${id}`)
    await find(`[data-talk="${id}"]`)
    await settle()
    expect(save().town[id]).toEqual({ talks: 1, last: 4 })
    expect(save().account.updatedAt).toBe(updated)
  })

  it('says Aster\'s own line, and her tie with the café\'s keeper there', async () => {
    const day = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => townDay(farm(d), fixture.pack!).where.get('90001') === 'cafe')!
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(day) })
    await render(<TownPage />, '/town?talk=90001')
    await find('[data-talk="90001"]')
    expect($('[data-talk-line]')?.textContent).toBe('An invented hello, Robin.')
    expect($('[data-talk-spot]')?.textContent).toBe('Invented Café')
    expect($('[data-talk-tie="90006"]')?.textContent).toBe('Fable · Invented tie line.')
  })

  it('opens a keeper\'s sheet with her role and her ties, never counting a talk', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<TownPage />, '/town?talk=90006')
    await find('[data-talk="90006"]')
    expect($('[data-keeper-role]')?.textContent).toBe('The smithInvented smith. · Invented Café')
    expect($('[data-keeper-tie="90001"]')?.textContent).toBe('Aster · Invented tie line.')
    await settle()
    expect(save().town).toEqual({})
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
    expect($(`[data-person-row="${SISTER}"]`)?.textContent).toMatch(/^Invented SisterAt the [A-Za-z ]+ today$|^Invented SisterAt Invented Café today$/)
    expect($('[data-person-row="90006"]')?.textContent).toBe('FableAt Invented Café, most days · The smith')
    expect($('[data-person-row="90002"]')?.textContent).toBe('BerylIn town · The rancher')
    await type($('[data-search]'), 'invented sis')
    expect($$('[data-person-row]').map((r) => r.dataset.personRow)).toEqual([SISTER])
    await type($('[data-search]'), 'nobody')
    expect($('[data-none]')?.textContent).toBe('No one by that name.')
  })

  it('a talk on her third day meets her: her meeting scene plays, and she moves in', async () => {
    const day = Array.from({ length: 60 }, (_, i) => i + 2).find((d) => townDay(farm(d), fixture.pack!).where.has(SISTER))!
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(day), town: { [SISTER]: { talks: 2, last: day - 1 } } } })
    await render(<TownPage />, `/town?talk=${SISTER}`)
    await until(() => !!save().roster[SISTER])
    expect(save().town[SISTER]).toEqual({ talks: 3, last: day })
    expect(save().dorm.home).toEqual([SISTER])
    await find(`[data-scene="arrival:${SISTER}"]`)
    expect($('[data-scene-title]')?.textContent).toBe('Meeting Invented Sister · Town')
    expect($('[data-line]')?.textContent).toBe('You get talking, and the time slips by.')
  })

  it('marks one met who lives in town, and offers a gift to one not met after the talk', async () => {
    const day = Array.from({ length: 60 }, (_, i) => i + 1).find((d) => {
      const where = townDay(farm(d), fixture.pack!).where
      return where.has('90001') && where.has(SISTER)
    })!
    // Aster met, living in town (no bed: three others home); her scene already played.
    const met: SaveV4 = { ...farm(day), roster: { 90001: newRosterUma(1) }, arrivals: ['90001'], love: { 90001: { stage: 'friendship', level: 0, points: 0, last: 0, known: [], flags: [], evening: 0, festivals: [] } } }
    useGame.setState({ uid: 'u1', status: 'ready', save: met })
    await render(<TownPage />, '/town?talk=90001')
    await find('[data-talk="90001"]')
    expect($('[data-talk="90001"]')?.dataset.met).toBe('true')
    expect($('[data-met-line]')?.textContent).toBe('MetHer profile ›')
    expect($('[data-action="town-gift"]')).toBeNull()
    await render(<TownPage />, '/town?view=people')
    await find('[data-people]')
    expect($('[data-person-row="90001"]')?.dataset.where).not.toBe('farm')
    expect($('[data-person-row="90001"] [data-met]')).not.toBeNull()
    // The sister, not met: after the talk, Give a gift.
    await render(<TownPage />, `/town?talk=${SISTER}`)
    await find('[data-action="town-gift"]')
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
