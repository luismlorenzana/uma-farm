// `/roster` as rendered: each card with her favourite line's mark and her best talent on her face, her
// best rank, and her sheet with her nine activities; the Fields' tender picker with "Hand · B" in farming. Invented
// outfits with chosen stats; the server is a stub.
import 'fake-indexeddb/auto'
import { newRosterUma, newSave, setTender, type SaveV3 } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view), masterRoster: () => fixture.view?.roster ?? null,
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined,
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { default: RosterPage } = await import('./RosterPage')
const { default: FieldsPage } = await import('./FieldsPage')

/** Aster mining S, Beryl foraging A, Cinder fishing B, Dune fishing A, Ember fishing C, Fable farming S. */
fixture.view = (await albumFixture(undefined, [
  { star5: [100, 100, 150, 100, 100] }, { star5: [140, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 130] },
  { star5: [100, 100, 100, 100, 140] }, { star5: [100, 100, 100, 100, 115] }, { star5: [100, 152, 100, 100, 100] },
])).view

const AT = '2026-11-09T10:00:00.000Z'
const IDS = ['81001', '81002', '81003', '81004', '81005', '81006']
function farm(): SaveV3 {
  const save = newSave('u1', AT)
  const roster = Object.fromEntries(IDS.map((id) => [id, newRosterUma(1)]))
  roster['81005']!.ranks.fishing = { points: 52.8, rank: 1, challenge: 3 }
  return { ...save, roster, dorm: { level: 2, home: IDS, swaps: [] } }
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at: string) {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]

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

describe('the roster\'s cards', () => {
  it('shows each Uma\'s favourite line and best talent on her face, and her best rank', async () => {
    await render(<RosterPage />, '/roster')
    expect($$('[data-roster-cards] [data-uma]').map((b) => b.getAttribute('data-uma'))).toEqual(IDS)
    const card = (id: string) => $(`[data-uma="${id}"]`)!
    expect(card('81001').querySelector('[data-favourite]')?.getAttribute('data-favourite')).toBe('mining')
    expect(card('81001').querySelector('[data-talent]')?.getAttribute('data-talent')).toBe('S')
    expect(card('81005').querySelector('[data-favourite]')?.getAttribute('data-favourite')).toBe('fishing')
    expect(card('81005').querySelector('[data-card-rank]')?.textContent).toBe('Hand · Fishing')
    expect(card('81006').querySelector('[data-card-note]')?.textContent).toBe('Farming S')
  })

  it('opens her sheet with her nine activities, points and next challenge', async () => {
    await render(<RosterPage />, '/roster?uma=81005')
    expect($('[data-uma-sheet="81005"]')).not.toBeNull()
    expect($$('[data-activity]')).toHaveLength(9)
    const fishing = $('[data-activity="fishing"]')!
    expect(fishing.textContent).toContain('Hand · 52 / 160')
    expect(fishing.textContent).toContain('Catch 10 fish at the River · 3/10')
    expect($('[data-favourite-line]')?.textContent).toContain('Fishing')
  })
})

describe('the tender\'s picker', () => {
  it('shows her farming rank and talent, opening by farming', async () => {
    useGame.setState({ save: setTender(farm(), 'A', '81002') })
    await render(<FieldsPage />, '/fields?tend=A')
    const picked = $$('[role="dialog"] button[aria-label]').map((b) => b.getAttribute('aria-label') ?? '').filter((l) => /^(Aster|Beryl|Cinder|Dune|Ember|Fable)/.test(l))
    expect(picked[0]).toBe('Fable')
    expect(document.body.textContent).toContain('Novice · S')
    expect($('[data-block="A"] [data-tender]')?.textContent).toContain('Novice · E · Farming')
  })
})
