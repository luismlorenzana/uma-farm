// The landscape frame: the thin bar on top (the date and season, the day's actions left, the gold, End the day
// and the Menu), the rail down the left (Farm · Town · People · Book · Diary, the farm's places keeping Farm lit), the
// whole shell on uma-kit's landscape stage (its sheets come in from the right), the Book's cards, and the card that
// asks for the phone sideways. Invented ids; master data and the server are stubs.
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

const { useGame, resetGame } = await import('../save/game')
const { FarmBar, FarmRail, railPageOf } = await import('./Bars')
const { Shell } = await import('./Shell')
const { default: BookPage } = await import('../book/BookPage')
const { Upright, UPRIGHT_WORDS } = await import('../app/Upright')

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

describe('the bar', () => {
  it('reads the date and season, the actions left, the gold, then End the day and the Menu', async () => {
    await render(<FarmBar />, '/fields')
    const chips = $$('[data-farm-bar] [data-bar-chip]').map((el) => el.getAttribute('data-bar-chip'))
    expect(chips).toEqual(['date', 'actions', 'gold'])
    const date = $('[data-bar-chip="date"]')!
    expect(date.textContent).toBe('Spring 3')
    expect(date.getAttribute('href')).toBe('/fields?sheet=calendar')
    expect(date.getAttribute('aria-label')).toMatch(/^Calendar: Spring 3, year 1/)
    // The day's actions left, of its ten: nothing to tap.
    expect($('[data-bar-chip="actions"]')?.getAttribute('aria-label')).toBe('Actions left: 10 of 10')
    expect($('[data-bar-chip="actions"]')?.tagName).toBe('SPAN')
    expect($('[data-bar-chip="gold"]')?.getAttribute('aria-label')).toBe('Gold: 1,240g. The bin')
    expect($('[data-bar-chip="gold"]')?.getAttribute('href')).toBe('/fields?sheet=bin')
    expect($('[data-bar-end]')?.getAttribute('href')).toBe('/fields?sheet=end')
    expect($('[data-bar-menu]')?.getAttribute('href')).toBe('/fields?sheet=menu')
    expect($('[data-bar-menu]')?.getAttribute('aria-label')).toBe('Every place')
  })

  it('shows the sync chip only while offline or paused', async () => {
    await render(<FarmBar />)
    expect($('[data-bar-chip="sync"]')).toBeNull()
    await act(async () => useGame.setState({ sync: 'offline' }))
    await render(<FarmBar />, '/town')
    expect($('[data-bar-chip="sync"]')?.getAttribute('href')).toBe('/account')
    expect($('[data-bar-chip="sync"]')?.textContent).toBe('Offline')
  })
})

describe('the rail', () => {
  it('lights the page it is on; the farm\'s places keep Farm lit, Account none', () => {
    expect(['/', '/fields', '/warehouse', '/forest', '/dorm', '/town', '/hearts', '/roster', '/book', '/diary', '/account'].map(railPageOf))
      .toEqual(['farm', 'farm', 'farm', 'farm', 'farm', 'town', 'people', 'people', 'book', 'diary', null])
  })

  it('draws the five pages, the lit one marked for VoiceOver', async () => {
    await render(<FarmRail page="book" />, '/book')
    expect($$('[data-farm-rail] a').map((a) => [a.getAttribute('data-rail'), a.getAttribute('href')]))
      .toEqual([['farm', '/'], ['town', '/town'], ['people', '/hearts'], ['book', '/book'], ['diary', '/diary']])
    expect($$('[data-farm-rail] a[aria-current="page"]').map((a) => a.getAttribute('data-rail'))).toEqual(['book'])
  })
})

describe('the shell on the landscape stage', () => {
  it('is a row: the rail, then the bar over the page; the Menu comes in from the right', async () => {
    await render(<KitStage layout="landscape"><Routes><Route element={<Shell />}><Route path="*" element={<p data-test-page>Page</p>} /></Route></Routes></KitStage>, '/town?sheet=menu')
    const frame = $('[data-kit="frame"]')!
    expect(frame.getAttribute('data-layout')).toBe('landscape')
    expect(frame.firstElementChild?.hasAttribute('data-farm-rail')).toBe(true)
    expect($('[data-farm-frame] > [data-farm-bar]')).not.toBeNull()
    expect($('[data-farm-page] [data-test-page]')).not.toBeNull()
    expect($('[data-kit="bottom-bar"]')).toBeNull()
    expect($('[data-farm-rail] a[aria-current="page"]')?.getAttribute('data-rail')).toBe('town')
    // The kit's sheet on a landscape stage is a panel from the right edge.
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
    expect($('[data-kit="sheet"]')?.getAttribute('data-placement')).toBe('side')
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
