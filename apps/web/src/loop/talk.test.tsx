// Talk that knows the day, and every occasion, as rendered (F94): a chat on her profile plays today's talk on the dialogue
// engine (`?life=talk:<id>`), her greeting first, then her line or a small talk with your line under your name and her
// staying on the stage; her own gift line; and a festival day's two occasions from the calendar, its day then its night.
// The invented stand-in with invented greetings, small talk, gift lines and occasion scenes; the server is a stub.
import 'fake-indexeddb/auto'
import { farmDay, inviteToFarm, meet, newSave, readScene, readStoryPack, STAND_IN_FILES, storyOf, todaysTalk, type PackFiles, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined, setMasterLens: () => undefined,
}))
vi.mock('../story/load', async (importOriginal) => ({ ...await importOriginal<typeof import('../story/load')>(), loadStoryPack: async () => fixture.pack }))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: { name: 'Owner' } }),
}))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { albumFixture } = await import('../album/testing')
const { useGame, resetGame } = await import('../save/game')
const { Shell } = await import('../shell/Shell')
const { storyReady } = await import('../story/story')
const { castLens, masterCast } = await import('../story/load')
const { default: HeartsPage } = await import('./HeartsPage')

const AT = '2026-11-15T10:00:00.000Z'
const ONE = '9000001'
const route = STAND_IN_FILES.routes[ONE] as { events: unknown[] }
/** The stand-in, 9000001 with invented talk and two Fishing Derby scenes (its night under the story's alias). */
const FILES: PackFiles = {
  ...STAND_IN_FILES,
  umas: {
    ...STAND_IN_FILES.umas,
    [ONE]: {
      ...(STAND_IN_FILES.umas[ONE] as object),
      greetings: { places: { dorm: ['An invented hello at the Dorm.'] } },
      smallTalk: [{ lines: [[ONE, 'An invented small talk.'], ['you', 'Your invented answer.'], [ONE, 'Her invented last word.']] }],
      giftLines: { loved: ['An invented loved line.'], liked: ['An invented liked line.'], neutral: ['An invented neutral line.'], disliked: ['An invented disliked line.'] },
    },
  },
  routes: {
    ...STAND_IN_FILES.routes,
    [ONE]: { ...route, events: [...route.events, { id: 'fishing-derby', steps: [{ say: ONE, line: 'An invented derby morning.' }] }, { id: 'derby-night', steps: [{ say: ONE, line: 'An invented derby night.' }] }] },
  },
}

const save = (): SaveV4 => useGame.getState().save as SaveV4
/** A named farm on `day`, the stand-in's three home in the Dorm, with a carrot to give. */
function farm(day: number): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day } }
  const joined = ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : inviteToFarm(meet(s, id, fixture.pack!).save, id)), readScene(fresh, 'scene:1:open'))
  return { ...joined, today: { ...joined.today, bonds: {} }, arrivals: ['9000001', '9000002', '9000003'], items: { ...joined.items, carrot: [1, 0, 0, 0, 0] } }
}

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
  await act(async () => root.render(
    <MemoryRouter key={at} initialEntries={[at]}>
      <Routes><Route element={<Shell />}><Route path="*" element={<>{node}<Where /></>} /></Route></Routes>
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

beforeAll(async () => {
  const view = (await albumFixture()).view
  fixture.pack = storyOf(readStoryPack(FILES).pack, masterCast(view))
  const pack = await storyReady()
  fixture.view = castLens(pack)(view)
})
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe('talk that knows the day', () => {
  it('a chat plays today’s talk: her greeting for the Dorm, then a small talk, your line under your name with her on the stage', async () => {
    // A spring day whose talk draws her small talk (the draw is the account's and the day's).
    const day = Array.from({ length: 12 }, (_, i) => farmDay({ year: 1, season: 'spring', day: i + 1 })).find((d) => todaysTalk(farm(d), fixture.pack!, ONE, 'steady').small !== null)!
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(day) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await click(await find('[data-action="chat"]'))
    await until(() => save().today.chats.includes(ONE))
    await find('[data-life="talk"]')
    expect(decodeURIComponent(path)).toBe(`/hearts?uma=${ONE}&life=talk:${ONE}`)
    const line = () => $('[data-life="talk"] [data-line]')?.dataset.line
    /** Taps on (a tap finishes a typed line, the next goes on) until the line shows. */
    const tapTo = async (want: string) => {
      for (let i = 0; i < 4 && line() !== want; i++) await click($('[data-life="talk"] [data-beat]'))
      expect(line()).toBe(want)
    }
    expect(line()).toBe('An invented hello at the Dorm.')
    await tapTo('An invented small talk.')
    await tapTo('Your invented answer.')
    // Your line, under your name; she stays on the stage.
    expect($('[data-life="talk"] [data-speaker]')?.textContent).toBe('Robin')
    expect($('[data-life="talk"] [data-who]')?.dataset.who).toBe(ONE)
    await tapTo('Her invented last word.')
    for (let i = 0; i < 4 && path.includes('life='); i++) await click($('[data-life="talk"] [data-beat]'))
    await until(() => !path.includes('life='))
    // The talk stays on her profile, yours under your name.
    expect($$('[data-talk-line]').map((p) => `${p.dataset.talkLine}:${p.textContent}`)).toEqual([
      'her:An invented hello at the Dorm.', 'her:An invented small talk.', 'you:Robin: Your invented answer.', 'her:Her invented last word.',
    ])
  })

  it('a default talk fills in her name, as her profile does', async () => {
    // An Uma and a spring day whose talk opens on a default line naming her (`{name}`).
    const days = Array.from({ length: 12 }, (_, i) => farmDay({ year: 1, season: 'spring', day: i + 1 }))
    const named = (d: number, id: string) => {
      const first = todaysTalk(farm(d), fixture.pack!, id, 'steady').steps[0]
      return first && 'say' in first && first.line.includes('{name}') ? first.line : null
    }
    const [id, day] = ['9000002', '9000003'].flatMap((id) => days.map((d) => [id, d] as const)).find(([id, d]) => named(d, id) !== null)!
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(day) })
    await render(<HeartsPage />, `/hearts?uma=${id}`)
    await click(await find('[data-action="chat"]'))
    await find('[data-life="talk"]')
    const name = $('[data-life="talk"] [data-speaker]')!.textContent!
    expect($('[data-life="talk"] [data-line]')?.dataset.line).toBe(named(day, id)!.split('{name}').join(name).split('{farmer}').join('Robin'))
  })
  it('a gift draws her own line for its taste', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(farmDay({ year: 1, season: 'spring', day: 3 })) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await click(await find('[data-action="gift"]'))
    await click(await find('[data-gift="carrot@1"]'))
    await until(() => save().today.gifts.includes(ONE))
    // The stand-in likes carrots.
    await until(() => ($('[data-love-note]')?.textContent ?? '').startsWith('An invented liked line.'))
  })
})

describe('every occasion on its day', () => {
  it('on the Fishing Derby, the calendar plays her day’s scene, then its night’s, each an action', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm(farmDay({ year: 1, season: 'summer', day: 10 })) })
    await render(<div />, '/?sheet=calendar')
    const row = () => $(`[data-face="${ONE}"]`)
    await until(() => row() !== null)
    expect(row()!.textContent).toContain('Fishing Derby · Fishing Derby night')
    expect($(`[data-face="${ONE}"] [data-action="play-occasion"]`)?.dataset.occasion).toBe('fishing-derby')
    await click($(`[data-face="${ONE}"] [data-action="play-occasion"]`))
    await find(`[data-scene="occasion:${ONE}"]`)
    expect($('[data-scene-title]')?.textContent).toContain('Fishing Derby')
    expect($('[data-line]')?.dataset.line).toBe('An invented derby morning.')
    await click($('[data-action="skip"]'))
    await until(() => (save().today.occasions ?? []).includes(`${ONE}:fishing-derby`))
    await until(() => $(`[data-face="${ONE}"] [data-action="play-occasion"]`)?.dataset.occasion === 'fishing-derby-night')
    await click($(`[data-face="${ONE}"] [data-action="play-occasion"]`))
    await find(`[data-scene="occasion:${ONE}"]`)
    expect($('[data-scene-title]')?.textContent).toContain('Fishing Derby night')
    expect($('[data-line]')?.dataset.line).toBe('An invented derby night.')
    await click($('[data-action="skip"]'))
    await until(() => (save().today.occasions ?? []).includes(`${ONE}:fishing-derby-night`))
    expect(save().today).toMatchObject({ actions: 0, eventActions: 2 })
  })
})
