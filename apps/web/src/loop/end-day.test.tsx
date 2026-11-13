// End the day as rendered: the raised tab's words and count, the one-line sheet with End
// anyway and Back, ending at once when all is set or the Menu's switch is off, the night's fade and the morning summary
// after, and a second tap ending nothing more. Invented ids and the stand-in pack; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { newBlock, newLove, newRosterUma, newSave, type SaveV4 } from '@farm/domain'
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
const { FarmBottomBar } = await import('../shell/Bars')
const { default: LoopSheets } = await import('./LoopSheets')
const { endTheDay, dismissSummary } = await import('./actions')
const { setAskBeforeEnd } = await import('./ask')
const { storyReady } = await import('../story/story')
// The night and End the day's sheet read the story pack: the stand-in, loaded once.
await storyReady()

const AT = '2026-11-09T10:00:00.000Z'
/** Three Umas home on day 1; `tending` puts each on a block with a growing carrot. */
function farm(tending = false): SaveV4 {
  const save = newSave('u1', AT)
  const blocks = tending ? (['A', 'B', 'C'] as const).map((id, i) => {
    const block = newBlock(id)
    block.tender = ['101', '202', '303'][i]!
    block.plots[0] = { crop: 'carrot', growth: 1, ready: false, regrowing: false, own: false }
    return block
  }) : save.fields.blocks
  return {
    ...save, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }, love: { 101: newLove(), 202: newLove(), 303: newLove() }, dorm: { level: 1, home: ['101', '202', '303'], swaps: [] }, fields: { blocks } }
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
  it('counts idle Umas on the raised tab, asks in one line, and ends the day on End anyway', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<FarmBottomBar page="farm" />)
    const end = host.querySelector('a[aria-label="End the day: 3 Umas idle"]')
    expect(end?.getAttribute('href')).toBe('/?sheet=end')
    expect(end?.textContent).toContain('3') // uma-kit 0.19.0 draws the count on the raised disc
    expect(end?.querySelector('[data-glow]')).toBeNull()
    expect(host.textContent).toContain('End day')
    await render(<LoopSheets sheet="end" />, '/?sheet=end')
    await settle()
    expect(document.body.querySelector('[data-end-line]')?.textContent).toBe('3 Umas idle')
    expect(save().calendar.day).toBe(1)
    await act(async () => (document.body.querySelector('[data-action="end-anyway"]') as HTMLButtonElement).click())
    await night(2)
    expect(save()).toMatchObject({ calendar: { day: 2 }, account: { updatedAt: '2026-11-09T20:00:00.000Z' }, summary: { day: 2, nudges: [{ kind: 'idle' }, { kind: 'seeds', plots: 9 }] } })
    expect(path).toBe('/')
  })

  it('reads "All set" when every Uma works, and ends at once', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(true) })
    await render(<FarmBottomBar page="farm" />)
    const end = host.querySelector('a[aria-label="All set"]')
    expect(end).not.toBeNull()
    expect(end?.querySelector('[data-glow]')).not.toBeNull() // the kit's halo when nothing waits
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
})
