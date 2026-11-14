// The perks on screen: what each reached perk does now on her profile, a miner's
// "Opens when the Mine is built", her closest friend's loved gift from Friendship 7, her pet name and keepsake under **From her**,
// the morning's item, chores and perks lines, the harvest's "from perks" and the level-up card's recipe. The invented
// stand-in pack (9000001–9000003) and a 9000004 built here; master data and the server are stubs.
import 'fake-indexeddb/auto'
import {
  arrive, newSave, pairKey, readScene, STAND_IN_FILES, storyPackFrom, type Cast, type HarvestReceipt, type Love, type SaveV4, type StoryPack, type Ties,
} from '@farm/domain'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
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
const { default: HeartsPage } = await import('./HeartsPage')
const { friendLoved, fromHer, perkList } = await import('./hearts-view')
const { heartsLines } = await import('./summary-words')
const { receiptWords } = await import('./FieldsPage')

/** The stand-in's three home, ties seeded, as the old opening brought them: the opening now brings only day 1's helper. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : arrive(s, id, pack).save), save)
const AT = '2026-11-11T10:00:00.000Z'
const [ONE, TWO, THREE, FOUR] = ['9000001', '9000002', '9000003', '9000004']
const NAMES: Record<string, string> = { [ONE]: 'Stand-in 1', [TWO]: 'Stand-in 2', [THREE]: 'Stand-in 3', [FOUR]: 'Stand-in 4' }
const nameOf = (id: string) => NAMES[id] ?? 'An Uma'
const json = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** A named farm on day 13, the stand-in's three home (`joinStandIns`), each with her love as given. */
function farm(loves: Partial<Record<string, Partial<Love>>> = {}, pack: Pick<StoryPack, 'cast' | 'ties'> = fixture.pack!): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: 13 } }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), pack)
  return {
    ...joined, arrivals: [ONE, TWO, THREE], bonds: { ...joined.bonds, [pairKey(ONE, TWO)]: 300 },
    love: Object.fromEntries(Object.entries(joined.love).map(([id, love]) => [id, { ...love, ...loves[id] }])),
  }
}

let host: HTMLDivElement
let root: Root
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !$(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect($(selector)).not.toBeNull()
  return $(selector)!
}
async function profile(id: string) {
  await act(async () => root.render(<MemoryRouter key={id} initialEntries={[`/hearts?uma=${id}`]}><Routes><Route path="*" element={<HeartsPage />} /></Routes></MemoryRouter>))
  await settle()
  await find(`[data-profile="${id}"]`)
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
  vi.unstubAllEnvs()
})

describe('her profile\'s perks', () => {
  it('says what each reached perk does now: her line\'s term with her ring, her chores, her next morning item, in her element', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ [TWO]: { stage: 'spouse', level: 0, wed: 2, ring: 8, morning: 10 } }) })
    await profile(TWO)
    const now = Object.fromEntries($$('[data-perk-now]').map((li) => [li.dataset.perkNow, li.textContent]))
    expect(now['line-20']).toBe('R5+28% at the forest · +8% ring')
    expect(now['line-10']).toBeUndefined()
    expect(now['night-chore-2']).toBe('R72 items each night')
    expect(now['morning-item']).toBe('R2Next tomorrow')
    expect(now['in-element']).toBe('F8Beside Stand-in 1')
    expect(now['closest-bond']).toBe('R4With Stand-in 1')
    expect(now.keepsake).toBe('F10Her keepsake · +0.25 quality at the forest')
  })

  it('shows her pet name and keepsake under From her once reached, and her closest friend\'s loved gift from Friendship 7', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ [ONE]: { stage: 'romance', level: 1 }, [TWO]: { stage: 'friendship', level: 7 } }) })
    await profile(ONE)
    expect($('[data-pet-name]')?.textContent).toBe('Calls you“Sprout”')
    expect($('[data-keepsake]')?.dataset.keepsake).toBe('Bent Trowel')
    expect($('[data-keepsake]')?.textContent).toContain('+0.25 quality at the Fields')
    expect($('[data-friend-loved]')).toBeNull()
    await profile(TWO)
    expect($('[data-from-her]')).toBeNull()
    expect($('[data-friend-loved]')?.dataset.friendLoved).toBe('golden-carrot')
    expect($('[data-friend-loved]')?.textContent).toBe('Stand-in 1 loves Golden Carrot')
    // Before Friendship 7, none; before Romance 1 and Friendship 10, no From her.
    const early = farm({ [ONE]: { stage: 'friendship', level: 9 }, [TWO]: { stage: 'friendship', level: 6 } })
    expect(friendLoved(early, fixture.pack!, TWO)).toBeNull()
    expect(fromHer(early, fixture.pack!, ONE)).toEqual({ petName: null, keepsake: null })
  })

  it('leaves a miner\'s line perks "Opens when the Mine is built", with nothing now', () => {
    const cast: Cast = { ...json(STAND_IN_FILES.cast as Cast) }
    cast.umas = [...cast.umas, { characterId: FOUR, outfitId: '900000401', arrives: { kind: 'beds', dormLevel: 4 }, calling: 'mining', paragraph: 'Invented.' }]
    const ties: Ties = { version: 1, ties: [...json(STAND_IN_FILES.ties as Ties).ties, { a: TWO, b: FOUR, kind: 'friends', strength: 1, line: 'They met here.', history: 'Invented.' }, { a: THREE, b: FOUR, kind: 'other', strength: 1, line: 'Neighbours.', history: 'Invented.' }] }
    const pack = storyPackFrom({ ...STAND_IN_FILES, cast, ties })
    const base = farm({}, pack)
    const save: SaveV4 = { ...base, roster: { ...base.roster, [FOUR]: base.roster[TWO]! }, love: { ...base.love, [FOUR]: { ...base.love[TWO]!, stage: 'romance', level: 7 } } }
    const list = perkList(save, pack, FOUR, nameOf)
    const line10 = list.find((p) => p.id === 'line-10')!
    expect(line10).toMatchObject({ words: '+10% at the Mine', opens: 'mine', state: 'reached', now: null })
    expect(list.find((p) => p.id === 'night-chore')).toMatchObject({ opens: 'mine', now: null })
  })
})

describe('the morning and the screens\' words', () => {
  it('words the morning items, the night\'s chores and the perks\' extras in the morning summary\'s places', () => {
    // The night's order (`heartLines`): invitations, birthdays, arrivals, morning items, chores, perks, side by side, bonds.
    const lines = heartsLines([
      { kind: 'invite', id: ONE, evening: 'walk' }, { kind: 'arrived', id: THREE, home: true }, { kind: 'item', id: TWO, items: ['shiitake@3'] },
      { kind: 'chores', items: 3, growth: 0.25 }, { kind: 'perks', items: 2 }, { kind: 'side', items: 1 },
    ], [], nameOf)
    expect(lines.map((l) => [l.text, l.to])).toEqual([
      ['✉ Stand-in 1: “Walk at dusk tonight?”', `/hearts?uma=${ONE}`],
      ['♥ Stand-in 2 left you ★3 Shiitake', `/hearts?uma=${TWO}`],
      ['Night chores · 3 items · +0.25 growth', '/warehouse'],
      ['Stand-in 3 arrived', `/hearts?uma=${THREE}`],
      ['Perks · +2 items', '/warehouse'],
      ['Side by side · +1 item', '/warehouse'],
    ])
    expect(heartsLines([{ kind: 'chores', items: 0, growth: 0.5 }], [], nameOf)[0]).toMatchObject({ text: 'Night chores · +0.5 growth', to: '/fields' })
  })

  it('says a harvest\'s extra crops from perks', () => {
    const receipt: HarvestReceipt = { stars: [2, 1, 0, 0, 0], seeds: 1, plots: 2, perks: 1 }
    expect(receiptWords(receipt, 'Carrot')).toBe('+3 Carrot (★1 × 2, ★2 × 1) · 1 from perks · 1 seed back')
    expect(receiptWords({ ...receipt, perks: 0 }, 'Carrot')).toBe('+3 Carrot (★1 × 2, ★2 × 1) · 1 seed back')
  })
})
