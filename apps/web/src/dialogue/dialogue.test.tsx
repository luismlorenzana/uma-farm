// The dialogue engine on master data's synthetic `dialogue-portraits` family (invented ids, fake pictures): a line's
// pick (the outfit's base, the emote's face or its nearest), the compositor (the face at its base's position, swapped
// line by line with a fade, at once with reduced motion), the blank bust an Uma without portraits shows (her outfit's
// silhouette, her tint, a face for each of the 22 expressions, swapped as a portrait's), and the art source reading her
// portraits from the release, with nothing fetched for an Uma the family doesn't hold.
import { createReleaseClient, type MasterData } from '@luismlorenzana/uma-data'
import { buildMemoryRelease, createMemorySource, syntheticDialoguePortraits, syntheticMasterData } from '@luismlorenzana/uma-data/testing'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({ view: null as unknown, release: vi.fn() }))
vi.mock('../master/master', async (importOriginal) => ({ ...await importOriginal<typeof import('../master/master')>(), masterReady: vi.fn(async () => fixture.view) }))
vi.mock('../content/client', () => ({ CONTENT: { release: fixture.release, artUrl: async (p: string) => `blob:${p}`, hold: () => () => undefined } }))

const { SceneBust, SceneLookProvider, FADE_MS } = await import('./Bust')
const { BLANK_FACES, blankTint, mix } = await import('./blank')
const { EXPRESSION_IDS } = await import('@farm/domain')
const { portraitPick, setPortraitSource } = await import('./portraits')

const ID = 9000001
/** Her invented portraits: three outfits, four faces. */
const PORTRAITS = syntheticDialoguePortraits(ID, ['spring', 'farm-work', 'fall'], ['happy', 'shy', 'sad', 'tender'])
const ART = { artUrl: async (path: string) => `blob:${path}`, hold: () => () => undefined }

let host: HTMLDivElement
let root: Root
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const $ = (selector: string) => host.querySelector(selector) as HTMLElement | null
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  setPortraitSource(null)
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('a line’s pick', () => {
  it('the outfit’s base and the emote’s face at that base’s position', () => {
    const pick = portraitPick(PORTRAITS, 'farm-work', 'shy')
    expect(pick).toMatchObject({ outfit: 'farm-work', expression: 'shy', base: PORTRAITS.bases['farm-work'], face: PORTRAITS.faces.shy, at: PORTRAITS.bases['farm-work']!.face })
  })
  it('a face she hasn’t got shows its nearest, then neutral (the base alone); an unknown emote is neutral', () => {
    expect(portraitPick(PORTRAITS, 'spring', 'flustered')).toMatchObject({ expression: 'shy', face: PORTRAITS.faces.shy })
    expect(portraitPick(PORTRAITS, 'spring', 'tearful-joy')).toMatchObject({ expression: 'tender' })
    expect(portraitPick(PORTRAITS, 'spring', 'worried')).toMatchObject({ expression: 'sad' })
    expect(portraitPick(PORTRAITS, 'spring', 'angry')).toMatchObject({ expression: 'neutral', face: null })
    expect(portraitPick(PORTRAITS, 'spring', 'wistful')).toMatchObject({ expression: 'neutral', face: null })
  })
  it('an outfit she hasn’t got shows spring', () => {
    expect(portraitPick(PORTRAITS, 'kimono', 'happy')).toMatchObject({ outfit: 'spring', base: PORTRAITS.bases.spring })
  })
})

describe('the blank bust', () => {
  const blank = (emote: string | null, look: Parameters<typeof SceneLookProvider>[0]['value'] = { day: 1 }) => (
    <SceneLookProvider value={look}><SceneBust who="9000002" name="Another" emote={emote} size={200} /></SceneLookProvider>
  )
  it('draws a face for every one of the 22 expressions, each its own', () => {
    expect(Object.keys(BLANK_FACES).sort()).toEqual([...EXPRESSION_IDS].sort())
    const looks = new Set(Object.values(BLANK_FACES).map((f) => JSON.stringify(f)))
    expect(looks.size).toBe(EXPRESSION_IDS.length)
  })
  it('tints her hair by her theme colour, else by her id, the same every time', () => {
    expect(blankTint('9000002', { main: '#ff88aa', sub: '#3366cc' })).toEqual({ hair: mix('#ff88aa', '#5c4a3d', 0.35), ribbon: '#3366cc', eyes: mix('#3366cc', '#2a2030', 0.35) })
    expect(blankTint('9000002')).toEqual(blankTint('9000002'))
    expect(blankTint('9000002', { main: 'nonsense', sub: '' }).hair).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('shows an Uma without portraits in the scene’s outfit, her face the line’s emote, swapping with the fade', async () => {
    setPortraitSource({ portraitsOf: async () => null, art: ART })
    await act(async () => root.render(blank('happy', { own: 'kimono', day: 1 })))
    await settle()
    await settle()
    const bust = $('[data-bust-art="blank"]')!
    expect(bust.dataset.portrait).toBe('kimono')
    expect(bust.style.aspectRatio).toBe('525 / 700')
    expect($('[data-blank-base="kimono"]')).not.toBeNull()
    const face = $('[data-blank-face]')!
    expect(face.dataset.blankFace).toBe('happy')
    expect(face.style.left).toBe(`${(150 / 525) * 100}%`)
    expect(face.style.top).toBe(`${(188 / 700) * 100}%`)
    // Every emote is drawn: a romance one and an extra one show as written.
    await act(async () => root.render(blank('tearful-joy', { own: 'kimono', day: 1 })))
    await settle()
    expect(bust.dataset.expression).toBe('tearful-joy')
    expect($('[data-blank-face="tearful-joy"]')?.style.animation).toContain('portrait-face-in')
    await act(async () => { await new Promise((r) => setTimeout(r, FADE_MS + 20)) })
    expect(host.querySelectorAll('[data-bust-art="blank"] > span').length).toBe(1)
    // An unknown emote is neutral; the wedding night wears its outfit.
    await act(async () => root.render(blank('wistful', { moments: ['wedding-night'], day: 1 })))
    await settle()
    expect($('[data-bust-art="blank"]')?.dataset.expression).toBe('neutral')
    expect($('[data-bust-art="blank"]')?.dataset.portrait).toBe('wedding-night')
  })
  it('holds her place while her portraits load, so a pilot’s bust never flashes blank', async () => {
    let release: (p: typeof PORTRAITS) => void = () => undefined
    setPortraitSource({ portraitsOf: () => new Promise((r) => { release = r }), art: ART })
    await act(async () => root.render(
      <SceneLookProvider value={{ own: 'work', day: 1 }}><SceneBust who={String(ID)} name="Her" emote="happy" size={200} /></SceneLookProvider>,
    ))
    await settle()
    expect($('[data-bust-art="loading"]')).not.toBeNull()
    expect($('[data-bust-art="blank"]')).toBeNull()
    await act(async () => release(PORTRAITS))
    await settle()
    await settle()
    expect($('[data-bust-art="portrait"]')?.dataset.portrait).toBe('farm-work')
  })
})

describe('the compositor', () => {
  const bust = (emote: string | null, own = 'work') => (
    <SceneLookProvider value={{ own, day: 1, leads: [String(ID)] }}>
      <SceneBust who={String(ID)} name="Her" emote={emote} size={200} />
    </SceneLookProvider>
  )
  it('draws the scene’s outfit with the line’s face over it at the base’s face position, in the base’s proportions', async () => {
    setPortraitSource({ portraitsOf: async (id) => (id === String(ID) ? PORTRAITS : null), art: ART })
    await act(async () => root.render(bust('happy')))
    await settle()
    await settle()
    const portrait = $('[data-portrait]')!
    expect(portrait.dataset.portrait).toBe('farm-work')
    expect(portrait.style.aspectRatio).toBe('525 / 700')
    expect($('[data-portrait-base]')?.getAttribute('src')).toBe(`blob:${PORTRAITS.bases['farm-work']!.path}`)
    const face = $('[data-portrait-face]')!
    expect(face.dataset.portraitFace).toBe('happy')
    const { left, top } = PORTRAITS.bases['farm-work']!.face
    expect(face.style.left).toBe(`${(left / 525) * 100}%`)
    expect(face.style.top).toBe(`${(top / 700) * 100}%`)
    expect(face.style.width).toBe(`${(224 / 525) * 100}%`)
  })
  it('stands in a box as wide as her panel, with a backdrop or without: Safari sizes a shrink-to-fit box around her as 0 px wide', async () => {
    const { BustPanel } = await import('./Stage')
    setPortraitSource({ portraitsOf: async () => PORTRAITS, art: ART })
    for (const backdrop of [null, <span key="b" data-backdrop />]) {
      await act(async () => root.render(
        <SceneLookProvider value={{ day: 1, leads: [String(ID)] }}><BustPanel bust={{ who: String(ID), name: 'Her', emote: 'happy' }} backdrop={backdrop} /></SceneLookProvider>,
      ))
      await settle()
      const box = $('[data-bust-box]')!
      expect(box.classList.contains('w-full')).toBe(true)
      expect(box.classList.contains('h-full')).toBe(true)
      expect(box.querySelector('[data-portrait]')).not.toBeNull()
    }
  })
  it('swaps only the face, fading the new one in over the last; neutral fades it away; reduced motion swaps at once', async () => {
    setPortraitSource({ portraitsOf: async () => PORTRAITS, art: ART })
    await act(async () => root.render(bust('happy')))
    await settle()
    await settle()
    const base = $('[data-portrait-base]')
    await act(async () => root.render(bust('sad')))
    await settle()
    await settle()
    // The same base; the new face over the last while it fades in.
    expect($('[data-portrait-base]')).toBe(base)
    expect([...host.querySelectorAll('[data-portrait] img:not([data-portrait-base])')].length).toBe(2)
    expect($('[data-portrait-face="sad"]')?.style.animation).toContain('portrait-face-in')
    await act(async () => { await new Promise((r) => setTimeout(r, FADE_MS + 20)) })
    expect([...host.querySelectorAll('[data-portrait] img:not([data-portrait-base])')].length).toBe(1)
    await act(async () => root.render(bust(null)))
    await settle()
    expect($('[data-portrait]')?.dataset.expression).toBe('neutral')
    expect(host.querySelector<HTMLElement>('[data-portrait] img:not([data-portrait-base])')?.style.animation).toContain('portrait-face-out')
    await act(async () => { await new Promise((r) => setTimeout(r, FADE_MS + 20)) })
    expect(host.querySelectorAll('[data-portrait] img:not([data-portrait-base])').length).toBe(0)
    // The device asks for reduced motion.
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), addEventListener: () => undefined, removeEventListener: () => undefined }))
    await act(async () => root.render(bust('tender')))
    await settle()
    await settle()
    expect($('[data-portrait-face="tender"]')?.style.animation).toBe('')
  })
  it('the scene’s own outfit, else the moment’s, else the day’s season', async () => {
    setPortraitSource({ portraitsOf: async () => PORTRAITS, art: ART })
    const look = (value: Parameters<typeof SceneLookProvider>[0]['value']) => (
      <SceneLookProvider value={value}><SceneBust who={String(ID)} name="Her" emote={null} size={200} /></SceneLookProvider>
    )
    await act(async () => root.render(look({ own: 'autumn', moments: ['work'], day: 1 })))
    await settle()
    await settle()
    expect($('[data-portrait]')?.dataset.portrait).toBe('fall')
    await act(async () => root.render(look({ moments: ['work'], day: 1 })))
    await settle()
    expect($('[data-portrait]')?.dataset.portrait).toBe('farm-work')
    // Autumn by the calendar (day 25), with no outfit of its own.
    await act(async () => root.render(look({ day: 61 })))
    await settle()
    expect($('[data-portrait]')?.dataset.portrait).toBe('fall')
    // A dinner she has no dress for: spring.
    await act(async () => root.render(look({ moments: ['dinner'], day: 61 })))
    await settle()
    expect($('[data-portrait]')?.dataset.portrait).toBe('spring')
  })
})

describe('the art source', () => {
  it('reads her portraits from master data’s family, checked against the release; nothing is fetched for one it doesn’t hold', async () => {
    const data: MasterData = syntheticMasterData()
    const { manifest, objects } = await buildMemoryRelease(data, { dialoguePortraits: [PORTRAITS] })
    const client = createReleaseClient({ source: createMemorySource(objects) })
    const art = await client.art(manifest)
    expect(art?.dialoguePortraits?.[String(ID)]).toBeTruthy()
    fixture.view = { manifest, art }
    fixture.release.mockResolvedValue(client)
    fixture.release.mockClear()
    setPortraitSource(null)
    await act(async () => root.render(
      <SceneLookProvider value={{ own: 'work', day: 1 }}>
        <SceneBust who={String(ID)} name="Her" emote="happy" size={200} />
      </SceneLookProvider>,
    ))
    for (let i = 0; i < 20 && !$('[data-portrait]'); i++) await settle()
    expect($('[data-portrait]')?.dataset.portrait).toBe('farm-work')
    expect(fixture.release).toHaveBeenCalledTimes(1)
    fixture.release.mockClear()
    await act(async () => root.render(
      <SceneLookProvider value={{ day: 1 }}><SceneBust who="9000002" name="Another" emote="happy" size={200} /></SceneLookProvider>,
    ))
    await settle()
    expect(fixture.release).not.toHaveBeenCalled()
  })
})
