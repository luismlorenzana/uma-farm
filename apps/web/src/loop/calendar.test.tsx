// The calendar on screen: the bar's date opens it over everything; the season's 12 days as a grid with the festival,
// birthdays and the faces of the Umas with an event; the other seasons a tap away; the chosen day's panel. On the Flower
// Show, the bar shows the festival's event actions, its occasion scene plays with each Uma you've met (one action, the
// event actions first) and two Umas' events play past the day's budget; on a plain day with no action left, her event
// says so before it plays. The invented stand-in pack (9000001–9000003) and invented outfits; master data and the
// server are stubs.
import 'fake-indexeddb/auto'
import { costOf, farmDay, meet, newSave, readScene, type Love, type SaveV4, type StoryPack } from '@farm/domain'
import { KitStage } from '@luismlorenzana/uma-kit/ui'
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

const AT = '2026-11-14T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const SHOW = farmDay({ year: 1, season: 'spring', day: 19 })
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on `day`, the stand-in's three home and their arrivals played; `spent` of the day's ten spent; each
 * Uma at her `love`. */
function farm(day: number, spent = 0, love: Record<string, Partial<Love>> = {}): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = [ONE, TWO, THREE].reduce((s, id) => meet(s, id, fixture.pack!).save, readScene(fresh, 'scene:1:open'))
  const loves = Object.fromEntries(Object.entries(joined.love).map(([id, l]) => [id, { ...l, ...love[id] }]))
  return { ...joined, arrivals: [ONE, TWO, THREE], love: loves, today: { ...joined.today, bonds: {}, actions: spent } }
}
/** Her Friendship 1 Ready. */
const f1: Partial<Love> = { stage: 'friendship', level: 0, points: costOf('f1') }

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
  // On the kit's landscape stage, as Root.tsx puts it: the bar's landscape variant is drawn only there.
  await act(async () => root.render(
    <KitStage layout="landscape">
      <MemoryRouter key={at} initialEntries={[at]}>
        <Routes><Route element={<Shell />}><Route path="*" element={<>{node}<Where /></>} /></Route></Routes>
      </MemoryRouter>
    </KitStage>,
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
/** Taps the line in `frame` (each tap finishes a line, then goes on) until `selector` shows. */
async function tapUntil(frame: string, selector: string) {
  for (let i = 0; i < 40 && !$(selector); i++) {
    const bubble = $(`${frame} button[data-step]:not([disabled])`)
    if (bubble) await click(bubble)
    else await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  }
  return find(selector)
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
  vi.restoreAllMocks()
})

describe('the calendar', () => {
  it('shows the restarted date in the bar and on the grid, with the previous day disabled at Spring 1', async () => {
    const prior = farm(10, 6)
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...prior, calendar: { day: 10, start: 10 } } })
    await render(<p>Farm</p>, '/?sheet=calendar')
    await find('[data-calendar-grid="spring"] [data-day="10"]')
    expect($('[aria-label^="Calendar: Spring 1, year 1"]')).not.toBeNull()
    expect($('[data-calendar-title]')?.textContent).toBe('Spring 1 · Year 1')
    expect(($('[aria-label="Previous day"]') as HTMLButtonElement).disabled).toBe(true)
    expect($('[data-next-festival]')?.textContent).toContain('Spring 19 · in 18 days')
    await click($('[aria-label="Next day"]'))
    expect($('[data-day-heading]')?.textContent).toContain('Spring 2')
    expect(save().today.actions).toBe(6)
  })

  it('pages through 30-day seasons by day buttons and swiping, with a fresh detail scroll', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(30) })
    await render(<p>Farm</p>, '/?sheet=calendar')
    await find('[data-calendar-grid="spring"]')
    $('[data-day-scroll]')!.scrollTop = 80
    await click($('[aria-label="Next day"]'))
    expect($('[data-calendar-grid="summer"] [data-day="31"]')).not.toBeNull()
    expect($('[data-day-panel]')?.dataset.dayPanel).toBe('31')
    expect($('[data-day-scroll]')?.scrollTop).toBe(0)
    await click($('[aria-label="Previous day"]'))
    const grid = $('[data-calendar-grid="spring"]')!
    const touch = (type: string, property: string, clientX: number, clientY: number) => {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, property, { value: [{ clientX, clientY }] })
      grid.dispatchEvent(event)
    }
    await act(async () => {
      touch('touchstart', 'touches', 220, 100)
      touch('touchend', 'changedTouches', 218, 180)
    })
    expect($('[data-calendar-grid="spring"]')).not.toBeNull()
    await act(async () => {
      touch('touchstart', 'touches', 220, 100)
      touch('touchend', 'changedTouches', 135, 100)
    })
    expect($$('[data-calendar-grid="summer"] [data-day]')).toHaveLength(30)
  })

  it('opens a spouse’s birthday night from the day panel and plays the loving bedside beat', async () => {
    const married = farm(1, 0, { [ONE]: { stage: 'spouse', wed: 1, house: 0 } })
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...married, calendar: { day: 10 },
      longGame: { weddings: [ONE], celebrations: {}, love: {} } } })
    await render(<p>Farm</p>, '/?sheet=calendar')
    await click(await find(`[href="/?visits=${ONE}"]`))
    const birthday = () => $$('button').find(button => button.textContent === 'Birthday night')
    await until(() => !!birthday())
    await click(birthday())
    const stage = '[data-scene^="visit:birthday:"]'
    await tapUntil(stage, `${stage} [data-visit-beat="bedside"] [data-expression="loving"][data-portrait="wedding-night"]`)
    const finish = () => $$('button').find(button => button.textContent === 'Finish')
    for (let i = 0; i < 20 && !finish(); i++) {
      const bubble = $(`${stage} button[data-step]:not([disabled])`)
      if (bubble) await click(bubble)
      else await settle()
    }
    await click(finish())
    await until(() => save().longGame?.love[ONE]?.birthday === 1)
    expect(save().longGame?.night?.visits.map(visit => visit.kind)).toEqual(['birthday'])
    expect(save().today.actions).toBe(0)
  })

  it('picks a wedding date in a later year and returns to today without losing the plan', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(3, 0, { [ONE]: { stage: 'romance' } }) })
    await render(<p>Farm</p>, `/?sheet=calendar&weddingPlan=${ONE}`)
    await find('[data-wedding-planner]')
    expect($('[data-day-panel]')?.dataset.dayPanel).toBe('4')
    await click($('[aria-label="Next year"]'))
    expect($('[data-calendar-year]')?.textContent).toBe('Spring · Year 2')
    await click($('[data-day="125"]'))
    await click($('[data-action="save-wedding-date"]'))
    await until(() => save().love[ONE]?.weddingDay === 125)
    expect($('[data-day="125"]')?.dataset.weddings).toBe('1')
    await click($('[data-action="calendar-today"]'))
    expect($('[data-calendar-year]')?.textContent).toBe('Spring · Year 1')
    expect($('[data-day-panel]')?.dataset.dayPanel).toBe('3')
    expect($('[data-planned-date]')?.textContent).toBe('Spring 5 · Year 2')
  })

  it('opens from the bar’s date over everything: the season’s 30 days, the festival, a birthday and the faces', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(3, 0, { [TWO]: f1 }) })
    await render(<p>Farm</p>, '/')
    await click($('[data-kit="account-bar"] a[aria-label^="Calendar"]'))
    expect(path).toBe('/?sheet=calendar')
    await find('[data-calendar]')
    expect($('[data-calendar-title]')?.textContent).toBe('Spring 3 · Year 1')
    expect($$('[data-calendar-grid="spring"] [data-day]')).toHaveLength(30)
    expect($('[data-day][data-today]')?.dataset.day).toBe('3')
    expect($(`[data-day="${SHOW}"]`)?.dataset.festival).toBe('flower-show')
    expect($(`[data-day="${SHOW}"] [data-cell-label]`)?.textContent).toBe('Flower Show')
    expect($(`[data-day="${SHOW}"] [data-cell-events]`)?.textContent).toBe('♥+3')
    // The Flower Show: everyone's occasion, so three faces.
    expect($(`[data-day="${SHOW}"]`)?.dataset.faces).toBe('3')
    // Today: Two's event is Ready; the panel plays it.
    expect($('[data-day-heading]')?.textContent).toBe('Spring 3 · today')
    expect($$('[data-day-panel] [data-face]').map((f) => [f.dataset.face, f.dataset.reasons])).toEqual([[TWO, 'ready']])
    expect($(`[data-face="${TWO}"] [data-action="play-event"]`)).toBeTruthy()
    // Who's in town that day, and where: each on the default schedule, the third in the cast at the Plaza on day 3.
    expect($('[data-in-town]')?.dataset.inTown).toBe('1')
    expect($$('[data-town-row]').map((r) => [r.dataset.townRow, r.dataset.count])).toEqual([['plaza', '1']])
    expect($(`[data-town-face="${THREE}"]`)).toBeTruthy()
    // Spring 10 is One's birthday (the cast's own): her face, and its event action.
    await click($('[data-day="10"]'))
    expect($('[data-day-heading]')?.textContent).toBe('Spring 10 · in 7 days')
    expect($$('[data-town-face]').map((f) => f.dataset.townFace)).toEqual([ONE])
    expect($$('[data-day-panel] [data-face]').map((f) => [f.dataset.face, f.dataset.reasons])).toEqual([[ONE, 'birthday'], [TWO, 'ready']])
    expect($('[data-day-events]')?.textContent).toBe('+1 action for events')
    expect($('[data-day-panel] [data-action]')).toBeNull()
    // The festival's panel.
    await click($(`[data-day="${SHOW}"]`))
    expect($('[data-festival-row="flower-show"]')?.textContent).toContain('Flower Show')
    expect($$('[data-day-panel] [data-face]').map((f) => f.dataset.reasons)).toEqual(['occasion ready', 'occasion', 'occasion'])
    // Another season, a tap away.
    await click($('[data-season="summer"]'))
    expect($$('[data-calendar-grid="summer"] [data-day]')).toHaveLength(30)
    expect($(`[data-day="${farmDay({ year: 1, season: 'summer', day: 21 })}"]`)?.dataset.festival).toBe('fishing-derby')
    await click($('[data-calendar] [data-action="close"]'))
    expect(path).toBe('/')
  })

  it('on the Flower Show, the bar shows its event actions and the occasion scene plays with two Umas past the budget', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(SHOW, 10) })
    await render(<p>Farm</p>, '/?sheet=calendar')
    expect($('[data-bar-chip="actions"]')?.getAttribute('aria-label')).toBe('Actions left: 0 of 10, and 3 for events')
    expect($('[data-bar-chip="actions"]')?.dataset.eventActions).toBe('3')
    await find('[data-calendar]')
    expect($('[data-day-events]')?.textContent).toBe('3 of 3 actions left for events')
    for (const [id, spent] of [[ONE, 1], [TWO, 2]] as const) {
      await click(await find(`[data-face="${id}"] [data-action="play-occasion"]`))
      expect(path).toBe(`/?sheet=calendar&occasion=${id}`)
      await until(() => $('[data-scene-title]')?.textContent?.startsWith('Flower Show · ') ?? false)
      await tapUntil(`[data-scene="occasion:${id}"]`, '[data-choice]')
      await click($('[data-option="0"]'))
      await tapUntil(`[data-scene="occasion:${id}"]`, '[data-calendar]:not(:has(~ [data-scene]))')
      await until(() => !path.includes('occasion='))
      expect(save().today).toMatchObject({ actions: 10, eventActions: spent })
      expect(save().today.occasions).toContain(`${id}:flower-show`)
    }
    // Played: its face leaves the day's to-do, and says so.
    expect($$('[data-day-panel] [data-face]').map((f) => f.dataset.face)).toEqual([THREE])
    expect($('[data-played]')?.textContent).toBe('Played today: Stand-in 1, Stand-in 2')
  })

  it('on the Flower Show, two Umas’ events play past the day’s budget from its event actions', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(SHOW, 10, { [TWO]: f1, [THREE]: f1 }) })
    for (const [id, spent] of [[TWO, 1], [THREE, 2]] as const) {
      await render(<p>Farm</p>, `/?sheet=calendar&event=${id}`)
      await find('[data-event-player]')
      await tapUntil('[data-event-player]', '[data-choice]')
      await click($('[data-option="0"]'))
      await tapUntil('[data-event-player]', '[data-level-up]')
      expect(save().love[id]!.level).toBe(1)
      expect(save().today).toMatchObject({ actions: 10, eventActions: spent })
    }
    expect(save().today.events).toEqual([TWO, THREE])
  })

  it('says no actions are left before her event plays on a plain day', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(9, 10, { [TWO]: f1 }) })
    await render(<p>Farm</p>, `/?event=${TWO}`)
    await find('[data-no-actions]')
    expect($('[data-no-actions]')?.textContent).toContain('No actions left today.')
    await click($('[data-no-actions] [data-action="back"]'))
    expect(path).toBe('/')
    expect(save().love[TWO]!.level).toBe(0)
  })
})
