// Her route on her profile (on the Hearts tab), the
// switch on: her level and her bar in the ladder's colour with what's banked, Ready or what it waits for, Chat +15 with her
// line and the "+N" over her face, the gift picker's points and "?" (her loved good from F1, a given good learnt), Praise
// +20 after a rank-up overnight, and the morning's birthday line. The invented stand-in pack (9000001's birthday is Spring
// 4 in its cast) and invented outfits; the server is a stub.
import 'fake-indexeddb/auto'
import { meet, newSave, readScene, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
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
const { endTheDay } = await import('./actions')
const { summaryParts } = await import('./summary-words')

/** The stand-in's three home, ties seeded, as the old opening brought them: the opening now brings only day 1's helper. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : meet(s, id, pack).save), save)
const AT = '2026-11-11T10:00:00.000Z'
const ONE = '9000001'
const THREE = '9000003'
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on `day`, the stand-in's three home (`joinStandIns`, their ties seeded and listed on an earlier morning), with goods in
 * the Warehouse. */
function farm(day = 2): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), fixture.pack!)
  return { ...joined, today: { ...joined.today, bonds: {} }, arrivals: [ONE, '9000002', THREE], items: { ...joined.items, carrot: [0, 0, 1, 0, 0], 'golden-carrot': [1, 0, 0, 0, 0], limestone: [1, 0, 0, 0, 0] } }
}
const withLove = (s: SaveV4, id: string, love: Partial<SaveV4['love'][string]>): SaveV4 => ({ ...s, love: { ...s.love, [id]: { ...s.love[id]!, ...love } } })

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at: string) {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
  await settle()
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !$(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect($(selector)).not.toBeNull()
  return $(selector)!
}
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 100 && !ok(); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(ok()).toBe(true)
}
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await settle()
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
  useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('her profile on v4', () => {
  it('shows her level, her bar with what\'s banked, and Ready or what it waits for', async () => {
    useGame.setState({ save: withLove(farm(), ONE, { level: 1, points: 300 }) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await find(`[data-love="${ONE}"]`)
    expect($('[data-profile] [data-level-words]')?.textContent).toBe('Friend · F1')
    expect($('[data-bar]')?.dataset.bar).toBe('240/240')
    expect($('[data-banked]')?.textContent).toContain('+60 banked')
    expect($('[data-next] h3')?.textContent).toBe('Next: Friendship 2')
    expect($('[data-next-words]')?.textContent).toBe('Ready')
    expect($('[data-profile] [data-ready-chip]')).not.toBeNull()
    // Short of the bar: what's left; 9000002's F1 isn't scripted in the stand-in pack, so only her bar waits.
    await act(async () => useGame.setState({ save: withLove(farm(), ONE, { level: 1, points: 117 }) }))
    await settle()
    expect($('[data-next-words]')?.textContent).toBe('123 to go')
    expect($('[data-bar-fill]')?.dataset.barFill).toBe('49')
    await render(<HeartsPage />, '/hearts?uma=9000002')
    await find('[data-love="9000002"]')
    expect($('[data-next-words]')?.textContent).toBe('200 to go')
  })

  it('chats once a day for +15, with her line and the "+N" over her face', async () => {
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    const chat = await find('[data-action="chat"]')
    expect(chat.textContent).toBe('Chat +15')
    await click(chat)
    await until(() => save().love[ONE]!.points === 15)
    expect((await find('[data-love-float]')).textContent).toBe('+15')
    expect($('[data-chat-line]')?.textContent).not.toContain('{name}')
    expect(($('[data-action="chat"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('lists each good\'s points for her in the gift picker, "?" until her taste is known, and learns a given one', async () => {
    useGame.setState({ save: withLove(farm(), ONE, { level: 1 }) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await click(await find('[data-action="gift"]'))
    const points = () => Object.fromEntries($$('[data-gift]').map((b) => [b.dataset.gift, b.dataset.giftPoints]))
    // Her loved good shows from F1; the rest wait to be tried.
    expect(points()).toEqual({ 'carrot@3': '?', 'golden-carrot@1': '60', 'limestone@1': '?' })
    await click($('[data-gift="carrot@3"]'))
    await until(() => save().love[ONE]!.points === 36)
    expect(save().love[ONE]!.known).toEqual(['carrot'])
    expect((await find('[data-love-note]')).textContent).toBe('She likes it. +36')
    expect($('[data-love-float]')?.textContent).toBe('+36')
    expect(($('[data-action="gift"]') as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows Praise +20 after a rank-up overnight, and pays it once', async () => {
    // 9000003's fishing points are full and her challenge met: she ranks up tonight.
    const s = farm()
    useGame.setState({ save: { ...s, roster: { ...s.roster, [THREE]: { ...s.roster[THREE]!, ranks: { ...s.roster[THREE]!.ranks, fishing: { points: 100, rank: 0, challenge: 30 } } } } } })
    await act(async () => { await endTheDay(2) })
    await until(() => save().calendar.day === 3)
    expect(save().today.praise).toContain(THREE)
    await render(<HeartsPage />, `/hearts?uma=${THREE}`)
    const praise = await find('[data-action="praise"]')
    expect(praise.textContent).toBe('Praise +20')
    await click(praise)
    await until(() => save().today.praised.includes(THREE))
    expect(save().love[THREE]!.points).toBe(20)
    expect($('[data-action="praise"]')).toBeNull()
  })
})

describe('the morning\'s Hearts', () => {
  it('says her birthday the day before and on the day', async () => {
    await act(async () => { await endTheDay(2) })
    await until(() => save().calendar.day === 3)
    const nameOf = (id: string) => fixture.view!.album.get(id)?.name ?? 'An Uma'
    expect(summaryParts(save().summary!, nameOf).find((p) => p.section === 'hearts')?.lines).toEqual([
      { key: `birthday:${ONE}`, to: `/hearts?uma=${ONE}`, text: '★ Tomorrow: Stand-in 1’s birthday' },
    ])
    await act(async () => { await endTheDay(3) })
    await until(() => save().calendar.day === 4)
    expect(summaryParts(save().summary!, nameOf).find((p) => p.section === 'hearts')?.lines[0]?.text).toBe('★ Stand-in 1’s birthday today')
    const anniversary = summaryParts({ ...save().summary!, hearts: [{ kind: 'anniversary', id: ONE, when: 'today', item: 'carrot' }] }, nameOf)
    expect(anniversary.find((p) => p.section === 'hearts')?.lines[0]?.text).toBe('♥ Stand-in 1’s anniversary · ★5 Carrot left for you')
  })
})

describe('what her next event waits for, in words', () => {
  it('names each wait', async () => {
    const { readyWords } = await import('./love-words')
    const at = (waits: Parameters<typeof readyWords>[0]['waits'], rung: string | null = 'r5') => readyWords({ rung, ready: false, waits }, { points: 300, cost: 360 }, () => 'Stand-in 2')
    expect([
      at({ kind: 'bar' }), at({ kind: 'day' }, 'confession'), at({ kind: 'ring' }, 'proposal'), at({ kind: 'away' }), at({ kind: 'today' }),
      at({ kind: 'setup', setup: { kind: 'working', activity: 'fishing' } }), at({ kind: 'setup', setup: { kind: 'item', good: 'carrot' } }),
      at({ kind: 'setup', setup: { kind: 'bond', with: '9000002', level: 3 } }), at({ kind: 'opens', place: 'mine' }),
      at({ kind: 'night' }, 's2'), at({ kind: 'friend' }, 'confession'), at({ kind: 'done' }, null),
    ]).toEqual([
      'Romance 5 · 60 to go', 'Her confession · Ready tomorrow', 'The proposal · Needs a ring', 'Romance 5 · Invite her to the farm', 'Romance 5 · tomorrow: one event a day',
      'Romance 5 · the Fishery, when she works there', 'Romance 5 · with Carrot in the Warehouse', 'Romance 5 · bond 3 with Stand-in 2', 'Romance 5 · Opens when the Mine is built',
      'Spouse 2 · comes tonight', 'Her confession · she said “Not yet”', 'Her route is complete',
    ])
  })
})
