// The Hearts tab as rendered (F48 decisions 2–8; RM51–RM53): the romance build's bar (Farm · Hearts · End the day · Diary
// · Menu) and the M4 build's unchanged; `/roster` landing on the Work view with her `?uma=` kept; the Hearts rows with
// 9000001 Ready first, the filter chips with their counts and Friends; her profile from a row with its track, Next card,
// perks, gifts and ties, switching to Work; the Work view's album with her level in each card's corner. The invented
// stand-in pack and invented outfits; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { joinOpening, newSaveV4, pairKey, readScene, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useRoutes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view), masterRoster: () => fixture.view?.roster ?? null,
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined, setMasterLens: () => undefined,
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { storyReady } = await import('../story/story')
const { castLens } = await import('../story/load')
const { FarmBottomBar } = await import('../shell/Bars')
const { ROUTES } = await import('../app/router')
const { default: HeartsPage } = await import('./HeartsPage')

const AT = '2026-11-11T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 3, the opening three home, 9000001 Ready for Friendship 1 with 2 banked. */
function farm(): SaveV4 {
  const fresh = { ...newSaveV4('u1', AT), farmer: { name: 'Robin' }, calendar: { day: 3 } }
  const joined = joinOpening(readScene(fresh, 'scene:1:open'), fixture.pack!)
  return {
    ...joined, arrivals: [ONE, TWO, THREE], items: { ...joined.items, carrot: [0, 0, 1, 0, 0] },
    love: { ...joined.love, [ONE]: { ...joined.love[ONE]!, points: 202 }, [TWO]: { ...joined.love[TWO]!, points: 90 } },
    bonds: { [pairKey(ONE, TWO)]: 150 },
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
async function render(node: ReactNode, at: string) {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={<>{node}<Where /></>} /></Routes></MemoryRouter>))
  await settle()
}
function App() {
  return <>{useRoutes(ROUTES)}<Where /></>
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !$(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect($(selector)).not.toBeNull()
  return $(selector)!
}
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await settle()
}
const tabs = () => $$('nav[data-kit="bottom-bar"] a').map((a) => [a.textContent?.replace(/\d+$/, ''), a.getAttribute('href')])

beforeEach(async () => {
  vi.stubEnv('VITE_FARM_ROMANCE', '1')
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const pack = await storyReady()
  fixture.pack = pack
  fixture.view = castLens(pack)((await albumFixture()).view)
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
  vi.unstubAllEnvs()
})

describe('the bar and the routes (decisions 2 and 3)', () => {
  it('reads Farm · Hearts · End the day · Diary · Menu in the romance build, with no badge on Hearts', async () => {
    await render(<FarmBottomBar page="hearts" />, '/hearts')
    expect(tabs()).toEqual([['Farm', '/'], ['Hearts', '/hearts'], ['End day', '/hearts?sheet=end'], ['Diary', '/diary'], ['Menu', '/hearts?sheet=menu']])
    const hearts = $('nav[data-kit="bottom-bar"] a[href="/hearts"]')!
    expect(hearts.getAttribute('aria-current')).toBe('page')
    expect(hearts.getAttribute('aria-label')).toBe('Hearts')
  })

  it('keeps M4’s bar with the switch off', async () => {
    vi.stubEnv('VITE_FARM_ROMANCE', '0')
    await render(<FarmBottomBar page="roster" />, '/roster')
    expect(tabs().map(([label, to]) => [label, to])).toEqual([['Farm', '/'], ['Roster', '/roster'], ['End day', '/roster?sheet=end'], ['Diary', '/diary'], ['Menu', '/roster?sheet=menu']])
  })

  it('sends /roster to the Work view, her profile kept; M4 keeps /roster and has no /hearts', async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={[`/roster?uma=${ONE}`]}><App /></MemoryRouter>))
    await settle()
    expect(path).toBe(`/hearts?view=work&uma=${ONE}`)
    await find('[data-page="hearts"][data-view="work"]')
    expect((await find('[data-profile]')).dataset.side).toBe('work')
    expect($('[data-work-side]')).not.toBeNull()
    await act(async () => root.unmount())
    root = createRoot(host)
    vi.stubEnv('VITE_FARM_ROMANCE', '0')
    await act(async () => root.render(<MemoryRouter initialEntries={['/hearts']}><App /></MemoryRouter>))
    await settle()
    expect(path).toBe('/')
  })
})

describe('the Hearts view (decisions 4 and 5)', () => {
  it('lists the three stand-ins, 9000001 Ready first, with the header and the chips’ counts', async () => {
    await render(<HeartsPage />, '/hearts')
    await find('[data-heart-row]')
    expect($$('[data-heart-row]').map((r) => r.dataset.heartRow)).toEqual([ONE, THREE, TWO])
    const first = $(`[data-heart-row="${ONE}"]`)!
    expect(first.querySelector('[data-ready-chip]')?.textContent).toBe('● Ready')
    expect(first.querySelector('[data-level-words]')?.textContent).toBe('New friend')
    expect(first.querySelector('[data-segments]')?.getAttribute('data-segments')).toBe('▣□□□□□□□□□')
    expect(first.querySelector('[data-points]')?.textContent).toBe('200/200')
    expect(first.querySelector('[data-note]')?.textContent).toBe('Ready · Friendship 1 · the Fields · +2 banked')
    expect($(`[data-heart-row="${TWO}"] [data-note]`)?.textContent).toBe('Her story is still being written')
    expect($('[data-married]')?.textContent).toBe('Married 0/3')
    expect(Object.fromEntries($$('[data-filter]').map((c) => [c.dataset.filter, c.textContent]))).toEqual({
      ready: 'Ready1', friends: 'Friends3', partners: 'Partners', married: 'Married', away: 'Away',
    })
  })

  it('filters to Ready and back, and opens her profile from her row', async () => {
    await render(<HeartsPage />, '/hearts')
    await click(await find('[data-filter="ready"]'))
    expect(path).toBe('/hearts?filter=ready')
    expect($$('[data-heart-row]').map((r) => r.dataset.heartRow)).toEqual([ONE])
    await click($('[data-filter="partners"]'))
    expect($('[data-hearts-empty]')?.textContent).toBe('No one here yet.')
    await click($('[data-filter="partners"]'))
    expect($$('[data-heart-row]')).toHaveLength(3)
    await click($(`[data-heart-row="${ONE}"]`))
    expect(path).toBe(`/hearts?uma=${ONE}`)
    await find(`[data-profile="${ONE}"]`)
  })
})

describe('her profile (decision 6)', () => {
  it('shows the track, the Next card, the perks, her gifts and her ties, and switches to Work', async () => {
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await find(`[data-profile="${ONE}"]`)
    expect($('[data-profile-line]')?.textContent).toBe('Farming · ★ Spring 4')
    expect($$('[data-track] [data-rung]')).toHaveLength(28)
    expect($('[data-track] [data-state="next"]')?.dataset.rung).toBe('f1')
    expect($('[data-next] h3')?.textContent).toBe('Next: Friendship 1')
    expect($('[data-next-perk]')?.textContent).toBe('Perk · Her loved gift shown; her own chats')
    expect($('[data-next-hint]')?.textContent).toBe('Event · The Fields, while she works them.')
    expect($('[data-next-words]')?.textContent).toBe('Ready')
    expect($('[data-perks-next]')?.textContent).toBe('Next · F1 · Her loved gift shown; her own chats')
    await click($('[data-action="all-perks"]'))
    expect($$('[data-perk-list] [data-perk]')).toHaveLength(25)
    expect($$('[data-gift-slot]').map((s) => s.dataset.giftSlot)).toEqual(['?', '?', '?', '?', '?', '?'])
    expect($('[data-gift-group="others"]')?.textContent).toBe('Others+10')
    expect($$('[data-tie]').map((t) => [t.dataset.tie, t.dataset.hearts])).toEqual([[TWO, '2'], [THREE, '0']])
    expect($('[data-memories]')?.textContent).toBe('0 of 26')
    await click($$('[data-profile-actions] [role="tab"]').find((t) => t.textContent === 'Work'))
    expect(path).toBe(`/hearts?uma=${ONE}&view=work`)
    expect($('[data-profile]')?.dataset.side).toBe('work')
    expect($$('[data-work-side] [data-activity]')).toHaveLength(9)
    expect($('[data-page="hearts"]')?.dataset.view).toBe('work')
  })

  it('shows her level in the corner of each card in the Work view', async () => {
    const s = farm()
    useGame.setState({ save: { ...s, love: { ...s.love, [THREE]: { ...s.love[THREE]!, stage: 'romance', level: 4 } } } })
    await render(<HeartsPage />, '/hearts?view=work')
    await find('[data-roster-cards]')
    expect($$('[data-card-level]').map((c) => c.dataset.cardLevel)).toEqual(['R4'])
    await click($(`[data-uma="${THREE}"]`))
    expect(path).toBe(`/hearts?view=work&uma=${THREE}`)
    expect((await find(`[data-profile="${THREE}"]`)).dataset.side).toBe('work')
  })
})
