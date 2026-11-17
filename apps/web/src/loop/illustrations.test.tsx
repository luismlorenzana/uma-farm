// Her illustrations in the game, the switch on: her meeting opens on its picture and ends on her bust; her confession
// shows the question's picture, then her yes's; the wedding shows its picture and the wedding night its two, as it
// begins and as it fades; the morning greeting opens on the night's companion; each one shown joins her gallery, which
// her profile opens, seen ones as pictures (full screen on a tap) and the rest locked with their titles. An Uma without
// illustrations plays as before. The invented stand-in pack (9000001–9000003), invented outfits, and uma-data's synthetic
// illustrations for 9000001; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { costOf, meet, newSave, readScene, type Love, type SaveV4, type StoryPack } from '@farm/domain'
import { ILLUSTRATION_MOMENTS } from '@luismlorenzana/uma-data'
import { syntheticIllustrations } from '@luismlorenzana/uma-data/testing'
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
const { setIllustrationSource } = await import('../dialogue/illustrations')
const { moveSpouse } = await import('@farm/domain')

const AT = '2026-11-11T10:00:00.000Z'
const DAY = 21
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
/** Her synthetic illustrations: one per moment, each id its moment's. */
const ILLS = syntheticIllustrations(Number(ONE), [...ILLUSTRATION_MOMENTS])
const ART = { artUrl: async (path: string) => `blob:${path}`, hold: () => () => undefined }
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 21, the stand-in's three home and their arrivals played; 9000001 at `love`. */
function farm(love: Partial<Love> = {}, more: Partial<SaveV4> = {}): SaveV4 {
  const fresh = readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: DAY } }, 'scene:1:open')
  const joined = [ONE, TWO, THREE].reduce((s, id) => meet(s, id, fixture.pack!).save, fresh)
  const out = { ...joined, arrivals: [ONE, TWO, THREE], today: { ...joined.today, bonds: {} }, love: { ...joined.love, [ONE]: { ...joined.love[ONE]!, ...love } }, ...more }
  return out.buildings.forge !== undefined ? readScene(out, 'scene:bench') : out
}

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
  await act(async () => root.render(
    <MemoryRouter key={at} initialEntries={[at]}>
      <Routes><Route element={<Shell />}><Route path="*" element={<>{node}<Where /></>} /></Route></Routes>
    </MemoryRouter>,
  ))
  await settle()
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const until = async (ok: () => boolean, tries = 150) => {
  for (let i = 0; i < tries && !ok(); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
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
/** What's up: the illustration's id, or null for her bust. */
const up = (): string | null => {
  const layer = $('[data-illustration]')
  return layer && !['loading', 'leaving'].includes(layer.dataset.illustration!) ? layer.dataset.illustration! : null
}
/** Taps the line until `selector` shows. */
async function tapUntil(selector: string) {
  for (let i = 0; i < 40 && !$(selector); i++) {
    const line = $('button[data-step]:not([disabled])')
    if (line) await click(line)
    else await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  }
  return find(selector)
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const pack = await storyReady()
  fixture.pack = pack
  fixture.view = castLens(pack)((await albumFixture()).view)
  setIllustrationSource({ illustrationsOf: async (id) => (id === ONE ? ILLS : null), listed: (id) => id === ONE, art: ART })
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
  setIllustrationSource(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('her big moments, full screen', () => {
  it('her meeting opens on its picture, the text box over it and no bust; it ends on her bust; the picture joins her gallery', async () => {
    const pack = await storyReady()
    useGame.setState({ uid: 'u1', status: 'ready', save: meet(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), ONE, pack).save })
    await render(<p />, '/')
    await find(`[data-scene="arrival:${ONE}"] [data-art-box] [data-beat]`)
    await until(() => up() === 'meeting')
    expect($('[data-illustration]')?.getAttribute('aria-label')).toBe('Scene meeting')
    expect($('[data-stage-bust]')).toBeNull()
    await until(() => (save().gallery[ONE] ?? []).includes('meeting'))
    // Her choice sits over the picture too; then her last lines, and the end on her bust.
    await click($('[data-action="skip"]'))
    expect($('[data-art-box] [data-option="0"]')).not.toBeNull()
    expect(up()).toBe('meeting')
    await click($('[data-option="0"]'))
    await tapUntil('[data-arrival-done]')
    expect($('[data-arrival-done] [data-stage-bust]')).not.toBeNull()
    await until(() => $('[data-illustration]') === null)
    await click($('[data-action="welcome"]'))
    await until(() => save().arrivals.includes(ONE))
    expect(save().gallery).toEqual({ [ONE]: ['meeting'] })
  })

  it('an Uma without illustrations plays her meeting as before: her bust, nothing in her gallery', async () => {
    const pack = await storyReady()
    useGame.setState({ uid: 'u1', status: 'ready', save: meet(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), TWO, pack).save })
    await render(<p />, '/')
    await find(`[data-scene="arrival:${TWO}"] [data-beat]`)
    expect($('[data-stage-bust]')).not.toBeNull()
    expect($('[data-illustration]')).toBeNull()
    expect($('[data-art-box]')).toBeNull()
    await click($('[data-action="skip"]'))
    await click(await find('[data-option="0"]'))
    await tapUntil('[data-arrival-done]')
    expect($('[data-illustration]')).toBeNull()
    expect(save().gallery).toEqual({})
  })

  it('her confession shows the question’s picture, then her yes’s; both join her gallery', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'confession', level: 10, points: 0, last: DAY - 1 }) })
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await until(() => $('[data-event-title]')?.textContent === 'The Overlook · Her confession')
    // Her bust until the question.
    expect($('[data-stage-bust]')).not.toBeNull()
    expect(up()).toBeNull()
    await click($('[data-action="skip"]'))
    await click(await find('[data-action="play-start"]'))
    for (const fork of [0, 1]) {
      await find(`[data-fork="${fork}"]`)
      await click($('[data-turn][data-place="fields"]'))
    }
    await click(await find('[data-action="play-done"]'))
    await click($('[data-action="skip"]'))
    await click(await find('[data-option="0"]'))
    await click($('[data-action="skip"]'))
    await click(await find('[data-action="play-start"]'))
    later(20_000)
    await until(() => $('[data-play-result]') !== null)
    await click($('[data-action="play-done"]'))
    // The question: her line before the answer, over its picture.
    await until(() => up() === 'confession')
    expect($('[data-art-box] [data-line]')?.dataset.line).toBe('Robin, I like you. More than a friend. I wanted you to know.')
    expect($('[data-stage-bust]')).toBeNull()
    await click($('[data-action="skip"]'))
    expect($('[data-art-box] [data-choice]')).not.toBeNull()
    expect(up()).toBe('confession')
    await click($('[data-option="0"]'))
    await until(() => up() === 'confession-yes')
    expect($('[data-art-box] [data-line]')?.dataset.line).toBe('Then let’s walk back together. Slowly.')
    await tapUntil('[data-level-up]')
    await until(() => $('[data-illustration]') === null)
    expect(save().love[ONE]).toMatchObject({ stage: 'romance', level: 0 })
    expect(save().gallery[ONE]).toEqual(['confession', 'confession-yes'])
  })

  it('the wedding shows its picture; the wedding night its two, as it begins and as it fades', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'wedding', level: 10, points: 0, last: DAY - 1, ring: 3 }, { buildings: { dorm: 1, forge: 0 } }) })
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await click(await find('[data-place-picker] [data-place="fields"]'))
    await until(() => up() === 'wedding')
    expect($('[data-stage-bust]')).toBeNull()
    await click($('[data-action="skip"]'))
    await click(await find('[data-option="0"]'))
    await click($('[data-action="skip"]'))
    await click(await find('[data-action="play-start"]'))
    later(20_000)
    await until(() => $('[data-play-result]') !== null)
    await click($('[data-action="play-done"]'))
    expect(up()).toBe('wedding')
    await click($('[data-action="skip"]'))
    await click(await find('[data-option="2"]'))
    await tapUntil('[data-reception]')
    await click($('[data-action="cake"]'))
    await click(await find('[data-action="continue"]'))
    // The wedding night (the default story's): its picture as it begins…
    await find('[data-wedding-night]')
    await until(() => up() === 'wedding-night')
    expect($('[data-wedding-night] [data-stage-bust]')).toBeNull()
    await tapUntil('[data-choice]')
    expect(up()).toBe('wedding-night')
    await click($('[data-option="0"]'))
    expect($('[data-line]')?.dataset.line).toBe('Good. Neither am I.')
    expect(up()).toBe('wedding-night')
    // …and as it fades.
    for (let i = 0; i < 4 && up() !== 'wedding-night-end'; i++) await click($('button[data-step]'))
    expect(up()).toBe('wedding-night-end')
    expect($('[data-line]')?.dataset.line).toBe('She takes your hand, and the night closes softly around you both.')
    await click($('[data-action="skip"]'))
    await find('[data-moving-in]')
    await until(() => $('[data-illustration]') === null)
    expect(save().gallery[ONE]).toEqual(['wedding', 'wedding-night', 'wedding-night-end'])
  }, 20_000)

  it('the night’s companion: the morning opens on her picture, then her greeting on her bust', async () => {
    // She was your companion last night: this morning she greets you.
    const wed = moveSpouse(farm({ stage: 'spouse', level: 0, points: 0, wed: 2, night: DAY - 1 }), ONE, 0)
    useGame.setState({ uid: 'u1', status: 'ready', save: wed })
    await render(<p />, `/?life=morning:${ONE}`)
    await find('[data-life="morning"]')
    await until(() => up() === 'companion')
    expect($('[data-step]')?.dataset.step).toBe('narrate')
    await tapUntil('[data-stage-bust]')
    expect($('[data-step]')?.dataset.step).toBe('say')
    expect(save().gallery[ONE]).toEqual(['companion'])
  })

  it('a morning link the night didn\'t give plays nothing, and her picture stays locked', async () => {
    for (const night of [undefined, DAY - 2]) {
      const wed = moveSpouse(farm({ stage: 'spouse', level: 0, points: 0, wed: 2, ...(night ? { night } : {}) }), ONE, 0)
      useGame.setState({ uid: 'u1', status: 'ready', save: wed })
      await render(<p />, `/?stale=${night ?? 0}&life=morning:${ONE}`)
      await until(() => path === `/?stale=${night ?? 0}`)
      expect($('[data-life]')).toBeNull()
      expect(save().gallery[ONE]).toBeUndefined()
    }
  })
})

describe('her gallery', () => {
  it('her profile counts it; the gallery shows the seen ones as pictures and the rest locked with their titles; a tap opens one full screen', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: { ...farm(), gallery: { [ONE]: ['confession', 'meeting'] } } })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    await until(() => $('[data-action="gallery"]')?.textContent === `2 of ${ILLUSTRATION_MOMENTS.length}Open ›`)
    await click($('[data-action="gallery"]'))
    expect(path).toBe(`/hearts?uma=${ONE}&gallery=${ONE}`)
    await find(`[data-gallery="${ONE}"] [data-tiles]`)
    expect($('[data-gallery-seen]')?.textContent).toBe(`2 of ${ILLUSTRATION_MOMENTS.length}`)
    // In the art's order: the seen ones open, the rest locked with their titles.
    expect($$('[data-tile]').map((t) => [t.dataset.tile, t.dataset.unlocked === undefined ? 'locked' : 'seen'])).toEqual(
      ILLUSTRATION_MOMENTS.map((m) => [m, m === 'meeting' || m === 'confession' ? 'seen' : 'locked']))
    expect($('[data-tile="beach"]')?.textContent).toBe('Scene beach')
    expect($('[data-tile="beach"] svg')?.getAttribute('aria-label')).toBe('Locked: Scene beach')
    await until(() => $('[data-tile="meeting"] img') !== null)
    await click($('[data-tile="meeting"]'))
    const viewer = await find('[data-viewer="meeting"]')
    await until(() => viewer.querySelector('img') !== null)
    expect($('[data-viewer-title]')?.textContent).toBe('Scene meeting 1 / 2')
    expect($('[data-action="previous"]')).toBeNull()
    await click($('[data-action="next"]'))
    expect($('[data-viewer="confession"]')).not.toBeNull()
    await click($('[data-action="close-viewer"]'))
    expect($('[data-viewer]')).toBeNull()
    await click($('[data-action="close-gallery"]'))
    await until(() => !$('[data-gallery]'))
  })

  it('an Uma without illustrations has no gallery on her profile', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm() })
    await render(<HeartsPage />, `/hearts?uma=${TWO}`)
    await find(`[data-profile="${TWO}"]`)
    await find('[data-action="album"]')
    expect($('[data-action="gallery"]')).toBeNull()
  })
})
