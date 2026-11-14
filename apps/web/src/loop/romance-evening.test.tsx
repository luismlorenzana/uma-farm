// The evening on screen, the switch on: an evening from her profile's Evening › to
// its card, paid and saved once; the morning's invitation answered Yes making her Tonight's evening (Play ›, the +20 on her
// kinds sheet) and Another day costing nothing; Tonight's Pick someone › to a spent row; the Hearts header's ○ and ●; and
// End the day's fade to the morning. The invented stand-in pack (9000001–9000003) and invented outfits; master data and
// the server are stubs.
import 'fake-indexeddb/auto'
import { meet, newSave, readScene, type Love, type SaveV4, type StoryPack } from '@farm/domain'
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
const { default: InviteAnswer } = await import('./InviteAnswer')
const { heartsLines } = await import('./summary-words')
const { setAskBeforeEnd } = await import('./ask')

/** The stand-in's three home, ties seeded, as if met: the opening brings nobody, and day 1's visitor waits at the Gate. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : meet(s, id, pack).save), save)
const AT = '2026-11-11T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on `day`, the stand-in's three home (`joinStandIns`) with their arrivals played; each at the `love` given. */
function farm(loves: Record<string, Partial<Love>> = {}, day = 3): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), fixture.pack!)
  const love = Object.fromEntries(Object.entries(joined.love).map(([id, l]) => [id, { ...l, ...loves[id] }]))
  return { ...joined, arrivals: [ONE, TWO, THREE], today: { ...joined.today, bonds: {} }, love }
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
/** The plays' clock: `later(ms)` moves it on, so a round ends without waiting it out. */
let offset = 0
const later = (ms: number) => { offset += ms }
/** Plays a Walk to a Perfect: at each fork, the turn toward the place she said she loves. */
async function walkPerfect(forks: number) {
  const loves = (await find('[data-loves]')).dataset.loves
  await click($('[data-action="play-start"]'))
  for (let fork = 0; fork < forks; fork++) {
    await find(`[data-fork="${fork}"]`)
    await click($(`[data-turn][data-place="${loves}"]`))
  }
}
/** Starts a play and lets it run out with no taps: never failed, a Fine. */
async function runOut() {
  await click(await find('[data-action="play-start"]'))
  for (let i = 0; i < 200 && !$('[data-play-result]'); i++) {
    later(1500)
    await act(async () => { await new Promise((r) => setTimeout(r, 20)) })
  }
  expect($('[data-play-result]')?.dataset.playResult).toBe('fine')
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
  offset = 0
  const real = performance.now.bind(performance)
  vi.spyOn(performance, 'now').mockImplementation(() => real() + offset)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('an evening from her profile', () => {
  it('shows her kinds with her numbers, plays a Walk at its evening length, and pays it on the card once', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ [TWO]: { level: 2 } }) })
    const before = save().account.updatedAt
    await render(<HeartsPage />, `/hearts?uma=${TWO}`)
    expect($('[data-evening-marks]')?.dataset.eveningMarks).toBe('○')
    const button = await find('[data-profile-actions] [data-action="evening"]')
    expect(button.textContent).toContain('Evening ›')
    await click(button)
    expect(path).toBe(`/hearts?uma=${TWO}&evening=${TWO}`)
    await find(`[data-evening-kinds="${TWO}"]`)
    expect($('[data-evening-role]')?.textContent).toBe('A hangout · Friend · F2')
    // Open now, then greyed by her ladder; cooking and the footrace aren't offered.
    expect($$('[data-kind]').map((k) => [k.dataset.kind, k.dataset.locked ?? null])).toEqual([
      ['walk', null], ['fishing', null], ['picnic', null], ['market', null], ['crafting', 'At Romance 1'], ['stargazing', 'At Romance 3'], ['dance', 'At Romance 6'], ['boat', 'At Romance 6'],
    ])
    // The stand-in's forager has no bible: her favourite is walk, ×1.5.
    expect($('[data-kind="walk"]')?.dataset.favourite).toBe('true')
    expect($('[data-kind="walk"] [data-pays]')?.textContent).toBe('Fine +90 · Great +150 · Perfect +225')
    expect($('[data-kind="fishing"] [data-pays]')?.textContent).toBe('Fine +60 · Great +100 · Perfect +150')
    await click($('[data-kind="walk"]'))
    await find('[data-evening-play="walk"] [data-play="walk"][data-length="evening"]')
    expect($('[data-play-title]')?.textContent).toBe('Walk at dusk')
    expect($('[data-legend]')?.textContent).toBe('Fine +90 · Great +150 · Perfect +225')
    // Nothing is saved while it plays.
    expect(save().today.evenings).toEqual([])
    await walkPerfect(4)
    await find('[data-play-result="perfect"]')
    expect($('[data-play-result]')?.textContent).toContain('Perfect · +225')
    await click($('[data-action="play-done"]'))
    const card = await find('[data-evening-card="walk"]')
    expect(card.dataset.grade).toBe('perfect')
    expect($('[data-card-play]')?.textContent).toBe('+150 Perfect × 1.5 her favourite = +225')
    expect($('[data-card-invite]')).toBeNull()
    expect($('[data-card-total]')?.textContent).toBe('= +225 toward Friendship 3')
    expect($('[data-card-bar]')?.dataset.cardBar).toBe('225/280')
    expect(save().love[TWO]).toMatchObject({ points: 225, evening: 3 })
    expect(save().today.evenings).toEqual([{ with: TWO, kind: 'walk' }])
    expect(save().account.updatedAt).not.toBe(before)
    await click($('[data-action="evening-done"]'))
    await until(() => !$('[data-evening-card]'))
    expect(path).toBe(`/hearts?uma=${TWO}`)
    expect($('[data-profile-actions] [data-action="evening"]')?.textContent).toBe('Evening ✓')
    expect($('[data-evening-marks]')?.dataset.eveningMarks).toBe('●')
  })

  it('says why not on her profile: below Friendship 2, and once the evening is spent with someone else', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm({ [TWO]: { level: 2 } }), today: { ...farm().today, evenings: [{ with: TWO, kind: 'walk' }] } } })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-profile-actions] [data-action="evening"]')).textContent).toBe('Evening · F2')
    useGame.setState({ save: { ...save(), love: { ...save().love, [ONE]: { ...save().love[ONE]!, level: 2 } } } })
    await settle()
    expect($('[data-profile-actions] [data-action="evening"]')?.textContent).toBe('Evening spent')
  })
})

describe('the morning\'s invitation', () => {
  it('words her line, and Yes makes her Tonight\'s evening with +20; the row\'s ✉ stands until it\'s spent', async () => {
    expect(heartsLines([{ kind: 'invite', id: TWO, evening: 'walk' }, { kind: 'birthday', id: ONE, when: 'today' }], [], (id) => (id === TWO ? 'Stand-in 2' : 'Stand-in 1'))
      .map((l) => [l.text, l.invite ?? null])).toEqual([['✉ Stand-in 2: “Walk at dusk tonight?”', TWO], ['★ Stand-in 1’s birthday today', null]])
    const morning = farm({ [TWO]: { level: 2 }, [THREE]: { level: 2 } })
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...morning, today: { ...morning.today, invites: [{ id: TWO, kind: 'walk', answer: null }] } } })
    await render(<><InviteAnswer id={TWO} /><HeartsPage /></>, '/hearts')
    expect($(`[data-heart-row="${TWO}"] [data-invite-chip]`)).not.toBeNull()
    await click(await find('[data-action="invite-yes"]'))
    expect(save().today.invites).toEqual([{ id: TWO, kind: 'walk', answer: 'yes' }])
    await find('[data-invite-answer="yes"]')
    expect($(`[data-heart-row="${TWO}"] [data-invite-chip]`)).not.toBeNull()
    // Tonight's row is hers, with Play ›; her kinds sheet says the +20.
    useGame.setState({ save: save() })
    await render(<p />, '/?sheet=end')
    const row = await find('[data-evening-row="evening"]')
    expect(row.dataset.state).toBe('invited')
    expect(row.textContent).toContain('Stand-in 2 · Walk')
    await click(row.querySelector('[data-action="play-evening"]') as HTMLElement)
    expect(path).toBe(`/?sheet=end&evening=${TWO}`)
    expect((await find('[data-evening-invite]')).textContent).toContain('She asked you: +20 with the evening')
    // Whatever kind you choose, the +20 comes with it (her ×1.5 only in her kind, walk).
    await click($('[data-kind="fishing"]'))
    await find('[data-play="cast"][data-length="evening"]')
    await runOut()
    await click($('[data-action="play-done"]'))
    await find('[data-evening-card="fishing"]')
    expect($('[data-card-play]')?.textContent).toBe('+60 Fine')
    expect($('[data-card-invite]')?.textContent).toBe('+20 for saying yes')
    expect($('[data-card-total]')?.textContent).toBe('= +80 toward Friendship 3')
    expect(save().love[TWO]!.points).toBe(80)
    await click($('[data-action="evening-done"]'))
    await until(() => !$('[data-evening-card]'))
    expect($(`[data-heart-row="${TWO}"] [data-invite-chip]`)).toBeNull()
  })

  it('Another day costs nothing', async () => {
    const morning = farm({ [TWO]: { level: 2 } })
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...morning, today: { ...morning.today, invites: [{ id: TWO, kind: 'walk', answer: null }] } } })
    await render(<><InviteAnswer id={TWO} /><HeartsPage /></>, '/hearts')
    await click(await find('[data-action="invite-no"]'))
    expect(save().today.invites).toEqual([{ id: TWO, kind: 'walk', answer: 'no' }])
    expect(save().love).toEqual(morning.love)
    await find('[data-invite-answer="no"]')
    expect($(`[data-heart-row="${TWO}"] [data-invite-chip]`)).toBeNull()
  })
})

describe('Tonight', () => {
  beforeEach(() => {
    const items = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v), removeItem: (k: string) => void items.delete(k) })
    setAskBeforeEnd(true)
  })

  it('opens with a free slot: Pick someone › to her evening, then back on Tonight with "with … ✓"; End the day fades to the morning', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ [TWO]: { level: 2 } }) })
    await render(<p />, '/?sheet=end')
    await find('[data-tonight="3"]')
    expect($('[data-end-line]')?.textContent).toBe('10 actions left')
    const free = $('[data-evening-row="evening"]')!
    expect(free.dataset.state).toBe('free')
    await click(free.querySelector('[data-action="pick-someone"]') as HTMLElement)
    expect(path).toBe('/?sheet=end&evening=pick')
    await find('[data-evening-picker]')
    expect($$('[data-pick]').map((p) => p.dataset.pick)).toEqual([TWO])
    await click($(`[data-pick="${TWO}"]`))
    expect(path).toBe(`/?sheet=end&evening=${TWO}`)
    await click(await find('[data-kind="picnic"]'))
    await runOut()
    await click($('[data-action="play-done"]'))
    await find('[data-evening-card="picnic"]')
    expect($('[data-card-play]')?.textContent).toBe('+60 Fine')
    await click($('[data-action="evening-done"]'))
    await until(() => !$('[data-evening-card]'))
    expect(path).toBe('/?sheet=end')
    const spent = await find('[data-evening-row="evening"][data-state="spent"]')
    expect(spent.textContent).toContain('with Stand-in 2 · Picnic ✓')
    expect(save().calendar.day).toBe(3)
    // End the day: the dusk comes down, the night runs under it, the morning comes up.
    await click($('[data-action="end-day"]'))
    await until(() => $('[data-night-fade]') !== null)
    await until(() => save().calendar.day === 4, 300)
    await until(() => $('[data-night-fade]') === null, 300)
    expect(path).toBe('/')
    expect(save().summary?.day).toBe(4)
    expect(save().today.evenings).toEqual([])
  }, 20_000)

  it('stays shut when nobody can spend an evening: the one line', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<p />, '/?sheet=end')
    await find('[data-end-line]')
    expect($('[data-tonight]')).toBeNull()
    expect($('[data-action="end-anyway"]')).not.toBeNull()
  })

  it('on a festival day, shows festival night beside a spent evening, and the header\'s marks', async () => {
    const day = farm({ [TWO]: { level: 2 }, [THREE]: { level: 2 } }, 10)
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...day, today: { ...day.today, evenings: [{ with: TWO, kind: 'walk' }] } } })
    await render(<p />, '/?sheet=end')
    await find('[data-tonight="10"]')
    expect($$('[data-evening-row]').map((r) => [r.dataset.eveningRow, r.dataset.state])).toEqual([['evening', 'spent'], ['festival', 'free']])
    await render(<HeartsPage />, '/hearts')
    expect((await find('[data-evening-marks]')).dataset.eveningMarks).toBe('●○')
    expect($$('[data-evening-marks] [data-slot]').map((m) => m.dataset.slot)).toEqual(['evening', 'festival'])
  })
})
