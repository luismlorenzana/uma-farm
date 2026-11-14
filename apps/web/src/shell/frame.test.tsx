// The landscape frame on uma-kit's rail-and-bar variants: the thin bar on top (the date and season, the gold, the day's
// actions left, End the day and the Menu), the rail down the left (Farm · Town · People · Book · Diary, the farm's
// places keeping Farm lit), the whole shell on uma-kit's landscape stage (its sheets come in from the right), Account's
// two columns, the Book's cards, and the card that asks for the phone sideways. Invented ids; master data, sign-in and
// the server are stubs.
import 'fake-indexeddb/auto'
import { newLove, newRosterUma, newSave, type SaveV4 } from '@farm/domain'
import { KitStage } from '@luismlorenzana/uma-kit/ui'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ stats: new Map(), birthdays: new Map() })), useMaster: () => ({ status: 'loading' }), setMasterLens: vi.fn() }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(),
  useAuth: () => ({ ready: true, authRequired: true, user: { uid: 'u1', name: 'Robin', email: null }, error: null, signIn: async () => undefined, signOut: async () => undefined, idToken: async () => null }),
}))

const { useGame, resetGame } = await import('../save/game')
const { FarmBar, FarmRail, railPageOf } = await import('./Bars')
const { Shell } = await import('./Shell')
const { default: BookPage } = await import('../book/BookPage')
const { Upright, UPRIGHT_WORDS } = await import('../app/Upright')
const { AccountView } = await import('../home/AccountView')

const AT = '2026-11-14T10:00:00.000Z'
function farm(): SaveV4 {
  const save = newSave('u1', AT)
  return {
    ...save, farmer: { name: 'Robin' }, calendar: { day: 3 }, gold: 1_240, roster: { 101: newRosterUma(1), 202: newRosterUma(1) }, love: { 101: newLove(), 202: newLove() },
    dorm: { level: 1, home: ['101', '202'], swaps: [] }, diary: { ...save.diary, read: ['scene:1:open'] },
  }
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
}
const $ = (selector: string) => document.body.querySelector(selector)
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)]

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
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
})

/** The farm on its stage, as Root.tsx puts it: the kit draws its landscape variants only there. */
const onStage = (node: ReactNode) => <KitStage layout="landscape">{node}</KitStage>
const bar = '[data-kit="account-bar"]'
const rail = 'nav[aria-label="Pages"]'

describe('the bar', () => {
  it('reads the date and season and the gold, then the actions left, End the day and the Menu', async () => {
    await render(onStage(<FarmBar />), '/fields')
    expect($(bar)?.getAttribute('data-variant')).toBe('bar')
    // From the left: the kit's chips, then at the right end the farm's actions left and End the day, then the Menu.
    expect($$(`${bar} [aria-label]`).map((el) => el.getAttribute('aria-label')!.split(':')[0]))
      .toEqual(['Calendar', 'Gold', 'Actions left', 'End the day', 'Every place'])
    const date = $(`${bar} a[aria-label^="Calendar"]`)!
    expect(date.textContent).toBe('3 Spring')
    expect(date.getAttribute('href')).toBe('/fields?sheet=calendar')
    expect(date.getAttribute('aria-label')).toMatch(/^Calendar: Spring 3, year 1/)
    expect($(`${bar} a[aria-label^="Gold"]`)?.getAttribute('aria-label')).toBe('Gold: 1,240g. The bin')
    expect($(`${bar} a[aria-label^="Gold"]`)?.getAttribute('href')).toBe('/fields?sheet=bin')
    // The day's actions left, of its ten, by End the day: nothing to tap.
    const actions = $('[data-kit="bar-actions"] > [data-bar-chip="actions"]')!
    expect(actions.getAttribute('aria-label')).toBe('Actions left: 10 of 10')
    expect(actions.tagName).toBe('SPAN')
    expect(actions.nextElementSibling?.getAttribute('href')).toBe('/fields?sheet=end')
    expect($('[data-kit="bar-menu"]')?.getAttribute('href')).toBe('/fields?sheet=menu')
    expect($('[data-kit="bar-menu"]')?.getAttribute('aria-label')).toBe('Every place')
  })

  it('greys the actions left once they are spent', async () => {
    const spent = farm()
    useGame.setState({ save: { ...spent, today: { ...spent.today, actions: 10 } } })
    await render(onStage(<FarmBar />))
    expect($('[data-bar-chip="actions"]')?.getAttribute('aria-label')).toBe('Actions left: 0 of 10')
    expect($('[data-bar-chip="actions"] > span')?.className).toContain('text-ink-faint')
  })

  it('shows the sync chip only while offline or paused', async () => {
    const sync = () => $(`${bar} a[href="/account"]`)
    await render(onStage(<FarmBar />))
    expect(sync()).toBeNull()
    await act(async () => useGame.setState({ sync: 'offline' }))
    await render(onStage(<FarmBar />), '/town')
    expect(sync()?.getAttribute('aria-label')).toBe('Offline: changes sync when you’re back')
    expect(sync()?.textContent).toBe('Offline')
    await act(async () => useGame.setState({ sync: 'error' }))
    expect(sync()?.getAttribute('aria-label')).toBe('Sync paused')
    expect(sync()?.textContent).toBe('Sync paused')
  })
})

describe('the rail', () => {
  it('lights the page it is on; the farm\'s places keep Farm lit, Account none', () => {
    expect(['/', '/fields', '/warehouse', '/forest', '/dorm', '/town', '/hearts', '/roster', '/book', '/diary', '/account'].map(railPageOf))
      .toEqual(['farm', 'farm', 'farm', 'farm', 'farm', 'town', 'people', 'people', 'book', 'diary', null])
  })

  it('draws the five pages down the left, the lit one marked for VoiceOver', async () => {
    await render(onStage(<FarmRail page="book" />), '/book')
    expect($(rail)?.getAttribute('data-side')).toBe('left')
    expect($$(`${rail} a`).map((a) => [a.textContent, a.getAttribute('href')]))
      .toEqual([['Farm', '/'], ['Town', '/town'], ['People', '/hearts'], ['Book', '/book'], ['Diary', '/diary']])
    expect($$(`${rail} a[aria-current="page"]`).map((a) => a.textContent)).toEqual(['Book'])
  })
})

describe('the shell on the landscape stage', () => {
  it('is a rail and a bar: the rail down the left, then the bar over the page; the Menu comes in from the right', async () => {
    await render(onStage(<Routes><Route element={<Shell />}><Route path="*" element={<p data-test-page>Page</p>} /></Route></Routes>), '/town?sheet=menu')
    const frame = $('[data-kit="frame"]')!
    expect(frame.getAttribute('data-layout')).toBe('landscape')
    expect(frame.getAttribute('data-arrangement')).toBe('rail-and-bar')
    expect(frame.firstElementChild?.matches(rail)).toBe(true)
    // The rail clears the left safe area, so nothing in the column beside it clears it again.
    const column = $('[data-kit="frame-column"]') as HTMLElement
    expect(column.style.getPropertyValue('--inset-left')).toBe('0px')
    expect(column.firstElementChild?.matches(bar)).toBe(true)
    expect($('[data-kit="frame-column"] [data-farm-page] [data-test-page]')).not.toBeNull()
    expect($(`${rail} a[aria-current="page"]`)?.textContent).toBe('Town')
    // The kit's sheet on a landscape stage is a panel from the right edge.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
    expect($('[data-kit="sheet"]')?.getAttribute('data-placement')).toBe('side')
  })
})

describe('Account', () => {
  it('sits in the kit\'s two columns once the page is wide enough', async () => {
    await render(onStage(<AccountView />), '/account')
    expect($('[data-page="account"] [data-kit="account-columns"] [data-kit="account"]')?.getAttribute('data-columns')).toBe('2')
  })
})

describe('the Book', () => {
  it('gathers the gold, the Farm Rank, the goods, the Umas, the Dorm and what can be built, each a tap to its place', async () => {
    await render(<BookPage />, '/book')
    const cards = $$('[data-book-cards] a').map((a) => [a.getAttribute('data-book'), a.getAttribute('href'), a.querySelector('[data-figure]')?.textContent])
    expect(cards).toEqual([
      ['gold', '/book?sheet=bin', '1,240g'], ['rank', '/book?sheet=rank', '1'], ['goods', '/warehouse', '9'],
      ['work', '/hearts?view=work', '2'], ['dorm', '/dorm', '2/3'], ['projects', '/diary', '1'],
    ])
  })

  it('sets the daily upkeep beside the last seven nights\' income, with what the upkeep counts, a short night and the loans', async () => {
    // Two Umas home and the Mill: 35g a night. Five nights of income; a loan for the Mill; 40g owed after two short nights.
    const save = farm()
    useGame.setState({ save: {
      ...save, buildings: { ...save.buildings, mill: 1 },
      farm: { ...save.farm, income: [0, 300, 200, 0, 100], owed: 40, short: 2, loans: [{ for: 'mill', day: 1, lent: 400, fee: 40, owed: 220, nightly: 45 }] },
    } })
    await render(<BookPage />, '/book')
    const figures = $$('[data-money]').map((f) => [f.getAttribute('data-money'), f.querySelector('[data-figure]')?.textContent, f.querySelector('[data-line]')?.textContent])
    expect(figures).toEqual([
      ['upkeep', '35g', 'After the bin pays'], ['income', '120g', 'Average of the last 5 nights'], ['left', '+40g', 'Less upkeep and loans'],
    ])
    expect($$('[data-part]').map((p) => p.textContent)).toEqual(['1 place built15g', '2 Umas on the farm20g'])
    expect($$('[data-night]').map((b) => b.getAttribute('data-night'))).toEqual(['0', '300', '200', '0', '100'])
    expect($('[data-upkeep-line]')).not.toBeNull()
    expect($('[data-short]')?.textContent).toBe('Short of upkeep · 40g owed · farmhands at half pace until it’s paid')
    expect($('[data-loan="mill"]')?.textContent).toBe('Mill220g owed · 45g a night · clears in about 5 nights (Spring 8)')
  })

  it('shows a new farm\'s money: nothing to keep up and no nights yet', async () => {
    useGame.setState({ save: { ...farm(), roster: {}, love: {}, dorm: { level: 1, home: [], swaps: [] } } })
    await render(<BookPage />, '/book')
    expect($$('[data-money] [data-figure]').map((f) => f.textContent)).toEqual(['0g', '0g', '+0g'])
    expect($('[data-nights]')?.textContent).toBe('Each night’s income shows here after the bin pays.')
    expect($('[data-no-loans]')?.textContent).toBe('None. The mayor’s office in town lends toward a build.')
    expect($('[data-short]')).toBeNull()
  })
})

describe('held upright', () => {
  it('asks for the phone sideways, by CSS alone, over everything', async () => {
    await render(<Upright />)
    const card = $('[data-upright]')!
    expect(card.textContent).toContain(UPRIGHT_WORDS.title)
    expect(card.className).toContain('hidden')
    expect(card.className).toContain('portrait:flex')
    expect(card.className).toContain('z-[1000]')
    // jsdom can't tell the orientation: hidden from VoiceOver, as when sideways.
    expect(card.getAttribute('aria-hidden')).toBe('true')
  })
})
