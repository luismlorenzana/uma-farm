// Bonds as the screens show them (the morning's sixth line): her profile's
// Ties in the closest friend's order with the next heart and Read; the morning's side by side and bond hearts (Read when a
// conversation waits, the tie's line or the generic words when none is written); the pair player over any page, its
// levels in turn, read once into the Diary; the Diary's Conversations with replays; and the Fields' side by side. The
// invented stand-in pack (9000001–9000003, the stand-in pair's five invented
// conversations) and invented outfits; master data and the server are stubs.
import 'fake-indexeddb/auto'
import { joinOpening, newBlock, newSave, pairKey, readScene, type Block, type MorningSummary, type SaveV4, type StoryPack } from '@farm/domain'
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
const { default: DiaryPage } = await import('./DiaryPage')
const { default: FieldsPage } = await import('./FieldsPage')
const { conversationRows, pairWords, parseReadParam, readParam, tieRows } = await import('./hearts-view')
const { heartsLines } = await import('./summary-words')

const AT = '2026-11-11T10:00:00.000Z'
const [ONE, TWO, THREE] = ['9000001', '9000002', '9000003']
const save = (): SaveV4 => useGame.getState().save as SaveV4
const NAMES: Record<string, string> = { [ONE]: 'Stand-in 1', [TWO]: 'Stand-in 2', [THREE]: 'Stand-in 3' }
const nameOf = (id: string) => NAMES[id] ?? 'An Uma'

/** A named farm on day 2: the opening three home and their arrivals played, their ties seeded on day 1 (9000001 and
 * 9000002 at 150, 9000001 and 9000003 at 50). */
function farm(): SaveV4 {
  const fresh = { ...newSave('u1', AT), farmer: { name: 'Robin' }, calendar: { day: 2 } }
  const joined = joinOpening(readScene(fresh, 'scene:1:open'), fixture.pack!)
  return { ...joined, arrivals: [ONE, TWO, THREE], today: { ...joined.today, bonds: {} } }
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
async function render(node: ReactNode, at: string, shell = false) {
  const page = <>{node}<Where /></>
  await act(async () => root.render(
    <MemoryRouter key={at} initialEntries={[at]}>
      <Routes>{shell ? <Route element={<Shell />}><Route path="*" element={page} /></Route> : <Route path="*" element={page} />}</Routes>
    </MemoryRouter>,
  ))
  await settle()
}
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

describe('the view model', () => {
  it('lists her ties in the closest friend\'s order, with the next heart and the conversations to Read', () => {
    const rows = tieRows(farm(), fixture.pack!, ONE)
    // 9000001 and 9000003's pair has no file: the game's card waits at their bond 1.
    expect(rows.map((t) => [t.with, t.hearts, t.points, t.next, t.closest, t.unread])).toEqual([[TWO, 2, 150, 300, true, [1, 2]], [THREE, 1, 50, 150, false, [1]]])
    const read: SaveV4 = { ...farm(), diary: { ...farm().diary, read: [...farm().diary.read, 'pair:9000001-9000002:1'] } }
    expect(tieRows(read, fixture.pack!, TWO)[0]).toMatchObject({ with: ONE, closest: true, unread: [2] })
  })

  it('says the morning\'s side by side and bond hearts: Read while a tie\'s conversation waits (the pack\'s or the game\'s card), else the generic words', () => {
    const s = farm()
    const pairs = pairWords(s, fixture.pack!)
    const hearts: MorningSummary['hearts'] = [
      { kind: 'bond', a: ONE, b: TWO, hearts: 2 }, { kind: 'side', items: 3 }, { kind: 'bond', a: ONE, b: THREE, hearts: 1 }, { kind: 'arrived', id: THREE, home: true },
      { kind: 'bond', a: TWO, b: '9000009', hearts: 1 },
    ]
    expect(heartsLines(hearts, [], nameOf, pairs).map((l) => [l.text, l.to, l.tag ?? null])).toEqual([
      ['Stand-in 3 arrived', `/hearts?uma=${THREE}`, 'New'],
      ['♥♥ Stand-in 1 & Stand-in 2 · bond 2', '/?read=9000001-9000002:1,2', 'Read'],
      ['Side by side · +3 items', '/warehouse', null],
      ['♥♥ Stand-in 1 & Stand-in 3 · bond 1', '/?read=9000001-9000003:1', 'Read'],
      ['♥♥ Stand-in 2 and An Uma are closer now · bond 1', `/hearts?uma=${TWO}`, null],
    ])
    // Read once: the line says the heart alone.
    const read = { ...s, diary: { ...s.diary, read: [...s.diary.read, 'pair:9000001-9000002:1', 'pair:9000001-9000002:2'] } }
    expect(heartsLines([hearts[0]!], [], nameOf, pairWords(read, fixture.pack!))[0]).toMatchObject({ text: '♥♥ Stand-in 1 & Stand-in 2 · bond 2', to: `/hearts?uma=${ONE}` })
    expect(heartsLines([{ kind: 'side', items: 1 }], [], nameOf)[0]!.text).toBe('Side by side · +1 item')
    // Before the pack loads: the generic words, no Read.
    expect(heartsLines([hearts[0]!], [], nameOf)[0]!.tag).toBeUndefined()
  })

  it('lists the Diary\'s pairs with their hearts, read and unread, and the ?read= param both ways', () => {
    const s = farm()
    const read = { ...s, diary: { ...s.diary, read: [...s.diary.read, 'pair:9000001-9000002:1'] }, bonds: { ...s.bonds, [pairKey(TWO, THREE)]: 20 } }
    expect(conversationRows(read, fixture.pack!)).toEqual([
      { a: ONE, b: TWO, hearts: 2, points: 150, read: [1], unread: [2], line: null },
      { a: ONE, b: THREE, hearts: 1, points: 50, read: [], unread: [1], line: null },
    ])
    expect(readParam(TWO, ONE, [1, 2])).toBe('9000001-9000002:1,2')
    expect(parseReadParam('9000001-9000002:1,2')).toEqual({ a: ONE, b: TWO, levels: [1, 2] })
    expect([parseReadParam('9000001-9000001:1'), parseReadParam('9000001-9000002:6'), parseReadParam('x'), parseReadParam(null)]).toEqual([null, null, null, null])
  })
})

describe('as rendered', () => {
  it('marks her closest friend and plays their conversations from Read, in turn, once into the Diary', async () => {
    await render(<HeartsPage />, `/hearts?uma=${ONE}`, true)
    await find(`[data-profile="${ONE}"]`)
    expect($$('[data-tie]').map((t) => [t.dataset.tie, t.dataset.hearts, t.dataset.closest ?? null])).toEqual([[TWO, '2', 'true'], [THREE, '1', null]])
    expect($(`[data-tie="${TWO}"] [data-closest-chip]`)?.textContent).toBe('Closest')
    expect($(`[data-tie="${TWO}"]`)?.textContent).toContain('Friends · 150/300')
    expect($(`[data-tie="${THREE}"] [data-action="read"]`)).not.toBeNull()
    await click($(`[data-tie="${TWO}"] [data-action="read"]`))
    expect(path).toBe(`/hearts?uma=${ONE}&read=9000001-9000002%3A1%2C2`)
    // Bond 1, then bond 2, each line a tap; the title names the pair, the level and the place.
    await find('[data-scene="pair:9000001-9000002:1"] [data-beat]')
    expect($('[data-scene-title]')?.textContent).toBe('Stand-in 1 & Stand-in 2 · Bond 1 (1/2) · Fields')
    while ($('[data-scene="pair:9000001-9000002:1"] [data-beat]')) await click($('[data-scene="pair:9000001-9000002:1"] [data-beat]'))
    await find('[data-scene="pair:9000001-9000002:2"] [data-beat]')
    expect($('[data-scene-title]')?.textContent).toBe('Stand-in 1 & Stand-in 2 · Bond 2 (2/2) · Forest')
    expect($('[data-scene] [data-line]')?.textContent).toBe('Show me the mushroom patch you keep bragging about.')
    await click($('[data-scene] [data-beat]'))
    expect($('[data-scene] [data-line]')?.textContent).toBe('Only if you promise not to tell Robin.')
    while ($('[data-scene] [data-beat]')) await click($('[data-scene] [data-beat]'))
    await until(() => save().diary.read.includes('pair:9000001-9000002:2'))
    expect(save().diary.read.filter((r) => r.startsWith('pair:'))).toEqual(['pair:9000001-9000002:1', 'pair:9000001-9000002:2'])
    expect(save().love).toEqual(farm().love)
    expect(path).toBe(`/hearts?uma=${ONE}`)
    expect($('[data-scene]')).toBeNull()
    expect($(`[data-tie="${TWO}"] [data-action="read"]`)).toBeNull()
  })

  it('plays a choice as wording only, and Skip marks the levels read', async () => {
    useGame.setState({ save: { ...farm(), bonds: { ...farm().bonds, [pairKey(ONE, TWO)]: 300 } } })
    await render(<HeartsPage />, `/hearts?uma=${ONE}&read=9000001-9000002:3`, true)
    await find('[data-scene="pair:9000001-9000002:3"] [data-beat]')
    while ($('[data-scene] [data-beat]')) await click($('[data-scene] [data-beat]'))
    expect($$('[data-choice] [data-option]').map((o) => o.textContent)).toEqual(['Leave them to the quiet.', 'Bring them both some tea.'])
    expect($('[data-choice] [data-gain]')).toBeNull()
    await click($('[data-choice] [data-option="1"]'))
    expect($('[data-scene] [data-line]')?.textContent).toBe('Robin remembered how we take it. Of course.')
    await click($('[data-action="skip"]'))
    await until(() => save().diary.read.includes('pair:9000001-9000002:3'))
    expect(save().love).toEqual(farm().love)
  })

  it('lists the pairs in the Diary\'s Conversations, replaying a read one and marking nothing new', async () => {
    const s = farm()
    useGame.setState({ save: { ...s, diary: { ...s.diary, read: [...s.diary.read, 'pair:9000001-9000002:1'] } } })
    await render(<DiaryPage />, '/diary', true)
    await find('[data-conversations]')
    expect($$('[data-pair]').map((p) => [p.dataset.pair, p.dataset.hearts])).toEqual([['9000001-9000002', '2'], ['9000001-9000003', '1']])
    // Their pair has no file: the game's card waits to be read.
    expect($('[data-pair="9000001-9000003"] [data-action="read"]')?.dataset.read).toBe('1')
    expect($('[data-pair="9000001-9000002"] [data-action="read"]')?.dataset.read).toBe('2')
    const before = save()
    await click($('[data-pair="9000001-9000002"] [data-replay="1"]'))
    expect(path).toBe('/diary?read=9000001-9000002%3A1')
    await find('[data-scene="pair:9000001-9000002:1"] [data-beat]')
    while ($('[data-scene] [data-beat]')) await click($('[data-scene] [data-beat]'))
    await until(() => path === '/diary')
    expect(save()).toBe(before)
  })

  it('says side by side on a block whose tender has a 3-heart partner tending another', async () => {
    const s = farm()
    const growing = (id: 'A' | 'B', tender: string): Block => ({ ...newBlock(id), tender, plots: newBlock(id).plots.map((p, i) => (i === 0 ? { ...p, crop: 'carrot' } : p)) })
    useGame.setState({ save: { ...s, fields: { blocks: [growing('A', ONE), growing('B', TWO)] }, bonds: { ...s.bonds, [pairKey(ONE, TWO)]: 300 } } })
    await render(<FieldsPage />, '/fields')
    await find('[data-block="A"] [data-growth]')
    expect($('[data-block="A"] [data-growth]')?.dataset.side).toBe('true')
    expect($('[data-block="A"] [data-growth]')?.textContent).toMatch(/side by side$/)
  })
})
