// The roster's screens as rendered: the start's six cards, the redraw and three picks; the Dorm's beds,
// Upgrade and a swap through the pickers; the visitor at the Gate with Chat, Gift and "She'd like to stay"; everyone on
// the roster, home or away, with hearts, Chat and Gift. Invented outfits with chosen stats; the server is a stub.
import 'fake-indexeddb/auto'
import { CHAT_LINES, newRosterUma, newSave, picksLeft, type SaveV3 } from '@farm/domain'
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
const { default: StartPicks } = await import('./StartPicks')
const { default: DormPage } = await import('./DormPage')
const { default: RosterPage } = await import('./RosterPage')
const { GatePeek } = await import('./GatePeek')

/** Aster mining S (Metal), Beryl foraging A (Wood), Cinder fishing B, Dune fishing A (Fish), Ember (Wit C), Fable farming S. */
fixture.view = (await albumFixture(undefined, [
  { star5: [100, 100, 150, 100, 100] }, { star5: [140, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 130] },
  { star5: [100, 100, 100, 100, 140] }, { star5: [100, 100, 100, 100, 115] }, { star5: [100, 152, 100, 100, 100] },
])).view

const AT = '2026-11-09T10:00:00.000Z'
const IDS = ['81001', '81002', '81003', '81004', '81005', '81006']
const save = (): SaveV3 => useGame.getState().save as SaveV3
/** `home` of the six home at Dorm level 2 (5 beds), the rest away, on day 5, with gold, goods and Farm Rank 2. */
function farm(home = 5): SaveV3 {
  const base = newSave('u1', AT)
  return {
    ...base, calendar: { day: 5 }, gold: 5000, farm: { ...base.farm, points: 150 },
    roster: Object.fromEntries(IDS.map((id) => [id, newRosterUma(1)])), dorm: { level: 2, home: IDS.slice(0, home), swaps: [] }, buildings: { dorm: 2 },
    items: { ...base.items, carp: [2, 1, 0, 0, 0], granite: [1, 0, 0, 0, 0] },
  }
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at: string) {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await act(async () => new Promise((r) => setTimeout(r, 0)))
}

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

describe('the start\'s sheet', () => {
  it('shows six cards with three talents each, redraws once, and picks three', async () => {
    useGame.setState({ save: newSave('u1', AT) })
    await render(<StartPicks />, '/')
    const cards = $$('[data-card]')
    expect(cards.map((c) => c.dataset.card).sort()).toEqual(IDS)
    expect($('[data-card="81006"] [data-need="farming"]')?.dataset.grade).toBe('S')
    expect($('[data-card="81002"] [data-need="foraging"]')?.dataset.grade).toBe('A')
    expect($('[data-card="81004"] [data-need="fishing"]')?.dataset.grade).toBe('A')
    expect($('[data-card="81001"] [data-favourite]')?.dataset.favourite).toBe('mining')
    expect($('[data-card-title]')).not.toBeNull()
    const pick = $('[data-action="pick"]') as HTMLButtonElement
    expect([pick.textContent, pick.disabled]).toEqual(['Pick 3', true])
    await click($('[data-action="redraw"]'))
    expect(save().start.redraws).toBe(1)
    expect($('[data-action="redraw"]')?.textContent).toBe('No redraws left')
    for (const id of ['81006', '81002', '81004', '81001']) await click($(`[data-card="${id}"]`))
    // A fourth tap does nothing: three are chosen.
    expect($$('[data-card][aria-pressed="true"]').map((c) => c.dataset.card).sort()).toEqual(['81002', '81004', '81006'])
    await click($('[data-action="pick"]'))
    expect(Object.keys(save().roster).sort()).toEqual(['81002', '81004', '81006'])
    expect(save().dorm.home).toEqual(['81006', '81002', '81004'])
    expect(picksLeft(save())).toBe(0)
    expect($('[data-start]')).toBeNull()
  })

  it('asks a migrated save with two Umas for one', async () => {
    const two = { ...newSave('u1', AT), roster: { 81001: newRosterUma(1), 81003: newRosterUma(1) }, dorm: { level: 1, home: ['81001', '81003'], swaps: [] } }
    useGame.setState({ save: two })
    await render(<StartPicks />, '/')
    expect($$('[data-card]').map((c) => c.dataset.card)).not.toContain('81001')
    expect($('[data-start-want]')?.textContent).toContain('Pick 1')
  })
})

describe('the Dorm', () => {
  it('shows the beds, buys the next level for tomorrow, and swaps one home for one away', async () => {
    await render(<DormPage />, '/dorm')
    expect($('[data-beds]')?.textContent).toBe('5 of 5 beds')
    expect($$('[data-dorm-list="away"] [data-dorm-uma]').map((e) => e.dataset.dormUma)).toEqual(['81006'])
    await click($('[data-action="upgrade"]'))
    expect(save()).toMatchObject({ gold: 2000, buildings: { dorm: 3 }, dorm: { level: 2 } })
    expect($('[data-upgrade-tomorrow]')?.textContent).toBe('Level 3 tomorrow · 8 beds')
    await click($('[data-action="swap"]'))
    await click($$('[role="dialog"] button[aria-label="Beryl"]')[0])
    await click($$('[role="dialog"] button[aria-label="Fable"]')[0])
    expect(save().dorm.swaps).toEqual([{ out: '81002', in: '81006' }])
    expect($('[data-dorm-uma="81002"]')?.dataset.status).toBe('Leaves tomorrow')
    expect($('[data-dorm-uma="81006"]')?.dataset.status).toBe('Arrives tomorrow')
    await click($('[data-action="cancel-swap"]'))
    expect(save().dorm.swaps).toEqual([])
  })
})

describe('the Gate', () => {
  it('shows the visitor with her days left, chats once a day and takes a gift', async () => {
    useGame.setState({ save: { ...farm(4), visitors: [{ outfitId: '81005', from: 'gate', leaves: 10, affinity: 40 }], roster: Object.fromEntries(IDS.slice(0, 4).map((id) => [id, newRosterUma(1)])), dorm: { level: 2, home: IDS.slice(0, 4), swaps: [] } } })
    await render(<GatePeek save={save()} />, '/?peek=gate')
    expect($('[data-days-left]')?.textContent).toBe('Visiting · 5 days left')
    expect($('[data-stay]')?.dataset.stay).toBe('40')
    await click($('[data-action="chat"]'))
    await render(<GatePeek save={save()} />, '/?peek=gate')
    // Ember's top stat is Wit: one of the clever lines, her name filled in.
    expect(CHAT_LINES.clever.map((line) => line.split('{name}').join('Ember'))).toContain($('[data-chat-line]')?.textContent)
    expect(($('[data-action="chat"]') as HTMLButtonElement).disabled).toBe(true)
    expect(save().visitors[0]!.affinity).toBe(55)
    await click($('[data-action="gift"]'))
    await click($('[data-gift="carp@2"]'))
    expect(save().visitors[0]!.affinity).toBe(85)
    expect(save().items.carp).toEqual([2, 0, 0, 0, 0])
  })

  it('has her join at 2 hearts, away when no bed is free, with "She\'d like to stay"', async () => {
    const full = { ...farm(5), visitors: [{ outfitId: '81006', from: 'gate' as const, leaves: 10, affinity: 190 }], roster: Object.fromEntries(IDS.slice(0, 5).map((id) => [id, newRosterUma(1)])) }
    useGame.setState({ save: full })
    await render(<GatePeek save={save()} />, '/?peek=gate')
    await click($('[data-action="chat"]'))
    expect(save().roster['81006']).toMatchObject({ joined: 5, affinity: 205 })
    expect(save().visitors).toEqual([])
    expect($('[data-joined="81006"]')?.dataset.home).toBe('false')
    expect($('[data-joined]')?.textContent).toContain('Fable joins the farm.')
  })

  it('says when the next visitor may come, or that a bed must be free', async () => {
    useGame.setState({ save: farm(4) })
    await render(<GatePeek save={save()} />, '/?peek=gate')
    expect($('[data-no-visitor]')?.textContent).toContain('Spring 8')
    useGame.setState({ save: farm(5) })
    await render(<GatePeek save={save()} />, '/?peek=gate')
    expect($('[data-no-visitor]')?.textContent).toContain('Upgrade the Dorm')
  })
})

describe('the roster, home and away', () => {
  it('shows everyone, away dimmed, hearts on the face, and Chat and Gift on her sheet', async () => {
    useGame.setState({ save: { ...farm(5), roster: { ...farm(5).roster, 81006: { ...newRosterUma(1), affinity: 230 } } } })
    await render(<RosterPage />, '/roster?uma=81006')
    expect($$('[data-roster-cards] [data-uma]')).toHaveLength(6)
    expect($('[data-uma="81006"] [data-card-away]')?.textContent).toBe('Away')
    expect($('[data-uma="81006"] [data-card-hearts]')?.textContent).toBe('♥2')
    expect($('[data-where]')?.dataset.where).toBe('away')
    expect($('[data-hearts]')?.dataset.hearts).toBe('2')
    await click($('[data-action="chat"]'))
    expect(save().roster['81006']!.affinity).toBe(245)
    expect(save().today.chats).toEqual(['81006'])
  })
})
