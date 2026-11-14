// Heart events on screen, the switch on: an event from her row's ● Ready
// plays through its lines, Skip stops at the choice, each option shows its gain, a play runs to its grade, and the
// level-up card lists it all; her confession's Not yet, then Ask her and Yes with the stage-up; a Memory replayed pays
// nothing; the morning's Ready line plays her event. The invented stand-in pack (9000001–9000003) and invented outfits;
// master data and the server are stubs.
import 'fake-indexeddb/auto'
import { costOf, meet, newSave, readScene, type Love, type SaveV4, type StoryPack } from '@farm/domain'
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
const { default: HeartsPage } = await import('./HeartsPage')
const { heartsLines } = await import('./summary-words')

/** The stand-in's three home, ties seeded, as if met: the opening brings nobody, and day 1's visitor waits at the Gate. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : meet(s, id, pack).save), save)
const AT = '2026-11-11T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 3, the stand-in's three home (`joinStandIns`) and their arrivals played; 9000001 at `love`. */
function farm(love: Partial<Love> = {}): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: 3 } }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), fixture.pack!)
  return { ...joined, arrivals: [ONE, TWO, THREE], today: { ...joined.today, bonds: {} }, love: { ...joined.love, [ONE]: { ...joined.love[ONE]!, ...love } } }
}
/** Her bar for `rung` full. */
const ready = (stage: Love['stage'], level: number, rung: string, extra = 0): Partial<Love> => ({ stage, level, points: costOf(rung) + extra })

/** The plays' clock: `later(ms)` moves it on, so a round ends without waiting it out. */
let offset = 0
const later = (ms: number) => { offset += ms }

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
  const page = <>{node}<Where /></>
  await act(async () => root.render(
    <MemoryRouter key={at} initialEntries={[at]}>
      <Routes><Route element={<Shell />}><Route path="*" element={page} /></Route></Routes>
    </MemoryRouter>,
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
/** Taps her bubble (each tap finishes a line, then goes on) until `selector` shows. */
async function tapUntil(selector: string) {
  for (let i = 0; i < 40 && !$(selector); i++) {
    const bubble = $('[data-event-player] button[data-step]:not([disabled])')
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
  offset = 0
  const real = performance.now.bind(performance)
  vi.spyOn(performance, 'now').mockImplementation(() => real() + offset)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('her event from her row', () => {
  it('plays Friendship 1 from ● Ready: the place card, her lines, Skip stopping at the choice, each option\'s gain, then the play', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(ready('friendship', 0, 'f1', 2)) })
    await render(<HeartsPage />, '/hearts')
    await click(await find(`[data-heart-row="${ONE}"] [data-action="play-event"]`))
    expect(path).toBe(`/hearts?event=${ONE}`)
    await find('[data-event-player]')
    await until(() => $('[data-event-title]')?.textContent === 'The Fields · Friendship 1')
    expect($('[data-place-card]')?.dataset.frame).toBe('vegetable-garden')
    expect($('[data-step]')?.dataset.step).toBe('narrate')
    await click($('[data-action="skip"]'))
    // Skip stops at the choice, never past it; the line before it stays.
    await find('[data-choice]')
    expect($('[data-step]')?.textContent).toContain('Help me pick?')
    expect($$('[data-option]').map((o) => [o.dataset.gain, o.textContent])).toEqual([['30', 'Show me which ones.+30'], ['10', 'Race you to the end of the row.+10']])
    await click($('[data-option="0"]'))
    // The play opens on its seed: her favourites, starred.
    await find('[data-play="pick"][data-phase="intro"]')
    expect($('[data-play-title]')?.textContent).toBe('Pick the ripe ones')
    expect($$('[data-favourites] [data-item-icon]').map((i) => i.dataset.itemIcon)).toEqual(['golden-carrot', 'carrot', 'potato', 'cabbage'])
    expect($('[data-legend]')?.textContent).toBe('Fine +0 · Great +15 · Perfect +30')
    // Nothing is saved while it plays: left now, she stays Ready.
    expect(save().love[ONE]!.level).toBe(0)
  })

  it('plays a Walk to its grade, then the level-up card: the sum, the perk, the Memory, the unlock and the next rung', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(ready('friendship', 4, 'f5', 40)) })
    const before = save().account.updatedAt
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await until(() => $('[data-event-title]')?.textContent === 'The orchard bench · Friendship 5')
    await tapUntil('[data-choice]')
    await click($('[data-option="0"]'))
    await tapUntil('[data-play="walk"]')
    expect($('[data-loves]')?.textContent).toBe('Stand-in 1: “I love the Fields.”')
    await click($('[data-action="play-start"]'))
    for (const fork of [0, 1]) {
      await find(`[data-fork="${fork}"]`)
      await click($('[data-turn][data-place="fields"]'))
    }
    await find('[data-play-result="perfect"]')
    expect($('[data-play-result]')?.textContent).toContain('Perfect · +30')
    await click($('[data-action="play-done"]'))
    const card = await tapUntil('[data-level-up]')
    expect(card.dataset.levelUp).toBe('f5')
    expect($('[data-sum]')?.textContent).toBe('+50 event · +30 choice · +30 Perfect = +110 toward Friendship 6 (+40 banked)')
    expect($('[data-card-perk]')?.textContent).toBe('Perk×1.05 rank points')
    expect($('[data-card-memory]')?.textContent).toContain('“The long way round.” saved')
    expect($('[data-card-unlock]')?.textContent).toBe('UnlockedNew place · the orchard bench')
    expect($('[data-card-next]')?.textContent).toContain('Next: Friendship 6 · 400 points')
    expect($('[data-card-next]')?.textContent).toContain('150 / 400')
    expect($('[data-card-next]')?.textContent).toContain('Opens: +0.25 growth on a block each night')
    expect(save().love[ONE]).toMatchObject({ stage: 'friendship', level: 5, points: 150 })
    expect(save().memories[ONE]).toEqual(['f5'])
    expect(save().today.events).toEqual([ONE])
    expect(save().account.updatedAt).not.toBe(before)
    await click($('[data-action="continue"]'))
    await until(() => !$('[data-event-player]'))
    expect(path).toBe('/hearts')
  })

  it('greys an option whose goods you lack ("Need 1 Basil") and shows the taste an option reveals', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(ready('friendship', 3, 'f4')) })
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await tapUntil('[data-choice]')
    const basil = $('[data-option="0"]') as HTMLButtonElement
    expect(basil.disabled).toBe(true)
    expect(basil.querySelector('[data-need]')?.textContent).toBe('Need 1 Basil')
    expect(($('[data-option="1"]') as HTMLButtonElement).disabled).toBe(false)
    await act(async () => root.unmount())
    root = createRoot(host)
    useGame.setState({ save: farm(ready('friendship', 6, 'f7')) })
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await tapUntil('[data-choice]')
    expect($('[data-option="0"] [data-extra]')?.textContent).toBe('· learns a like')
  })
})

describe('her confession', () => {
  it('Not yet keeps her a close friend; Ask her on her profile, once a day, then Yes opens romance with the stage-up', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'confession', level: 10, points: 0, last: 2 }) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await click(await find('[data-next] [data-action="play-event"]'))
    await until(() => $('[data-event-title]')?.textContent === 'The Overlook · Her confession')
    // Two plays and two choices: skip to each.
    await click($('[data-action="skip"]'))
    await click(await find('[data-action="play-start"]'))
    for (const fork of [0, 1]) {
      await find(`[data-fork="${fork}"]`)
      await click($('[data-turn][data-place="fields"]'))
    }
    await click(await find('[data-action="play-done"]'))
    await click($('[data-action="skip"]'))
    await click(await find('[data-option="1"]'))
    await click($('[data-action="skip"]'))
    await click(await find('[data-action="play-start"]'))
    // A pick round with no taps: a Fine, never a fail.
    later(20_000)
    await until(() => $('[data-play-result]') !== null)
    expect($('[data-play-result]')?.dataset.playResult).toBe('fine')
    await click($('[data-action="play-done"]'))
    await click($('[data-action="skip"]'))
    await find('[data-choice]')
    expect($$('[data-option]').map((o) => o.textContent)).toEqual(['♥I feel the same.+30', 'Not yet. Can we stay as we are?+10'])
    await click($('[data-option="1"]'))
    await tapUntil('[data-level-up]')
    expect($('[data-level-up]')?.textContent).toContain('Not yet')
    expect($('[data-card-next]')?.textContent).toContain('She stays a close friend.')
    expect(save().love[ONE]).toMatchObject({ stage: 'confession', friend: true })
    await click($('[data-action="continue"]'))
    await until(() => !$('[data-event-player]'))
    // Her profile: "She said “Not yet”" and Ask her.
    expect($('[data-next-words]')?.textContent).toBe('She said “Not yet”')
    await click(await find('[data-action="ask-her"]'))
    await until(() => $('[data-event-title]')?.textContent === 'Ask her · the Overlook')
    await tapUntil('[data-choice]')
    // Ask her pays nothing: no gains on its buttons.
    expect($$('[data-option]').map((o) => o.textContent)).toEqual(['♥I feel the same.', 'Not yet. Can we stay as we are?'])
    const points = save().love[ONE]!.points
    await click($('[data-option="0"]'))
    await tapUntil('[data-stage-up]')
    expect($('[data-stage-up]')?.textContent).toContain('Partners')
    expect($$('[data-opens] li').map((l) => l.textContent)).toContain('· R1 · Dates; her pet name for you')
    expect(save().love[ONE]).toMatchObject({ stage: 'romance', level: 0, points })
    expect(save().today.asked).toEqual([ONE])
    expect(save().today.events).toEqual([ONE])
    await click($('[data-action="continue"]'))
    await until(() => !$('[data-event-player]'))
  })
})

describe('Memories', () => {
  it('her album lists her Memories; a replay from a choice point plays every option open and pays nothing', async () => {
    const played = farm(ready('friendship', 1, 'f2'))
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...played, memories: { [ONE]: ['f1'] }, love: { ...played.love, [ONE]: { ...played.love[ONE]!, stage: 'friendship', level: 1 } } } })
    const before = JSON.stringify(save())
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-action="album"]')).textContent).toBe('1 of 26Album ›')
    await click($('[data-action="album"]'))
    await find(`[data-album="${ONE}"]`)
    expect($$('[data-tile]').slice(0, 3).map((t) => [t.dataset.tile, t.dataset.state])).toEqual([['f1', 'played'], ['f2', 'next'], ['f3', 'locked']])
    expect($('[data-tile="f1"]')?.textContent).toContain('First rows, side by side.')
    await click($('[data-tile="f1"]'))
    await click(await find('[data-action="replay-choice"][data-choice-point="1"]'))
    await until(() => $('[data-event-title]')?.textContent === 'Memory · Friendship 1 · the Fields')
    // From its choice point, with her question before it.
    expect($('[data-step]')?.dataset.step).toBe('say')
    await tapUntil('[data-choice]')
    expect($$('[data-option]').map((o) => o.textContent)).toEqual(['Show me which ones.', 'Race you to the end of the row.'])
    expect($('[data-choice]')?.textContent).toContain('A replay: every option is open, and nothing pays.')
    await click($('[data-option="1"]'))
    await click(await find('[data-action="play-start"]'))
    later(20_000)
    await until(() => $('[data-play-result]') !== null)
    // A replay's play shows its grade, not its points.
    expect($('[data-play-result]')?.textContent).toContain('Fine')
    expect($('[data-play-result]')?.textContent).not.toContain('+0')
    expect($('[data-legend]')?.textContent).toBe('A replay: nothing pays.')
    await click($('[data-action="play-done"]'))
    await tapUntil('[data-end-note]')
    expect($('[data-end-note]')?.textContent).toContain('Replays give no points.')
    expect(JSON.stringify(save())).toBe(before)
  })
})

describe('the morning', () => {
  it('a Ready line plays her event over the morning', () => {
    const lines = heartsLines([], [{ id: ONE, rung: 'f1', place: 'the Fields' }], () => 'Stand-in 1')
    expect(lines[0]).toEqual({ key: `ready:${ONE}`, to: `/?event=${ONE}`, tag: 'Play', text: '● Ready · Stand-in 1 · Friendship 1 · the Fields' })
  })
})
