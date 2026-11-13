// Chapter 1's reward on its cards (F46's loose end): on save v4 a chapter's new hand is the cast's authored arrival
// for it, so the reward names "a new hand" only when the cast has a chapter-1 arrival (never who). M4's
// v3 keeps its words. The invented stand-in pack (its three arrive with the opening), and a copy of it with a chapter-1
// arrival added; invented saves; the server is a stub.
import 'fake-indexeddb/auto'
import { newSave, newSaveV4, type MorningSummaryV4, type StoryPack } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const story = vi.hoisted(() => ({ pack: null as StoryPack | null }))
vi.mock('../story/story', async (importOriginal) => ({ ...await importOriginal<typeof import('../story/story')>(), useStory: () => story.pack }))
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return { ...actual, saveApi: { load: vi.fn(async () => ({ revision: 0, save: null })), put: vi.fn(async (_: number, save: unknown) => ({ revision: 1, save })) } }
})

const { useGame, resetGame } = await import('../save/game')
const { storyReady } = await import('../story/story')
const { ChapterOneCard } = await import('./ScenePlayer')
const { default: DiaryPage } = await import('./DiaryPage')
const { chapterDoneWords, chapterHand, rewardWords } = await import('./goal-words')
const { summaryParts } = await import('./summary-words')

const AT = '2026-11-12T10:00:00.000Z'
const WITH_HAND = 'Reward: +500g, the Mill’s plans, a new hand, 250 Farm Rank points.'
const WITHOUT = 'Reward: +500g, the Mill’s plans, 250 Farm Rank points.'

const standIn = await storyReady()
/** The stand-in with a fourth Uma who arrives as chapter 1 completes. */
const withArrival: StoryPack = {
  ...standIn, cast: { ...standIn.cast, umas: [...standIn.cast.umas, { ...standIn.cast.umas[2]!, characterId: '9000099', arrives: { kind: 'chapter', chapter: 1 } }] },
}

let host: HTMLDivElement
let root: Root
async function render(node: ReactNode) {
  await act(async () => root.render(<MemoryRouter>{node}</MemoryRouter>))
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null

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
  story.pack = null
  vi.unstubAllGlobals()
})

describe('whether chapter 1 brings a new hand', () => {
  it('is its drawn recruit on v3, and on v4 the cast\'s chapter-1 arrival, none without the pack', () => {
    expect(standIn.cast.umas.some((u) => u.arrives.kind === 'chapter')).toBe(false)
    expect(chapterHand(3, null, 1)).toBe(true)
    expect(chapterHand(3, standIn, 1)).toBe(true)
    expect(chapterHand(4, standIn, 1)).toBe(false)
    expect(chapterHand(4, withArrival, 1)).toBe(true)
    expect(chapterHand(4, null, 1)).toBe(false)
    expect(chapterHand(4, withArrival, 2)).toBe(false) // chapter 2 has no reward yet
  })
  it('names the reward with the hand, or without it', () => {
    expect(rewardWords(1)).toBe('+500g, the Mill’s plans, a new hand, 250 Farm Rank points')
    expect(rewardWords(1, false)).toBe('+500g, the Mill’s plans, 250 Farm Rank points')
    expect(chapterDoneWords(1, false)).toBe('Chapter 1 done · +500g, the Mill’s plans, 250 Farm Rank points')
    expect(chapterDoneWords(1)).toBe('Chapter 1 done · +500g, the Mill’s plans, a new hand, 250 Farm Rank points')
  })
})

describe('chapter 1\'s card on v4 (romance build)', () => {
  beforeEach(() => useGame.setState({ uid: 'u1', status: 'ready', save: newSaveV4('u1', AT) }))

  it('names no new hand when the cast has no chapter-1 arrival', async () => {
    story.pack = standIn
    await render(<ChapterOneCard onPlant={() => undefined} />)
    expect($('[data-chapter-card="1"] [data-reward]')?.textContent).toBe(WITHOUT)
  })
  it('keeps "a new hand", unnamed, when the cast has one', async () => {
    story.pack = withArrival
    await render(<ChapterOneCard onPlant={() => undefined} />)
    expect($('[data-chapter-card="1"] [data-reward]')?.textContent).toBe(WITH_HAND)
  })
  it('says the same in the Diary\'s card and the morning\'s chapter line', async () => {
    story.pack = standIn
    await render(<DiaryPage />)
    expect($('[data-chapter="1"] [data-reward]')?.textContent).toBe('Reward: +500g, the Mill’s plans, 250 Farm Rank points')
    const base = newSaveV4('u1', AT)
    await act(async () => useGame.setState({ save: { ...base, farm: { ...base.farm, chapter: 2 } } }))
    expect($('[data-done-chapter]')?.textContent).toBe('Chapter 1 done · +500g, the Mill’s plans, 250 Farm Rank points')
    const summary: MorningSummaryV4 = { day: 8, bin: [], work: [], ranks: [], hearts: [], news: [{ kind: 'chapter', chapter: 1 }], nudges: [] }
    const line = (pack: StoryPack) => summaryParts(summary, undefined, [], null, undefined, (n) => chapterHand(4, pack, n))[0]!.lines[0]!.text
    expect(line(standIn)).toBe('Chapter 1 done · +500g, the Mill’s plans, 250 Farm Rank points')
    expect(line(withArrival)).toBe('Chapter 1 done · +500g, the Mill’s plans, a new hand, 250 Farm Rank points')
  })
})

describe('M4\'s v3 card (unchanged)', () => {
  it('names the new hand, whatever the pack', async () => {
    useGame.setState({ uid: 'u1', status: 'ready', save: newSave('u1', AT) })
    await render(<ChapterOneCard onPlant={() => undefined} />)
    expect($('[data-chapter-card="1"] [data-reward]')?.textContent).toBe(WITH_HAND)
    story.pack = standIn
    await render(<ChapterOneCard onPlant={() => undefined} />)
    expect($('[data-chapter-card="1"] [data-reward]')?.textContent).toBe(WITH_HAND)
  })
})
