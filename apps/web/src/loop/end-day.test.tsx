// End the day as rendered: the bar's actions left and its words, the one-line sheet with End anyway and Back, ending at
// once when all is set or the Menu's switch is off, the out-of-actions card when the last action is spent, the night's
// fade and the morning summary after, and a second tap ending nothing more. Invented ids and the stand-in pack; master
// data and the server are stubs.
import 'fake-indexeddb/auto'
import { fieldTiles, bareTile, newLove, newRosterUma, newSave, type SaveV4 } from '@farm/domain'
import { KitStage } from '@luismlorenzana/uma-kit/ui'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ stats: new Map(), birthdays: new Map() })), setMasterLens: vi.fn() }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { useGame, resetGame } = await import('../save/game')
const { FarmBar } = await import('../shell/Bars')
const { default: OutOfActions } = await import('../shell/OutOfActions')
const { default: LoopSheets } = await import('./LoopSheets')
const { endTheDay, dismissSummary } = await import('./actions')
const { setAskBeforeEnd } = await import('./ask')
const { arrivedRelease, keepArrived } = await import('../story/news')
const { storyReady } = await import('../story/story')
// The night and End the day's sheet read the story pack: the stand-in, loaded once.
await storyReady()

const AT = '2026-11-09T10:00:00.000Z'
/** Three Umas home on day 1, a tile tilled and one growing a dry carrot; `spent` actions of the day's ten spent. */
function farm(spent = 0): SaveV4 {
  const save = newSave('u1', AT)
  const tiles = fieldTiles(save).map((t, i) => (i === 0 ? bareTile('tilled') : i === 1 ? { ...bareTile('tilled'), crop: 'carrot' as const, growth: 1 } : t))
  return {
    ...save, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }, love: { 101: newLove(), 202: newLove(), 303: newLove() },
    dorm: { level: 1, home: ['101', '202', '303'], swaps: [] }, fields: { plots: [{ tiles }] }, today: { ...save.today, actions: spent },
  }
}
const save = () => useGame.getState().save as SaveV4

let host: HTMLDivElement
let root: Root
let path = ''
function Where() {
  const location = useLocation()
  path = `${location.pathname}${location.search}`
  return null
}
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter initialEntries={[at]}><Routes><Route path="*" element={<>{node}<Where /></>} /></Routes></MemoryRouter>))
}
const settle = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
const until = async (ok: () => boolean, tries = 200) => {
  for (let i = 0; i < tries && !ok(); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(ok()).toBe(true)
}
/** The night ran and its fade has lifted. */
const night = async (day: number) => {
  await until(() => save().calendar.day === day)
  await until(() => document.body.querySelector('[data-night-fade]') === null)
}

/** A device's storage for the Menu's switch (this Node's own `localStorage` global has no methods). */
function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const items = new Map<string, string>()
  return { getItem: (k) => items.get(k) ?? null, setItem: (k, v) => void items.set(k, v), removeItem: (k) => void items.delete(k) }
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('localStorage', memoryStorage())
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-09T20:00:00.000Z'))
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
  setAskBeforeEnd(true)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('End the day', () => {
  it('shows the current five-action budget on a split day', async () => {
    const days = (actions: number): SaveV4 => {
      const save = farm(actions)
      return { ...save, today: { ...save.today, dayParts: true } }
    }
    useGame.setState({ uid: 'u1', status: 'ready', save: days(3) })
    await render(<KitStage layout="landscape"><FarmBar /></KitStage>)
    expect(host.querySelector('[data-bar-chip="actions"]')?.textContent).toBe('Morning2/5')
    await act(async () => useGame.setState({ save: days(5) }))
    expect(host.querySelector('[data-bar-chip="actions"]')?.textContent).toBe('Afternoon5/5')
  })
  it('shows the actions left in the bar, asks in one line what\'s left, and ends the day on End anyway', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(3) })
    await render(<KitStage layout="landscape"><FarmBar /></KitStage>)
    expect(host.querySelector('[data-bar-chip="actions"]')?.getAttribute('aria-label')).toBe('Actions left: 7 of 10. Morning')
    expect(host.querySelector('[data-bar-chip="actions"]')?.textContent).toBe('Morning7/10')
    const end = host.querySelector('a[aria-label="End the day: 7 actions left · 1 dry"]')
    expect(end?.getAttribute('href')).toBe('/?sheet=end')
    expect(end?.querySelector('[data-glow]')).toBeNull()
    expect(host.textContent).toContain('End day')
    await render(<LoopSheets sheet="end" />, '/?sheet=end')
    await settle()
    expect(document.body.querySelector('[data-end-line]')?.textContent).toBe('7 actions left · 1 dry')
    expect(save().calendar.day).toBe(1)
    await act(async () => (document.body.querySelector('[data-action="end-anyway"]') as HTMLButtonElement).click())
    await night(2)
    // A dry carrot didn't grow; the morning says to water it, and to plant the tilled tile.
    expect(save()).toMatchObject({
      calendar: { day: 2 }, today: { actions: 0 }, account: { updatedAt: '2026-11-09T20:00:00.000Z' },
      summary: { day: 2, nudges: [{ kind: 'water', tiles: 1 }, { kind: 'seeds', tiles: 1 }] },
    })
    expect(fieldTiles(save())[1]!.growth).toBe(1)
    expect(path).toBe('/')
  })

  it('opens the out-of-actions card when the day\'s last action is spent, once, with Not yet', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(9) })
    await render(<OutOfActions />)
    expect(document.body.querySelector('[data-out-of-actions]')).toBeNull()
    await act(async () => useGame.setState({ save: farm(10) }))
    expect(document.body.querySelector('[data-out-of-actions]')).not.toBeNull()
    await act(async () => (document.body.querySelector('[data-action="not-yet"]') as HTMLButtonElement).click())
    await settle()
    expect(document.body.querySelector('[data-out-of-actions]')).toBeNull()
    // End the day from it opens End the day's sheet.
    await act(async () => useGame.setState({ save: farm(9) }))
    await act(async () => useGame.setState({ save: farm(10) }))
    await act(async () => (document.body.querySelector('[data-action="end-the-day"]') as HTMLButtonElement).click())
    expect(path).toBe('/?sheet=end')
  })

  it('reads "All set" once the day\'s actions are spent, and ends at once', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(10) })
    await render(<KitStage layout="landscape"><FarmBar /></KitStage>)
    const end = host.querySelector('a[aria-label="All set"]')
    expect(end).not.toBeNull()
    expect(end?.querySelector('[data-glow]')).not.toBeNull() // the halo when nothing waits
    await render(<LoopSheets sheet="end" />, '/?sheet=end')
    await settle()
    expect(document.body.querySelector('[data-end-line]')).toBeNull()
    await night(2)
    expect(path).toBe('/')
  })

  it('skips the question when the Menu\'s switch is off', async () => {
    setAskBeforeEnd(false)
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<LoopSheets sheet="end" />, '/?sheet=end')
    await night(2)
  })

  it('ends a day once, however often it\'s tapped, and puts the morning away as a player\'s change', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    expect(await endTheDay(1)).toBe(true)
    expect(await endTheDay(1)).toBe(false)
    expect(save().calendar.day).toBe(2)
    vi.setSystemTime(new Date('2026-11-09T20:05:00.000Z'))
    await dismissSummary()
    expect(save()).toMatchObject({ summary: null, account: { updatedAt: '2026-11-09T20:05:00.000Z' } })
  })

  it('says a story release new to the device the next morning, first in New today, once', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    keepArrived({ number: 3 })
    expect(await endTheDay(1)).toBe(true)
    expect(save().summary!.news[0]).toEqual({ kind: 'story', number: 3 })
    expect(arrivedRelease()).toBeNull()
    expect(await endTheDay(2)).toBe(true)
    expect(save().summary!.news.some((line) => line.kind === 'story')).toBe(false)
  })
})
