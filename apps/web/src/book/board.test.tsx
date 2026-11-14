// The work board: its words (a task, her day, her job, her night), the Book's board with each farmhand's card (her
// actions, tonight's work as the farm stands, her tasks with their aptitudes), adding a task from the side panel and
// removing one, the morning's farmhand and aptitude lines, and her aptitudes on her profile's Work side. Invented ids;
// master data, sign-in and the server are stubs.
import 'fake-indexeddb/auto'
import { bareTile, newLove, newRosterUma, newSave, START_CLEAR, storyPackFrom, STAND_IN_FILES, type FarmhandLine, type MorningSummary, type SaveV4 } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../master/master', () => ({ masterReady: vi.fn(async () => ({ stats: new Map(), birthdays: new Map() })), useMaster: () => ({ status: 'loading' }), setMasterLens: vi.fn() }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(),
  useAuth: () => ({ ready: true, authRequired: true, user: { uid: 'u1', name: 'Robin', email: null }, error: null, signIn: async () => undefined, signOut: async () => undefined, idToken: async () => null }),
}))

const { useGame, resetGame } = await import('../save/game')
const { default: BookPage } = await import('./BookPage')
const { dayChips, doneWords, jobWords, nightWords, rowsOf, taskWords, tilesWords } = await import('./board-words')
const { summaryParts } = await import('../loop/summary-words')

const AT = '2026-11-14T10:00:00.000Z'
const [A, B] = ['101', '202']
/** Two farmhands invited on day 1 who live in town, a third Uma met but not working; carrots growing on the cleared patch. */
function farm(): SaveV4 {
  const save = newSave('u1', AT)
  const hand = { ...newRosterUma(1), farmhand: 1 }
  return {
    ...save, farmer: { name: 'Robin' }, calendar: { day: 3 }, roster: { [A]: hand, [B]: hand, 303: newRosterUma(1) }, love: { [A]: newLove(), [B]: newLove(), 303: newLove() },
    fields: { tiles: save.fields.tiles.map((t, i) => (START_CLEAR.includes(i) ? { ...bareTile('tilled'), crop: 'carrot' as const } : t)) },
    diary: { ...save.diary, read: ['scene:1:open'] },
  }
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode, at = '/') {
  await act(async () => root.render(<MemoryRouter key={at} initialEntries={[at]}><Routes><Route path="*" element={node} /></Routes></MemoryRouter>))
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) })
}
const $ = (selector: string) => document.body.querySelector(selector)
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)]
const click = async (el: Element | null) => { await act(async () => { (el as HTMLElement).click() }); await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)) }) }

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
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

describe('the board\'s words', () => {
  it('says a task by its tiles, its place or its station', () => {
    const row = (r: number) => Array.from({ length: 8 }, (_, c) => (r - 1) * 8 + c)
    expect(rowsOf([...row(1), ...row(3)])).toEqual([1, 3])
    expect(rowsOf([0, 1])).toBeNull()
    expect(tilesWords(Array.from({ length: 40 }, (_, i) => i))).toBe('the whole field')
    expect(tilesWords(row(2))).toBe('row 2')
    expect(tilesWords([...row(1), ...row(2), ...row(4)])).toBe('rows 1, 2 and 4')
    expect(tilesWords([0, 9])).toBe('2 tiles')
    expect(taskWords({ kind: 'water', tiles: row(1) })).toBe('Water · row 1')
    expect(taskWords({ kind: 'plant', tiles: row(1), crop: 'carrot' })).toBe('Plant Carrot · row 1')
    expect(taskWords({ kind: 'till', tiles: [3] })).toBe('Clear and till · 1 tile')
    expect(taskWords({ kind: 'load', station: 'mill' })).toBe('Load the Mill')
    expect(taskWords({ kind: 'forage', area: 'hills' })).toBe('Forage · the Hills')
    expect(taskWords({ kind: 'fish', spot: 'pond' })).toBe('Fish · the Pond')
  })

  it('says her day, her job, and her night', () => {
    expect(dayChips({ base: 3, settled: 1, spouse: 2, fed: 1, half: true, actions: 3 })).toEqual(['+1 settled in', '+2 married', '+1 well fed', 'half pace'])
    // The story's job in its words, else where it is; the game's default near her favourite spot; else a job in town.
    const pack = storyPackFrom(STAND_IN_FILES)
    const cast = (umas: object[]) => ({ ...pack, cast: { ...pack.cast, umas: umas as typeof pack.cast.umas } })
    expect(jobWords(cast([{ characterId: '42', job: { what: 'Waits tables', at: 'cafe' } }]), '42')).toBe('Waits tables')
    expect(jobWords(cast([{ characterId: '42', job: { at: 'cafe' } }]), '42')).toBe('Works at the Café')
    expect(jobWords(cast([{ characterId: '42', spot: 'harbour' }]), '42')).toBe('Helps out at the Harbour')
    expect(jobWords(pack, '9000001')).toBe('A job in town')
    expect(doneWords({ water: 3, fish: 2, forage: 1, load: 1 })).toEqual(['watered 3 tiles', 'started 1 load', 'foraged once', 'caught 2 fish'])
    const line: FarmhandLine = { kind: 'farmhand', id: A, actions: 4, spent: 4, half: false, fed: true, done: { water: 6, fish: 1 }, items: 1 }
    expect(nightWords(line)).toBe('4 of 4 actions · watered 6 tiles · caught 1 fish · +1 good')
    expect(nightWords({ ...line, spent: 0, done: {}, items: 0 })).toBe('Nothing to do: set her tasks')
  })
})

describe('the work board in the Book', () => {
  it('has a card for each farmhand, in the order they work: her actions, tonight\'s work and her tasks', async () => {
    const save = farm()
    useGame.setState({ save: { ...save, roster: { ...save.roster, [A]: { ...save.roster[A]!, tasks: [{ kind: 'water', tiles: [...START_CLEAR] }] } } } })
    await render(<BookPage />, '/book')
    expect($$('[data-hand]').map((c) => c.getAttribute('data-hand'))).toEqual([A, B])
    const card = $(`[data-hand="${A}"]`)!
    expect(card.querySelector('[data-actions]')?.getAttribute('data-actions')).toBe('3')
    expect(card.querySelector('[data-tonight]')?.textContent).toBe('Tonight · 3 of 3 actions · watered 3 tiles')
    expect([...card.querySelectorAll('[data-task] [data-task-words]')].map((t) => t.textContent)).toEqual(['Water · 9 tiles'])
    expect([...card.querySelectorAll('[data-task] [data-task-aptitude]')].map((t) => t.textContent)).toEqual(['Watering 2'])
    expect($(`[data-hand="${B}"] [data-no-tasks]`)).not.toBeNull()
    expect($(`[data-hand="${B}"] [data-tonight]`)?.textContent).toBe('Tonight · Nothing to do: set her tasks')
  })

  it('says how to get a farmhand, with none', async () => {
    useGame.setState({ save: { ...farm(), roster: { 303: newRosterUma(1) }, love: { 303: newLove() } } })
    await render(<BookPage />, '/book')
    expect($('[data-no-hands]')?.textContent).toContain('invite her to work')
  })

  it('adds a task from the side panel, free, and removes one', async () => {
    await render(<BookPage />, `/book?task=${A}`)
    expect($(`[data-add-task="${A}"]`)).not.toBeNull()
    await click($('[data-kind="fish"]'))
    await click($('[data-where="pond"]'))
    expect($('[data-where="river"]')?.hasAttribute('disabled')).toBe(true)
    expect($('[data-action="add-task-confirm"]')?.textContent).toBe('Add · Fish · the Pond')
    await click($('[data-action="add-task-confirm"]'))
    expect(useGame.getState().save!.roster[A]!.tasks).toEqual([{ kind: 'fish', spot: 'pond' }])
    expect(useGame.getState().save!.today.actions).toBe(0)
    await render(<BookPage />, `/book?task=${A}&again=1`)
    await click($('[data-kind="water"]'))
    await click($('[data-row="1"]'))
    await click($('[data-row="2"]'))
    await click($('[data-action="add-task-confirm"]'))
    expect(useGame.getState().save!.roster[A]!.tasks!.map((t) => t.kind)).toEqual(['fish', 'water'])
    await render(<BookPage />, '/book')
    await click($(`[data-hand="${A}"] [data-task="water"] [data-action="task-up"]`))
    expect(useGame.getState().save!.roster[A]!.tasks!.map((t) => t.kind)).toEqual(['water', 'fish'])
    await click($(`[data-hand="${A}"] [data-task="fish"] [data-action="task-remove"]`))
    expect(useGame.getState().save!.roster[A]!.tasks).toEqual([{ kind: 'water', tiles: Array.from({ length: 16 }, (_, i) => i) }])
  })
})

describe('the morning', () => {
  const summary = (lines: Partial<MorningSummary>): MorningSummary => ({ day: 4, bin: [], work: [], ranks: [], hearts: [], news: [], nudges: [], ...lines })
  it('reports each farmhand\'s night and the aptitudes she reached, each a tap to the board or her profile', () => {
    const parts = summaryParts(summary({
      work: [
        { kind: 'farmhand', id: A, actions: 4, spent: 4, half: false, fed: true, done: { water: 3, fish: 1 }, items: 1 },
        { kind: 'farmhand', id: B, actions: 1, spent: 1, half: true, fed: false, done: { chop: 1 }, items: 2 },
        { kind: 'grew', tiles: 3, ripe: 0 },
      ],
      ranks: [{ kind: 'aptitude', outfitId: A, aptitude: 'water', level: 3 }],
    }), (id) => (id === A ? 'Uma A' : 'Uma B'))
    const work = parts.find((p) => p.section === 'work')!.lines
    expect(work.slice(0, 2)).toEqual([
      { key: `farmhand:${A}`, to: '/book', text: 'Uma A · 4 of 4 actions · watered 3 tiles · caught 1 fish · +1 good', tag: 'Well fed' },
      { key: `farmhand:${B}`, to: '/book', text: 'Uma B · 1 of 1 action · chopped once · +2 goods', tag: 'Half pace', warn: true },
    ])
    expect(parts.find((p) => p.section === 'ranks')!.lines).toEqual([
      { key: `aptitude:${A}:water`, to: `/hearts?view=work&uma=${A}`, tag: 'Aptitude', text: 'Uma A · Watering 3 · Two tiles an action' },
    ])
  })
})
