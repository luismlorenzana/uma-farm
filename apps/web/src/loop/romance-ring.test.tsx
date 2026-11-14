// The ring bench, the proposal and the wedding on screen: the smith's
// scene over the farm, the Forge's quick look and the bench's sheet making a ring (a slot swapped), the proposal's ring
// picker and its Engaged stage-up, the wedding's place, guests, reception and Married stage-up, her profile's engraving,
// ring and better ring, and the Forge before the bench. The invented stand-in pack
// (9000001–9000003) and invented outfits; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { dateOf, farmPlace, meet, newSave, readScene, SEASON_NAMES, type Love, type SaveV4, type StoryPack } from '@farm/domain'
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
const { BenchPeek } = await import('./BenchSheet')
const { BENCH_LOCK, lockOf, placeLink } = await import('./farm-map')
const { BENCH_TEXT, makeWords, withArticle } = await import('./bench-view')
const { CAKE_WORDS, guestsLine, marriedWords, PICKER_WORDS, STAGE_WORDS, stageOpens } = await import('./event-view')
const { warehouseTabs } = await import('./goods-view')

/** The stand-in's three home, ties seeded, as if met: the opening brings nobody, and day 1's visitor waits at the Gate. */
const joinStandIns = (save: SaveV4, pack: Pick<StoryPack, 'cast' | 'ties'>): SaveV4 =>
  ['9000001', '9000002', '9000003'].reduce((s, id) => (s.roster[id] ? s : meet(s, id, pack).save), save)
const AT = '2026-11-11T10:00:00.000Z'
const DAY = 21
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4

/** A named farm on day 21, the stand-in's three home (`joinStandIns`) and their arrivals played; 9000001 at `love`. With the bench standing,
 * the smith's scene is read unless `more` brings its own Diary. */
function farm(love: Partial<Love> = {}, more: Partial<SaveV4> = {}): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: DAY } }
  const joined = joinStandIns(readScene(fresh, 'scene:1:open'), fixture.pack!)
  const out = { ...joined, arrivals: [ONE, TWO, THREE], today: { ...joined.today, bonds: {} }, love: { ...joined.love, [ONE]: { ...joined.love[ONE]!, ...love } }, ...more }
  return out.buildings.forge !== undefined && !more.diary ? readScene(out, 'scene:bench') : out
}
const items = (...rows: [string, number, number?][]): SaveV4['items'] => Object.fromEntries(rows.map(([id, n, stars = 1]) => {
  const row: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  row[stars - 1] = n
  return [id, row]
}))
const bench = { buildings: { dorm: 1, forge: 0 } }

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

describe('the ring bench', () => {
  it('opens with the smith\'s scene once the summary is away; See the bench opens its sheet', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({}, { ...bench, summary: null, diary: farm().diary }) })
    await render(<div />, '/')
    await find('[data-scene="scene:bench"]')
    expect($('[data-scene-title]')?.textContent).toBe('The Ring Bench')
    expect($('[data-speaker]')).toBeNull()
    await click($('[data-beat]'))
    // The smith is the Uma who plays the role; with no master data for the town's people, the role's words.
    expect($('[data-speaker]')?.textContent).toBe('The smith')
    await click($('[data-action="skip"]'))
    await find('[data-bench-card]')
    await click($('[data-action="see-bench"]'))
    await until(() => save().diary.read.includes('scene:bench'))
    expect(path).toBe('/?sheet=bench')
    await find('[data-bench]')
  })

  it('makes an Iron Ring from three Cedar Planks, a slot swapped first; one a day; no gold', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({}, { ...bench, items: items(['cedar-plank', 3], ['sardine-fillet', 2], ['salmon-fillet', 3, 2]) }) })
    const gold = save().gold
    await render(<div />, '/?sheet=bench')
    await find('[data-bench]')
    expect($$('[data-bench-row]').map((r) => r.dataset.benchRow)).toEqual(['3', '5'])
    expect($$('[data-bench-row="3"] [data-slot]').map((s) => s.dataset.input)).toEqual(['cedar-plank@1', 'cedar-plank@1', 'cedar-plank@1'])
    expect($('[data-bench-row="3"]')?.textContent).toContain('→ Iron Ring')
    expect($('[data-bench-row="5"]')?.textContent).toContain('→ Cobalt Ring')
    expect($('[data-forge-recipe]')?.dataset.forgeRecipe).toBe('greyed')
    expect($('[data-forge-recipe]')?.textContent).toBe('2 ingots + 1 cut gem · Opens when the Smelter and the Cutter are built')
    expect($('[data-bench-bonus]')?.textContent).toContain('Her bonus once married: +1% a grade')
    expect($('[data-action="make-ring"]')?.textContent).toBe('Make an Iron Ring · 1 a day')
    // A tap on a slot offers the grade's other goods; one swapped in.
    await click($('[data-bench-row="3"] [data-slot="2"]'))
    expect($$('[data-swap] [data-option]').map((o) => o.dataset.option)).toEqual(['cedar-plank@1', 'sardine-fillet@1'])
    await click($('[data-swap] [data-option="sardine-fillet@1"]'))
    expect($$('[data-bench-row="3"] [data-slot]').map((s) => s.dataset.input)).toEqual(['cedar-plank@1', 'cedar-plank@1', 'sardine-fillet@1'])
    await click($('[data-action="make-ring"]'))
    await find('[data-bench-note="ring-g3"]')
    expect($('[data-bench-note]')?.textContent).toContain('Iron Ring · in the Warehouse, ★1')
    expect(save().items['ring-g3']).toEqual([1, 0, 0, 0, 0])
    expect(save().items['cedar-plank']).toEqual([1, 0, 0, 0, 0])
    expect(save().items['sardine-fillet']).toEqual([1, 0, 0, 0, 0])
    expect(save().today.ring).toBe(3)
    expect(save().gold).toBe(gold)
    expect($('[data-bench-made]')?.textContent).toBe('One ring a day. Iron Ring made today ✓')
    expect($('[data-action="make-ring"]')).toBeNull()
    // The Warehouse holds it on its own tab.
    expect(warehouseTabs(save()).find((t) => t.shelf === 'rings')?.rows.map((r) => [r.name, r.facts])).toEqual([['Iron Ring', 'Rings · G3 · made at the ring bench']])
  })

  it('stands at the Forge on v4: locked until the first Romance 8, then its quick look leads to the bench', async () => {
    const forge = farmPlace('forge')!
    expect(lockOf(farm(), forge)).toBe(BENCH_LOCK)
    expect(lockOf(farm({}, bench), forge)).toBeNull()
    expect(placeLink(farm({}, bench), forge)).toBe('/?peek=forge')
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({}, bench) })
    await render(<BenchPeek save={save()} />, '/?peek=forge')
    expect($('[data-bench-peek]')?.textContent).toContain('Ring bench · one ring a day')
    await click($('[data-action="open-bench"]'))
    expect(path).toBe('/?sheet=bench')
  })
})

describe('the proposal', () => {
  it('asks which ring, the best preselected, plays, uses the ring and closes on Engaged', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'proposal', level: 10, points: 0, last: DAY - 1 }, { ...bench, items: items(['ring-g3', 1], ['ring-g5', 1]) }) })
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await find('[data-ring-picker]')
    expect($('[data-ring-picker] h2')?.textContent).toBe(PICKER_WORDS.ring)
    expect($$('[data-ring]').map((r) => [r.dataset.ring, r.getAttribute('aria-pressed')])).toEqual([['ring-g5', 'true'], ['ring-g3', 'false']])
    await click($('[data-ring="ring-g3"]'))
    expect($('[data-action="propose"]')?.textContent).toBe('Propose with the Iron Ring ›')
    await click($('[data-action="propose"]'))
    await until(() => $('[data-event-title]')?.textContent === 'The chapel bell · The proposal')
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
    await find('[data-choice]')
    expect($$('[data-option]').map((o) => o.textContent)).toEqual(['♥Will you marry me?+30', '♥I haven’t even asked yet!+10'])
    await click($('[data-option="0"]'))
    await tapUntil('[data-level-up]')
    expect($('[data-card-ring]')?.textContent).toBe('RingIron Ring · hers now')
    expect(save().love[ONE]).toMatchObject({ stage: 'wedding', ring: 3 })
    expect(save().items['ring-g3']).toBeUndefined()
    expect(save().items['ring-g5']).toEqual([1, 0, 0, 0, 0])
    await click($('[data-action="continue"]'))
    await find('[data-stage-up="engaged"]')
    expect($('[data-stage-up]')?.textContent).toContain('Engaged')
    expect($$('[data-opens] li').map((l) => l.textContent)).toEqual([
      '· Your wedding: tomorrow, whenever you’re ready', '· Her ring: Iron Ring · +3% at the Fields once you’re married', '· A better ring any day, from her profile',
    ])
    await click($('[data-action="continue"]'))
    await until(() => !$('[data-event-player]'))
  })
})

describe('the wedding', () => {
  it('asks the place, plays on its card with the guests, then the reception (the bakery\'s cake), the wedding night, and closes on Married', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'wedding', level: 10, points: 0, last: DAY - 1, ring: 3 }, bench) })
    await render(<HeartsPage />, `/hearts?event=${ONE}`)
    await find('[data-place-picker]')
    expect($$('[data-place-picker] [data-place]').map((p) => p.dataset.place)).toEqual(['chapel-bell', 'orchard-bench', 'fields'])
    await click($('[data-place-picker] [data-place="fields"]'))
    await until(() => $('[data-event-title]')?.textContent === 'The Fields · The wedding')
    expect($('[data-place-card]')?.dataset.frame).toBe('vegetable-garden')
    expect($('[data-guests]')?.dataset.guests).toBe(`${TWO},${THREE}`)
    expect($('[data-step] [data-line]')?.dataset.line).toBe(guestsLine(['Stand-in 2', 'Stand-in 3']))
    expect(guestsLine(['Stand-in 2', 'Stand-in 3'])).toBe('Stand-in 2 and Stand-in 3 came, in their best.')
    await click($('[data-action="skip"]'))
    await click(await find('[data-option="0"]'))
    await click($('[data-action="skip"]'))
    await click(await find('[data-action="play-start"]'))
    later(20_000)
    await until(() => $('[data-play-result]') !== null)
    await click($('[data-action="play-done"]'))
    await click($('[data-action="skip"]'))
    await find('[data-choice]')
    expect($$('[data-option]')).toHaveLength(3)
    await click($('[data-option="2"]'))
    // Nothing saved before the reception.
    expect(save().love[ONE]!.stage).toBe('wedding')
    await tapUntil('[data-reception]')
    expect($('[data-action="cake"]')?.textContent).toBe('Serve the bakery’s cake · 1 day')
    expect($('[data-no-dish]')?.textContent).toContain('the town’s bakery sends a cake')
    await click($('[data-action="cake"]'))
    await find('[data-level-up]')
    expect($('[data-card-wedding]')?.textContent).toBe('WeddingThe Fields · the town’s bakery sends a cake · everyone well fed 1 day')
    expect(save().love[ONE]).toMatchObject({ stage: 'spouse', level: 0, wed: DAY, ring: 3 })
    expect(save().love[ONE]!.flags).toEqual(expect.arrayContaining(['wedding:fields', 'vow:3']))
    expect(save().today.reception).toBe(1)
    await click($('[data-action="continue"]'))
    // The wedding night: the default story's (her route writes none), in its outfit, fading to morning; Skip ends it.
    await find('[data-wedding-night]')
    expect($('[data-event-title]')?.textContent).toBe('The wedding night · Stand-in 1')
    await until(() => $('[data-wedding-night] [data-portrait]') !== null)
    expect($('[data-wedding-night] [data-portrait]')?.dataset.portrait).toBe('wedding-night')
    expect($('[data-step] [data-line]')?.dataset.line).toBe('The guests have gone home. The house is quiet, and the lamps are low.')
    await click($('[data-action="skip"]'))
    await find('[data-stage-up="married"]')
    const date = dateOf(DAY)
    expect($$('[data-opens] li').map((l) => l.textContent)).toEqual([
      '· The spouse ladder, Spouse 1–5', '· Her ring: +3% at the Fields', '· Evenings: every kind her ladders opened',
      '· S1 · Breakfast: the crew starts well fed on a morning in her house', `· Your anniversary: ${SEASON_NAMES[date.season]} ${date.day}, each year`,
      // Her room, taken at once, and the house's mornings.
      '· Her room: Farmhouse', '· House mornings: +30 for her each morning you sleep there',
    ])
    expect($('[data-married-line]')?.textContent).toBe('Married 1/3 · next household scene at 5')
    await click($('[data-action="continue"]'))
    await until(() => !$('[data-event-player]'))
    expect($('[data-married]')?.textContent).toBe('Married 1/3')
  })
})

describe('her ring on her profile', () => {
  it('shows the engraving from Romance 8, then her ring, its bonus and a better ring to give', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'romance', level: 8, points: 0, last: 1 }, bench) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-engraving]')).textContent).toBe('Her ring will read: ‘Always the next row.’')
    expect($('[data-ring-bonus]')).toBeNull()
    expect($$('[data-perk-now="engraving"]').map((p) => p.textContent)).toEqual(['R8“Always the next row.”'])
    await act(async () => root.unmount())
    root = createRoot(host)
    useGame.setState({ save: farm({ stage: 'wedding', level: 10, points: 0, last: 1, ring: 3 }, { ...bench, items: items(['ring-g5', 1], ['ring-g2', 1]) }) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-engraving]')).textContent).toBe('Her ring reads: ‘Always the next row.’')
    expect($('[data-ring-bonus]')?.textContent).toBe('Iron Ring· +3% at the Fields once you’re married')
    expect($$('[data-better]').map((b) => b.dataset.better)).toEqual(['ring-g5'])
    await click($('[data-better="ring-g5"]'))
    await find('[data-ring-note]')
    expect($('[data-ring-note]')?.textContent).toBe('She wears the Cobalt Ring now; the Iron Ring is back in the Warehouse.')
    expect(save().love[ONE]!.ring).toBe(5)
    expect(save().items['ring-g3']).toEqual([1, 0, 0, 0, 0])
    expect($('[data-ring-bonus]')?.textContent).toBe('Cobalt Ring· +5% at the Fields once you’re married')
  })

  it('shows her ring\'s bonus at her line once she\'s your spouse', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'spouse', level: 0, points: 0, last: 1, wed: 1, ring: 5 }, bench) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-ring-bonus]')).textContent).toBe('Cobalt Ring· +5% at the Fields')
    expect($('[data-perk-now="line-20"]')?.textContent).toContain('+5% ring')
  })

  it('links "Needs a ring" to the bench', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: farm({ stage: 'proposal', level: 10, points: 0, last: 1 }, bench) })
    await render(<HeartsPage />, `/hearts?uma=${ONE}`)
    expect((await find('[data-next-words]')).textContent).toBe('Needs a ring')
    await click($('[data-action="to-bench"]'))
    expect(path).toBe('/?sheet=bench')
  })
})

describe('the words', () => {
  it('fill everything but your name; the protagonist is a man, so the groom may be named', () => {
    const words = [
      ...Object.values(BENCH_TEXT).flat(), makeWords(3), withArticle('Orichalcum Ring'), ...Object.values(STAGE_WORDS).flatMap((w) => [w.title, w.line]),
      ...Object.values(PICKER_WORDS), CAKE_WORDS, guestsLine([]), guestsLine(['A']), marriedWords(1, 20), marriedWords(19, 20),
      ...stageOpens('engaged', 'farming', { ring: 3 }), ...stageOpens('married', 'fishing', { ring: 3, wed: 21 }),
    ]
    expect(words.filter((w) => /\{(?!farmer\})/.test(w))).toEqual([])
    // A milestone's own wedding says what opens tomorrow.
    expect([makeWords(10), marriedWords(19, 20), marriedWords(20, 20), marriedWords(5, 20)]).toEqual([
      'Make an Orichalcum Ring · 1 a day', 'Married 19/20 · the finale at 20', 'Married 20/20 · the Great Harvest tomorrow', 'Married 5/20 · household scene 1 tomorrow',
    ])
  })
})

describe('before the bench', () => {
  it('locks the Forge until the first Romance 8, closes the bench sheet, and shows no rings tab without rings', async () => {
    const fresh = newSave('u1', AT)
    expect(lockOf(fresh, farmPlace('forge')!)).toBe('your first Romance 8')
    expect(lockOf({ ...fresh, buildings: { ...fresh.buildings, forge: 0 } }, farmPlace('forge')!)).toBeNull()
    expect(warehouseTabs(fresh).map((t) => t.shelf)).toEqual(['crops', 'woods', 'mushrooms', 'herbs-spices', 'fruits', 'nuts-seeds', 'sweets', 'fish', 'mining', 'seeds'])
    useGame.setState({ uid: 'u1', status: 'ready', save: fresh })
    await render(<div />, '/?sheet=bench')
    expect($('[data-bench]')).toBeNull()
  })
})
