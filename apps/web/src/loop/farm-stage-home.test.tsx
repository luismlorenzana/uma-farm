// Home with the HD-2D farm's preview switch (F11 decision 1): off, the Hub as it was; on, the stage in its place with the
// Hub's own place models, the open quick look's place and no Phaser scene. Account's row and `?stage=` set the switch on
// this device. The stage's chunk (three.js, WebGL) is a stub here: jsdom has no WebGL; the preview checks the real one.
import 'fake-indexeddb/auto'
import { newRosterUma, newSave, type SaveV3 } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ roster: [], stats: new Map() })), masterRoster: () => null, useMaster: () => ({ status: 'loading' }) }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: null, authRequired: false, signOut: vi.fn() }),
}))
const stageProps = vi.fn()
vi.mock('./FarmStage', () => ({ default: (props: Record<string, unknown>) => { stageProps(props); return <div data-stub-stage /> } }))
vi.mock('@luismlorenzana/uma-kit/hub', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/hub')>(), HubMap: () => <div data-stub-hub />,
}))

const { useGame, resetGame } = await import('../save/game')
const { default: FarmRoute } = await import('./FarmMap')
const { readStageParam, setStageOn, stageOn, stageParam, STAGE_KEY } = await import('../app/stage-switch')
const { AccountView } = await import('../home/AccountView')

const AT = '2026-11-12T10:00:00.000Z'
function farm(): SaveV3 {
  const save = newSave('u1', AT)
  return { ...save, roster: { 101: newRosterUma(1), 202: newRosterUma(1), 303: newRosterUma(1) }, dorm: { level: 1, home: ['101', '202', '303'], swaps: [] } }
}

/** A device's storage (this Node's own `localStorage` global has no methods). */
function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() { return items.size }, clear: () => items.clear(), key: (i: number) => [...items.keys()][i] ?? null,
    getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v), removeItem: (k: string) => void items.delete(k),
  }
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
}
const $ = (selector: string) => document.body.querySelector(selector)

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('localStorage', memoryStorage())
  stageProps.mockClear()
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

describe('the preview switch (decision 1)', () => {
  it('is off by default: Home is the Hub, and the stage never loads', async () => {
    expect(stageOn()).toBe(false)
    await render(<FarmRoute />)
    expect($('[data-farm-scroll] [data-stub-hub]')).not.toBeNull()
    expect($('[data-stub-stage]')).toBeNull()
    expect(stageProps).not.toHaveBeenCalled()
  })

  it('on, draws the stage in the Hub\'s place with the Hub\'s place models and the open quick look\'s place', async () => {
    setStageOn(true)
    await render(<FarmRoute />, '/?peek=fields')
    expect($('[data-stub-stage]')).not.toBeNull()
    expect($('[data-farm-scroll]')).toBeNull()
    expect($('[data-stub-hub]')).toBeNull()
    const props = stageProps.mock.lastCall![0] as {
      places: { id: string; to: string; locked?: boolean }[]; open: string | null; paused: boolean; work: { cards: (place: string) => unknown[] }; hearts: ReadonlySet<string>
    }
    expect(props.open).toBe('fields')
    // F12: the pips' own work view and Ready hearts, for the Umas on the stage.
    expect(props.work.cards('forest')).toHaveLength(4)
    expect(props.hearts.size).toBe(0)
    expect(props.paused).toBe(false)
    expect(props.places.map((p) => p.id)).toHaveLength(23)
    expect(props.places.find((p) => p.id === 'warehouse')?.to).toBe('/warehouse')
    expect(props.places.find((p) => p.id === 'mill')?.locked).toBe(true)
    // The frame's pieces stay: the help button and the quick look over the stage.
    expect($('[data-farm-help]')).not.toBeNull()
    expect($('[data-peek="fields"]')).not.toBeNull()
  })

  it('is set by Account\'s row and by ?stage=1 and ?stage=0, on this device only', async () => {
    await render(<AccountView />, '/account')
    const row = $('[data-stage-switch]') as HTMLButtonElement
    expect(row.getAttribute('aria-checked')).toBe('false')
    expect(row.textContent).toContain('HD-2D farm (preview)')
    await act(async () => row.click())
    expect(stageOn()).toBe(true)
    expect(localStorage.getItem(STAGE_KEY)).toBe('1')
    expect(($('[data-stage-switch]') as HTMLElement).getAttribute('aria-checked')).toBe('true')
    await act(async () => ($('[data-stage-switch]') as HTMLButtonElement).click())
    expect(stageOn()).toBe(false)

    expect(stageParam('?stage=1')).toBe(true)
    expect(stageParam('?peek=gate&stage=0')).toBe(false)
    expect(stageParam('?stage=yes')).toBeNull()
    const replaced: string[] = []
    const history = { state: null, replaceState: (_: unknown, __: string, url: string) => void replaced.push(url) }
    readStageParam({ search: '?peek=gate&stage=1', pathname: '/', hash: '' }, history)
    expect(stageOn()).toBe(true)
    expect(replaced).toEqual(['/?peek=gate'])
    readStageParam({ search: '?stage=0', pathname: '/account', hash: '' }, history)
    expect(stageOn()).toBe(false)
    expect(replaced[1]).toBe('/account')
    readStageParam({ search: '', pathname: '/', hash: '' }, history)
    expect(replaced).toHaveLength(2)
  })

  it('reads "off" when the device\'s storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => undefined }
    vi.stubGlobal('localStorage', blocked)
    expect(stageOn()).toBe(false)
    expect(() => setStageOn(true)).not.toThrow()
    expect(stageOn()).toBe(false)
  })
})
