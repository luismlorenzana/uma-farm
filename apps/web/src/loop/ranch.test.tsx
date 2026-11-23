// The ranch and the digs, as rendered: the rancher's sheet sells a chicken and fodder; the Coop's panel feeds it, cares
// for it and collects its egg the next morning; the Mine's panel works its faces and takes the stairs down three floors;
// the work board takes the Coop's care and the Mine's face; the morning words the Coop's night and the farmhands' work.
// Invented outfits (the album fixture) and a cast of them from the stand-in pack; the server is a stub.
import 'fake-indexeddb/auto'
import { fieldTiles, goToTown, newLove, newRosterUma, newSave, STAND_IN_FILES, storyPackFrom, type MorningSummary, type SaveV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null, pack: null as StoryPack | null }))
vi.mock('../story/story', async (importOriginal) => ({
  ...await importOriginal<typeof import('../story/story')>(),
  storyReady: async () => fixture.pack!, useStory: () => fixture.pack, storyPack: () => fixture.pack, castIds: () => fixture.pack!.cast.umas.map((u) => u.characterId),
}))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined,
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
const { default: FarmRoute } = await import('./FarmMap')
const { default: FieldRoute } = await import('./FieldScreen')
const { default: RancherSheet } = await import('../town/RancherSheet')
const { WorkBoard } = await import('../book/WorkBoard')
const { endTheDay } = await import('./actions')
const { summaryParts } = await import('./summary-words')

fixture.view = (await albumFixture(undefined, [{ star5: [100, 100, 100, 100, 100] }, { star5: [100, 100, 100, 100, 100] }])).view
const standIn = storyPackFrom(STAND_IN_FILES)
const entry = (from: number, characterId: string) => ({ ...standIn.cast.umas[from]!, characterId, outfitId: characterId })
fixture.pack = { ...standIn, bibles: new Map(), ties: { ...standIn.ties, ties: [] }, cast: { ...standIn.cast, umas: [entry(0, '81001'), entry(1, '81002')] } }

const AT = '2026-11-09T10:00:00.000Z'
const save = (): SaveV4 => useGame.getState().save as SaveV4
/** Day 7 at Farm Rank 4, the Coop and the Mine built, 3,000g, two friends invited to work, the opening read. */
function farm(): SaveV4 {
  const base = newSave('u1', AT)
  const hand = { ...newRosterUma(1), farmhand: 2 }
  return {
    ...base, farmer: { name: 'Robin' }, calendar: { day: 7 }, gold: 3000, roster: { 81001: hand, 81002: hand }, love: { 81001: newLove(), 81002: newLove() },
    arrivals: ['81001', '81002'], diary: { ...base.diary, read: ['scene:1:open'] }, buildings: { ...base.buildings, coop: 1, mine: 1 },
    farm: { ...base.farm, points: 950 },
  }
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter key={`${at}${Math.random()}`} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
  await settle()
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !document.body.querySelector(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(document.body.querySelector(selector)).not.toBeNull()
  return document.body.querySelector(selector) as HTMLElement
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  for (let i = 0; i < 5; i++) await settle()
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  Element.prototype.scrollTo = () => undefined
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

describe('the rancher\'s and the Coop', () => {
  it('sells a chicken and fodder in town; the Coop feeds it, cares for it, and collects its egg the next morning', async () => {
    useGame.setState({ save: goToTown(farm()) })
    await render(<RancherSheet title="The Rancher’s" onClose={() => undefined} />)
    expect($('[data-buy-animal="cow"]')?.dataset.lock).toBe('Build the Barn first.')
    await click($('[data-buy-animal="chicken"] [data-action="buy-animal"]'))
    expect(save().ranch.animals.map((a) => a.id)).toEqual(['chicken-1'])
    expect(save().gold).toBe(2500)
    for (let i = 0; i < 100 && $('[data-rancher-note]')?.textContent !== 'A chicken for the Coop'; i++) await settle()
    expect($('[data-rancher-note]')?.textContent).toBe('A chicken for the Coop')
    await click($('[data-action="buy-fodder"][data-count="10"]'))
    expect(save().ranch.silo).toBe(10)

    await render(<FarmRoute />, '/?peek=coop')
    await find('[data-ranch="coop"]')
    expect($('[data-silo]')?.dataset.silo).toBe('10')
    await click($('[data-animal="chicken-1"] [data-action="feed"]'))
    await click($('[data-animal="chicken-1"] [data-action="care"]'))
    expect(save().ranch.animals[0]).toMatchObject({ fed: true, cared: true, fondness: 8 })
    expect(save().today.actions).toBe(2)
    expect(($('[data-action="collect"]') as HTMLButtonElement).disabled).toBe(true)

    expect(await endTheDay(7)).toBe(true)
    const work = summaryParts(save().summary!).find((p) => p.section === 'work')!.lines
    expect(work).toContainEqual({ key: 'ranch:coop', to: '/?peek=coop', text: 'The Coop · 1 good to collect' })
    await render(<FarmRoute />, '/?peek=coop')
    await find('[data-ranch="coop"]')
    expect($('[data-region-destination="coop"] [data-tag]')?.textContent).toBe('1 to collect')
    await click($('[data-action="collect"]'))
    expect(save().items.egg).toEqual([1, 0, 0, 0, 0])
    expect($('[data-note]')?.textContent).toBe('Collected · +Egg')
  })

  it('cuts grass on a weeds tile for the silo', async () => {
    const weeds = fieldTiles(farm()).findIndex((t) => t.ground === 'weeds')
    await render(<FieldRoute />, `/field?tile=${weeds}`)
    await click(await find('[data-action="grass"]'))
    expect(save().ranch.silo).toBe(5)
  })
})

describe('the Mine', () => {
  it('works three floors: two faces a floor find its stairs, taken free', async () => {
    await render(<FarmRoute />, '/?peek=mine')
    await find('[data-dig="mine"]')
    for (let floor = 1; floor <= 3; floor++) {
      expect($('[data-dig="mine"]')?.dataset.floor).toBe(String(floor))
      await click($('[data-action="face"]'))
      await click($('[data-action="face"]'))
      expect($('[data-stairs]')?.dataset.stairs).toBe('found')
      if (floor < 3) await click($('[data-action="stairs"]'))
    }
    expect(save().places.mine).toEqual({ deepest: 3, stairs: 2 })
    expect(save().today.actions).toBe(6)
    expect($('[data-region-destination="mine"] [data-tag]')?.textContent).toBe('Floor 3')
  })
})

describe('the work board', () => {
  it('sets a farmhand to the Coop\'s care and another to the Mine\'s face, and the morning reports their work', async () => {
    // Spring 6: a farm day for both (the first is in town on 1, 4, 7 and 10, the second on 2, 5, 8 and 11).
    const base = farm()
    useGame.setState({ save: { ...base, calendar: { day: 6 }, ranch: { animals: [{ id: 'chicken-1', kind: 'chicken', fondness: 0, fed: false, cared: false, ready: false }], silo: 20 } } })
    await render(<WorkBoard save={save()} />, '/book?task=81001')
    await click(await find('[data-add-task="81001"] [data-kind="care"]'))
    await click($('[data-add-task="81001"] [data-where="coop"]'))
    await click($('[data-action="add-task-confirm"]'))
    await render(<WorkBoard save={save()} />, '/book?task=81002')
    await click(await find('[data-add-task="81002"] [data-kind="mine"]'))
    expect(($('[data-add-task="81002"] [data-where="quarry"]') as HTMLButtonElement).disabled).toBe(true)
    await click($('[data-add-task="81002"] [data-where="mine"]'))
    await click($('[data-action="add-task-confirm"]'))
    expect(save().roster['81001']!.tasks).toEqual([{ kind: 'care', home: 'coop' }])
    expect(save().roster['81002']!.tasks).toEqual([{ kind: 'mine', dig: 'mine' }])
    await render(<WorkBoard save={save()} />, '/book')
    expect($('[data-hand="81001"] [data-task-words]')?.textContent).toBe('Care for animals · the Coop')
    expect($('[data-hand="81002"] [data-task-words]')?.textContent).toBe('Work a face · the Mine')
    expect(await endTheDay(6)).toBe(true)
    const work = summaryParts(save().summary!).find((p) => p.section === 'work')!.lines.map((l) => l.text)
    expect(work[0]).toMatch(/· 2 of 3 actions · tended animals twice$/)
    expect(work[1]).toMatch(/· 3 of 3 actions · worked 3 faces · \+\d+ goods$/)
    expect(save().places.mine.deepest).toBe(1)
  })

  it('shows each farmhand\'s farm days, and on a town day "In town today · back …" with nothing tonight', async () => {
    // Spring 7: the first is in town (her town days are 1, 4, 7 and 10), the second on the farm (hers, 2, 5, 8 and 11).
    useGame.setState({ save: farm() })
    await render(<WorkBoard save={save()} />, '/book')
    await find('[data-hand="81001"]')
    expect($('[data-hand="81001"] [data-farm-days]')?.textContent).toBe('Farm days · 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24, 26, 27, 29, 30')
    expect($('[data-hand="81002"] [data-farm-days]')?.textContent).toBe('Farm days · 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 28, 30')
    expect($('[data-hand="81001"] [data-in-town]')?.textContent).toBe('In town today · back Spring 8')
    expect($('[data-hand="81001"] [data-tonight]')).toBeNull()
    expect($('[data-hand="81001"] [data-actions]')).toBeNull()
    expect($('[data-hand="81002"] [data-in-town]')).toBeNull()
    expect($('[data-hand="81002"] [data-tonight]')?.textContent).toBe('Shift forecast · No tasks: set her tasks')
    expect($('[data-hand="81002"] [data-actions]')?.dataset.actions).toBe('3')
  })

  it('words a hungry night as a warning', () => {
    const summary: MorningSummary = { day: 8, bin: [], work: [{ kind: 'ranch', home: 'barn', fed: 1, hungry: 2, ready: 1 }], ranks: [], hearts: [], news: [], nudges: [] }
    expect(summaryParts(summary)[0]!.lines).toEqual([{ key: 'ranch:barn', to: '/?peek=barn', text: 'The Barn · 1 good to collect · 2 went hungry', tag: 'Feed them', warn: true }])
  })
})
