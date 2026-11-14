// The lean start as rendered: a fresh account's name sheet, then the opening's lines with `{farmer}` filled (the pack's
// four, or the game's two in two taps), Skip from the first line, then Home on day 1 with nobody met; introducing yourself
// in town meets her, and her meeting scene plays (Skip landing on the choice, the gains on the buttons, +50 and the
// choice paid once); the Gate's words (everyone lives in town), and the Dorm for 20. The stand-ins aren't in master data: their
// faces are lettered discs. Invented outfits (the album fixture) and the invented stand-in pack; the server is a stub.
import 'fake-indexeddb/auto'
import { meet, newSave, readScene, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null }))
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
const { Shell } = await import('../shell/Shell')
const { storyReady } = await import('../story/story')
const { castLens } = await import('../story/load')
const { GatePeek } = await import('./GatePeek')
const { default: DormPage } = await import('./DormPage')

const AT = '2026-11-11T10:00:00.000Z'
const save = (): SaveV4 => useGame.getState().save as SaveV4

let host: HTMLDivElement
let root: Root
let path = ''
function Where() {
  const location = useLocation()
  path = `${location.pathname}${location.search}`
  return null
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
async function renderShell(at = '/') {
  await act(async () => root.render(<MemoryRouter key={`shell${at}`} initialEntries={[at]}><Routes><Route element={<Shell />}><Route path="*" element={<Where />} /></Route></Routes></MemoryRouter>))
  await settle()
}
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={<>{node}<Where /></>} /></Routes></MemoryRouter>))
  await settle()
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !$(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect($(selector)).not.toBeNull()
  return $(selector)!
}
/** Waits for the store to settle a change (the device write runs between ticks). */
const until = async (ok: () => boolean) => {
  for (let i = 0; i < 100 && !ok(); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(ok()).toBe(true)
}
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await settle()
}
/** Types into a React-controlled field. */
async function type(input: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await settle()
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const pack = await storyReady()
  fixture.view = castLens(pack)((await albumFixture()).view)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
  useGame.setState({ uid: 'u1', status: 'ready', save: newSave('u1', AT) })
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

/** Names the farmer on the name sheet. */
async function nameAs(name: string) {
  const field = await find('[data-name-field]') as HTMLInputElement
  await type(field, name)
  await click($('[data-action="name"]'))
  await until(() => save().farmer.name === name)
}
/** The opening's lines, one tap each, to its end: what each said, and the taps it took. */
async function readOpening(): Promise<string[]> {
  await find('[data-scene="scene:1:open"] [data-beat]')
  const lines: string[] = []
  while ($('[data-scene="scene:1:open"] [data-beat]')) {
    lines.push($('[data-line]')!.textContent!)
    await click($('[data-beat]'))
  }
  return lines
}

describe('a fresh farm on v4', () => {
  it('names the farmer, plays the pack\'s opening, and opens Home on day 1 with nobody met', async () => {
    await renderShell()
    const field = await find('[data-name-field]') as HTMLInputElement
    const go = $('[data-action="name"]') as HTMLButtonElement
    expect(field.placeholder).toBe('Farmer')
    expect(go.disabled).toBe(true)
    await type(field, 'R2')
    expect($('[data-name-why]')?.textContent).toBe('Letters, spaces, \' and - only')
    expect(go.disabled).toBe(true)
    await type(field, '  Robin   Lea ')
    expect(go.disabled).toBe(false)
    await click(go)
    await until(() => save().farmer.name === 'Robin Lea')
    expect(save().account.updatedAt).not.toBe(AT) // the first stamp

    // The stand-in pack's opening: four lines, three narrated and the farmer's thought, `{farmer}` filled.
    expect((await find('[data-scene-title]')).textContent).toBe('Day 1')
    const lines = await readOpening()
    expect(lines).toHaveLength(4)
    expect(lines[1]).toBe('The keys came in a letter with your name on it, Robin Lea.')
    expect(lines.at(-1)).toBe('Then I’d better go and say hello.')
    expect(lines.join(' ')).not.toContain('{farmer}')
    await until(() => save().diary.read.includes('scene:1:open'))
    await settle()

    // Home on day 1: no scene, no card, and nobody met yet: everyone is in town.
    expect(path).toBe('/')
    expect($('[data-scene]')).toBeNull()
    expect(save().calendar.day).toBe(1)
    expect(save().roster).toEqual({})
    expect(save().arrivals).toEqual([])
  })

  it('the game\'s own opening: two lines (nobody comes to the Gate), and Home on the second tap', async () => {
    const pack = await storyReady() as { opening: StoryPack['opening'] }
    const opening = pack.opening
    pack.opening = null
    try {
      await renderShell()
      await nameAs('Robin')
      const lines = await readOpening()
      expect(lines).toEqual([
        'Morning, Robin. The farm is yours now, weeds and all.',
        'One block is tilled, and nine Carrot seeds wait in the Fields.',
      ])
      await until(() => save().diary.read.includes('scene:1:open'))
      await settle()
      expect(path).toBe('/')
      expect($('[data-scene]')).toBeNull()
      expect(save().roster).toEqual({})
    } finally {
      pack.opening = opening
    }
  })

  it('Skip works from the first line: the opening is read, and Home opens', async () => {
    await renderShell('/fields')
    await nameAs('Robin')
    await find('[data-scene="scene:1:open"] [data-beat="0"]')
    await click($('[data-action="skip"]'))
    await until(() => save().diary.read.includes('scene:1:open'))
    await settle()
    expect(path).toBe('/')
    expect($('[data-scene]')).toBeNull()
    expect(save().roster).toEqual({})
  })

  it('introducing yourself meets her: her meeting scene plays, +50 and the choice paid once, and she lives in town', async () => {
    const pack = await storyReady()
    useGame.setState({ save: meet(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), '9000001', pack).save })
    expect(save().dorm.home).toEqual([])

    await renderShell('/')
    await find('[data-scene="arrival:9000001"] [data-beat]')
    expect($('[data-scene-title]')?.textContent).toMatch(/^Meeting Stand-in 1/)
    await click($('[data-action="skip"]'))
    expect($$('[data-option]').map((o) => o.dataset.gain)).toEqual(['30', '10'])
    await click($('[data-action="skip"]')) // never past the choice
    expect($('[data-choice]')).not.toBeNull()
    await click($('[data-option="0"]'))
    expect($('[data-line]')?.textContent).toBe('Then I’ll have it green by the weekend.')
    await click($('[data-beat]'))
    await click($('[data-beat]'))
    expect($('[data-arrival-done]')?.dataset.points).toBe('80')
    expect($('[data-lives]')?.textContent).toBe('She lives in town: find her there.')
    await click($('[data-action="welcome"]'))
    await until(() => save().arrivals.includes('9000001'))
    expect(save().love['9000001']).toMatchObject({ points: 80, flags: ['first-row'] })
    await settle()
    expect(path).toBe('/')
    expect($('[data-scene]')).toBeNull()
  })
})

describe('an open pack\'s placeholders', () => {
  it('an arrival written with no choice plays to its end, then the game\'s hello, paying as one with a choice does', async () => {
    const pack = await storyReady()
    const route = pack.route
    pack.route = async (id) => (id === '9000001' ? { events: [{ id: 'arrival', steps: [{ narrate: 'Someone new leans on the Gate.' }] }] } : route(id))
    try {
      useGame.setState({ save: meet(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), '9000001', pack).save })
      await renderShell('/')
      await find('[data-scene="arrival:9000001"] [data-beat]')
      await click($('[data-beat]'))
      expect($$('[data-option]').map((b) => b.dataset.gain)).toEqual(['30', '10'])
      await click($('[data-option="0"]'))
      expect($('[data-arrival-done]')?.dataset.points).toBe('80')
      await click($('[data-action="welcome"]'))
      await until(() => save().arrivals.includes('9000001'))
      expect(save().love['9000001']!.points).toBe(80)
    } finally {
      pack.route = route
    }
  })
})

describe('a face master data lacks', () => {
  it('is a lettered disc named for the stand-in, through the resolver', async () => {
    const { LetterDisc } = await import('../master/album-art')
    const { outfitFor } = await import('../story/story')
    await render(<div style={{ width: 40, height: 40 }}><LetterDisc id="9000002" size={40} /></div>)
    expect($('[data-disc="9000002"]')?.textContent).toBe('S2')
    expect(fixture.view!.album.get('9000002')?.name).toBe('Stand-in 2')
    expect(outfitFor('9000002')).toBe('900000201')
    expect(outfitFor('81001')).toBe('81001')
  })
})

describe('the Gate and the Dorm', () => {
  it('nobody comes to the Gate: its quick look says everyone lives in town', async () => {
    const pack = await storyReady()
    const named: SaveV4 = readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open')
    await render(<GatePeek save={named} />)
    expect($('[data-everyone]')?.textContent).toBe('Everyone lives in town.')
    expect($('[data-action="hello"]')).toBeNull()
    await render(<GatePeek save={meet(named, '9000001', pack).save} />)
    expect($('[data-everyone]')?.textContent).toBe('Meet everyone else in town.')
  })

  it('shows the Dorm for 20\'s eight levels', async () => {
    useGame.setState({ save: { ...newSave('u1', AT), farmer: { name: 'Robin' } } })
    await render(<DormPage />, '/dorm')
    expect($$('[data-ladder-level]').map((li) => li.dataset.ladderLevel)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
    expect($('[data-ladder-level="8"]')?.textContent).toContain('20 beds')
    expect($('[data-dorm-ladder]')?.textContent).not.toContain('arrive')
    expect($('[data-next-level]')?.textContent).toBe('Level 2 · 5 beds')
  })
})

describe('the cast keeps everyone on the farm', () => {
  it('adds an Uma the pack doesn\'t hold, from a save, to the cast: her events play the game\'s cards', async () => {
    const { meet, eventOf, placeholderEvent, readiness } = await import('@farm/domain')
    const { castIds, storyPack } = await import('../story/story')
    const pack = await storyReady()
    const farm = meet(meet(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), '9000001', pack).save, '9000099', pack).save
    expect(castIds()).not.toContain('9000099')
    await act(async () => useGame.setState({ save: farm }))
    expect(castIds()).toEqual(['9000001', '9000002', '9000003', '9000099'])
    expect(await storyReady()).toBe(storyPack())
    const kept = storyPack()!
    expect(readiness({ ...farm, love: { ...farm.love, '9000099': { ...farm.love['9000099']!, points: 200 } } }, kept, '9000099')).toMatchObject({ rung: 'f1' })
    expect((await eventOf(kept, '9000099', 'f1')).steps).toEqual(placeholderEvent('9000099', 'f1'))
  })
})
