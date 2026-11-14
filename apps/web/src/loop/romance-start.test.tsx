// The romance core's start as rendered, the switch on: a fresh account's name
// sheet, the re-cut opening with `{farmer}` filled, the opening three's arrival scenes in turn (Skip landing on the choice,
// the gains on the buttons, +50 and the choice paid once), chapter 1's card and planting; the Gate's words and the Dorm
// for 20. The stand-ins aren't in master data: their faces are lettered discs. Invented outfits (the album fixture) and
// the invented stand-in pack; the server is a stub.
import 'fake-indexeddb/auto'
import { joinOpening, newSave, readScene, type Cast, type SaveV4 } from '@farm/domain'
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

describe('a fresh farm on v4', () => {
  it('names the farmer, plays the opening, then the three arrivals, and ends on chapter 1\'s card and planting', async () => {
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

    // The opening, re-cut: the Mayor welcomes you by name, and it ends as three come up the road.
    await find('[data-scene="scene:1:open"] [data-beat]')
    const lines: string[] = []
    while ($('[data-scene="scene:1:open"] [data-beat]')) {
      lines.push($('[data-line]')!.textContent!)
      await click($('[data-beat]'))
    }
    expect(lines[1]).toBe('“Welcome, Robin Lea! I’m Hollis Pryor, mayor of the town down the road.”')
    expect(lines.at(-1)).toBe('Three Umas come up the road.')
    expect(lines.join(' ')).not.toContain('{farmer}')
    await until(() => Object.keys(save().roster).length === 3)
    expect(Object.keys(save().roster)).toEqual(['9000001', '9000002', '9000003'])
    expect(save().dorm.home).toEqual(['9000001', '9000002', '9000003'])

    // The first arrival: her bust a lettered disc, Skip lands on the choice, the gains shown on the buttons.
    await find('[data-scene="arrival:9000001"] [data-beat]')
    expect($('[data-scene-title]')?.textContent).toBe('Stand-in 1 arrives · Gate')
    await click($('[data-action="skip"]'))
    expect($$('[data-option]').map((o) => o.dataset.gain)).toEqual(['30', '10'])
    await click($('[data-action="skip"]')) // never past the choice
    expect($('[data-choice]')).not.toBeNull()
    await click($('[data-option="0"]'))
    expect($('[data-line]')?.textContent).toBe('Then I’ll have it green by the weekend.')
    await click($('[data-beat]'))
    await click($('[data-beat]'))
    expect($('[data-arrival-done]')?.dataset.points).toBe('80')
    await click($('[data-action="welcome"]'))
    await until(() => save().arrivals.includes('9000001'))
    expect(save().love['9000001']).toMatchObject({ points: 80, flags: ['first-row'] })

    // The second: three options, the best +30; the third pick pays +10.
    await find('[data-scene="arrival:9000002"] [data-beat]')
    await click($('[data-action="skip"]'))
    expect($$('[data-option]').map((o) => o.dataset.gain)).toEqual(['30', '10', '10'])
    await click($('[data-option="2"]'))
    await click($('[data-action="skip"]'))
    await click($('[data-action="welcome"]'))
    await until(() => save().arrivals.includes('9000002'))
    expect(save().love['9000002']!.points).toBe(60)

    // The third ends on chapter 1's card; its first tap is planting.
    await find('[data-scene="arrival:9000003"] [data-beat]')
    await click($('[data-action="skip"]'))
    await click($('[data-option="0"]'))
    await click($('[data-action="skip"]'))
    expect($('[data-chapter-card="1"]')?.textContent).toContain('A Field Again')
    // The stand-in's three all come with the opening, so chapter 1 brings no one: no new hand on its card.
    expect($('[data-chapter-card="1"] [data-reward]')?.textContent).toBe('Reward: +500g, the Mill’s plans, 250 Farm Rank points.')
    await click($('[data-action="plant"]'))
    await until(() => save().arrivals.includes('9000003'))
    expect(save().love['9000003']!.points).toBe(80)
    expect(save().arrivals).toEqual(['9000001', '9000002', '9000003'])
    expect(path).toBe('/fields')
    await settle()
    expect($('[data-scene]')).toBeNull()
  })
})

describe('an open pack\'s placeholders', () => {
  it('an opening that brings nobody leaves out its last line and ends on chapter 1\'s card', async () => {
    const pack = await storyReady() as { cast: Cast }
    const cast = pack.cast
    pack.cast = { ...cast, opening: [] }
    try {
      useGame.setState({ save: { ...newSave('u1', AT), farmer: { name: 'Robin' } } })
      await renderShell()
      await find('[data-scene="scene:1:open"] [data-beat]')
      const lines: string[] = []
      while ($('[data-scene="scene:1:open"] [data-beat]')) {
        lines.push($('[data-line]')!.textContent!)
        await click($('[data-beat]'))
      }
      expect(lines.at(-1)).toBe('“You’ll want help with all this. I hear some is on its way.”')
      await click($('[data-action="plant"]'))
      await until(() => save().diary.read.includes('scene:1:open'))
      expect(Object.keys(save().roster)).toEqual([])
      expect(path).toBe('/fields')
    } finally {
      pack.cast = cast
    }
  })

  it('an arrival written with no choice plays to its end, then the game\'s hello, paying as one with a choice does', async () => {
    const pack = await storyReady()
    const route = pack.route
    pack.route = async (id) => (id === '9000001' ? { events: [{ id: 'arrival', steps: [{ narrate: 'Someone new leans on the Gate.' }] }] } : route(id))
    try {
      useGame.setState({ save: joinOpening(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), pack) })
      await renderShell()
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

describe('the Gate and the Dorm on v4', () => {
  it('says what brings the next arrivals, never who, and "Everyone is here" with the cast on the farm', async () => {
    const pack = await storyReady()
    const named: SaveV4 = { ...newSave('u1', AT), farmer: { name: 'Robin' } }
    await render(<GatePeek save={named} />)
    expect($('[data-peek="gate"]')?.textContent).toBe('Umas arrive here.')
    const everyone: SaveV4 = { ...named, roster: Object.fromEntries(pack.cast.umas.map((u) => [u.characterId, { joined: 1, ranks: newSave('u', AT).roster as never, wellFed: 0 }])) }
    await render(<GatePeek save={everyone} />)
    expect($('[data-everyone]')?.textContent).toBe('Everyone is here.')
    // A larger invented cast: chapter 2's end, the Dorm's level 4, the Fishing Derby.
    const bigger = { ...pack, cast: { ...pack.cast, umas: [...pack.cast.umas,
      { characterId: '9000004', outfitId: '900000401', arrives: { kind: 'festival' as const, festival: 'fishing-derby' as const }, calling: 'fishing' as const, paragraph: 'Invented.' },
      { characterId: '9000005', outfitId: '900000501', arrives: { kind: 'beds' as const, dormLevel: 4 }, calling: 'mining' as const, paragraph: 'Invented.' },
      { characterId: '9000006', outfitId: '900000601', arrives: { kind: 'chapter' as const, chapter: 2 }, calling: 'foraging' as const, paragraph: 'Invented.' },
    ] } }
    const { nextArrivals } = await import('@farm/domain')
    const { arrivalWords } = await import('./GatePeek')
    expect(nextArrivals(named, bigger).map(arrivalWords).join(' · ')).toBe('chapter 2’s end · the Dorm’s level 4 · the Fishing Derby')
  })

  it('shows the Dorm for 20\'s eight levels', async () => {
    useGame.setState({ save: { ...newSave('u1', AT), farmer: { name: 'Robin' } } })
    await render(<DormPage />, '/dorm')
    expect($$('[data-ladder-level]').map((li) => li.dataset.ladderLevel)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8'])
    expect($('[data-ladder-level="8"]')?.textContent).toContain('20 beds')
    expect($('[data-next-level]')?.textContent).toBe('Level 2 · 5 beds')
  })
})

describe('the cast keeps everyone on the farm', () => {
  it('adds an Uma the pack doesn\'t hold, from a save, to the cast: her events play the game\'s cards', async () => {
    const { arrive, eventOf, placeholderEvent, readiness } = await import('@farm/domain')
    const { castIds, storyPack } = await import('../story/story')
    const pack = await storyReady()
    const farm = arrive(joinOpening(readScene({ ...newSave('u1', AT), farmer: { name: 'Robin' } }, 'scene:1:open'), pack), '9000099', pack).save
    expect(castIds()).not.toContain('9000099')
    await act(async () => useGame.setState({ save: farm }))
    expect(castIds()).toEqual(['9000001', '9000002', '9000003', '9000099'])
    expect(await storyReady()).toBe(storyPack())
    const kept = storyPack()!
    expect(readiness({ ...farm, love: { ...farm.love, '9000099': { ...farm.love['9000099']!, points: 200 } } }, kept, '9000099')).toMatchObject({ rung: 'f1' })
    expect((await eventOf(kept, '9000099', 'f1')).steps).toEqual(placeholderEvent('9000099', 'f1'))
  })
})
