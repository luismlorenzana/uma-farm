// The Hearts tab as rendered: the bar (Farm · Hearts · End the day · Diary · Menu); `/roster` landing on the Work view
// with her `?uma=` kept; the Hearts
// rows with 9000001 Ready first and her chapter, the filter chips with their counts and Friends; her profile from a row
// with its track, Next card, chapters, perks, gifts and ties, switching to Work; the Work view's album with her level in each card's
// corner. The invented stand-in pack and invented outfits; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { meet, newSave, pairKey, readScene, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation, useRoutes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
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
const { FarmRail } = await import('../shell/Bars')
const { ROUTES } = await import('../app/router')
const { default: HeartsPage } = await import('./HeartsPage')

/** The stand-in's three home, ties seeded, as if met: the opening brings nobody, and day 1's visitor waits at the Gate. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : meet(s, id, pack).save), save)
const AT = '2026-11-11T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 3, the stand-in's three home (`joinStandIns`), 9000001 Ready for Friendship 1 with 2 banked. */
function farm(): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: 3 } }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), fixture.pack!)
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
const tabs = () => $$('nav[data-farm-rail] a').map((a) => [a.textContent, a.getAttribute('href')])

beforeEach(async () => {
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

describe('the bar and the routes', () => {
  it('reads Farm · Town · People · Book · Diary down the rail, People lit on the Hearts page', async () => {
    await render(<FarmRail page="people" />, '/hearts')
    expect(tabs()).toEqual([['Farm', '/'], ['Town', '/town'], ['People', '/hearts'], ['Book', '/book'], ['Diary', '/diary']])
    const people = $('nav[data-farm-rail] a[href="/hearts"]')!
    expect(people.getAttribute('aria-current')).toBe('page')
    expect(people.getAttribute('aria-label')).toBe('People')
  })

  it('sends /roster to the Work view, her profile kept', async () => {
    await act(async () => root.render(<MemoryRouter initialEntries={[`/roster?uma=${ONE}`]}><App /></MemoryRouter>))
    await settle()
    expect(path).toBe(`/hearts?view=work&uma=${ONE}`)
    await find('[data-page="hearts"][data-view="work"]')
    expect((await find('[data-profile]')).dataset.side).toBe('work')
    expect($('[data-work-side]')).not.toBeNull()
  })
})

describe('the Hearts view', () => {
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
    expect(first.querySelector('[data-row-chapter]')?.textContent).toBe('Ch. 1 · Getting to know her')
    // 9000002's route isn't scripted: her short bar says it all.
    expect($(`[data-heart-row="${TWO}"] [data-note]`)?.textContent).toBe('')
    expect($('[data-married]')?.textContent).toBe('Married 0/3')
    expect(Object.fromEntries($$('[data-filter]').map((c) => [c.dataset.filter, c.textContent]))).toEqual({
      ready: 'Ready1', friends: 'Friends3', partners: 'Partners', married: 'Married', away: 'In town',
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
    await click($(`[data-heart-row="${ONE}"] [data-open-row]`))
    expect(path).toBe(`/hearts?uma=${ONE}`)
    await find(`[data-profile="${ONE}"]`)
  })
})

describe('her profile', () => {
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
    expect($('[data-memories]')?.textContent).toBe('0 of 26Album ›')
    // Her chapters: the four defaults, the first under way, its events played and to come, and what opens the next.
    expect($$('[data-chapters] [data-chapter]').map((c) => [c.dataset.chapter, c.dataset.state, c.querySelector('[data-chapter-title]')?.textContent])).toEqual([
      ['1', 'current', 'Getting to know her'], ['2', 'ahead', 'Together'], ['3', 'ahead', 'The wedding'], ['4', 'ahead', 'Married life'],
    ])
    expect($$('[data-chapter-events] [data-event]').map((e) => e.textContent).slice(0, 3)).toEqual(['✓ Meeting', 'F1', 'F2'])
    expect($('[data-chapter-next]')?.textContent).toBe('Next · Together · After her confession')
    await click($$('[data-profile-sides] [role="tab"]').find((t) => t.textContent === 'Work'))
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
