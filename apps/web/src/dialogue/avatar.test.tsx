// Her picture and the avatar on master data's synthetic `dialogue-portraits` family and an invented art index (invented
// ids, fake pictures): the square cut from her season's base around its face (spring when that base isn't drawn), the
// avatar's rounded square with its corners outside the picture's clip, then for an Uma without portraits master data's
// face (no base fetched for her), and without that the blank profile in the season's colours; and uma-kit's face tiles
// showing the same through the album's art.
import { syntheticDialoguePortraits } from '@luismlorenzana/uma-data/testing'
import { AlbumArtProvider, FaceTile } from '@luismlorenzana/uma-kit/album'
import { ContentProvider } from '@luismlorenzana/uma-kit/content'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({ view: null as unknown }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => ({ status: 'ready', view: fixture.view }),
}))
vi.mock('../content/client', () => ({ CONTENT: { release: vi.fn(), artUrl: async (p: string) => `blob:${p}`, hold: () => () => undefined } }))

const { Avatar } = await import('./Avatar')
const { PICTURE_FACE_AT, PICTURE_SPAN, pictureFrame, pictureSource, pictureStyle } = await import('./picture')
const { setPortraitSource } = await import('./portraits')
const { SEASON_CLOTH, seasonBackdrop } = await import('./blank-profile')
const { ALBUM_ART } = await import('../master/album-art')
const { useGame } = await import('../save/game')

const ID = '9000001'
/** Her invented portraits: spring, summer and work bases (no autumn or winter), a face. */
const PORTRAITS = syntheticDialoguePortraits(Number(ID), ['spring', 'summer', 'farm-work'], ['happy'])
const art = { artUrl: vi.fn(async (path: string) => `blob:${path}`), hold: () => () => undefined }
const portraitsOf = vi.fn(async (id: string) => (id === ID ? PORTRAITS : null))
/** Master data, invented: her portraits listed; an Uma with an outfit face (9000002), one of the town's people with a
 * character face (9000004), and one with neither (9000003). */
const OUTFIT_FACE = 'art/outfit-faces/9000002.webp'
const CHARACTER_FACE = 'art/character-faces/9000004.webp'
fixture.view = {
  album: new Map(), stats: new Map(), birthdays: new Map(), colors: new Map(),
  names: new Map([['9000004', 'Town Person']]),
  outfits: new Map([['9000002', { characterId: '9000002', variant: null }]]),
  art: {
    atlases: {},
    images: { 'outfit-faces': { '9000002': { path: OUTFIT_FACE, width: 192, height: 192 } }, 'character-faces': { '9000004': { path: CHARACTER_FACE, width: 128, height: 128 } } },
    dialoguePortraits: { [ID]: 'art/dialogue-portraits/9000001.json' },
  },
}
/** The content client the app provides: master data's faces load through it. */
const content = (node: ReactNode) => <ContentProvider client={art as never}>{node}</ContentProvider>
const basesLoaded = () => art.artUrl.mock.calls.filter(([path]) => path.startsWith('art/dialogue-portraits/')).length

let host: HTMLDivElement
let root: Root
const settle = async () => { for (let i = 0; i < 3; i++) await act(async () => { await new Promise((r) => setTimeout(r, 0)) }) }
const $ = (selector: string) => host.querySelector(selector) as HTMLElement | null
/** Today, on the store: day 1 is Spring 1, day 14 Summer 2, day 30 Autumn 6, day 40 Winter 4. */
const today = (day: number) => useGame.setState({ save: { calendar: { day }, roster: {} } as never })
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  art.artUrl.mockClear()
  portraitsOf.mockClear()
  setPortraitSource({ portraitsOf, art })
  today(1)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  setPortraitSource(null)
  useGame.setState({ save: null })
  vi.unstubAllGlobals()
})

describe('her picture’s frame', () => {
  it('is a square PICTURE_SPAN faces wide around her face, centred across and a little above the middle, inside the base', () => {
    const base = PORTRAITS.bases.spring!
    const frame = pictureFrame(base, PORTRAITS.faceSize)
    expect(frame.side).toBe(Math.round(224 * PICTURE_SPAN))
    // Her face's middle (262, 252) sits at the square's middle across and PICTURE_FACE_AT down it.
    expect(frame.left).toBe(Math.round(base.face.left + 112 - frame.side / 2))
    expect(frame.top).toBe(Math.round(base.face.top + 112 - frame.side * PICTURE_FACE_AT))
  })
  it('never leaves the base, and is never wider than it', () => {
    const side = Math.round(224 * PICTURE_SPAN)
    expect(pictureFrame({ width: 525, height: 700, face: { left: 0, top: 0 } }, { width: 224, height: 224 })).toEqual({ left: 0, top: 0, side })
    expect(pictureFrame({ width: 525, height: 700, face: { left: 301, top: 476 } }, { width: 224, height: 224 })).toEqual({ left: 525 - side, top: 700 - side, side })
    expect(pictureFrame({ width: 300, height: 340, face: { left: 40, top: 40 } }, { width: 224, height: 224 }).side).toBe(300)
  })
  it('places the base so its frame fills a square box', () => {
    const source = pictureSource(PORTRAITS, 'spring')
    if (source.kind !== 'base') throw new Error('a base')
    const { left, top, side } = source.frame
    expect(pictureStyle(source)).toEqual({ left: `${(-left / side) * 100}%`, top: `${(-top / side) * 100}%`, width: `${(525 / side) * 100}%`, height: `${(700 / side) * 100}%` })
  })
})

describe('her picture’s source', () => {
  it('is her base for today’s season, cut in place: autumn’s is `fall`, and spring’s when that one isn’t drawn', () => {
    expect(pictureSource(PORTRAITS, 'summer')).toMatchObject({ kind: 'base', outfit: 'summer', path: PORTRAITS.bases.summer!.path })
    expect(pictureSource(syntheticDialoguePortraits(1, ['spring', 'fall']), 'autumn')).toMatchObject({ outfit: 'fall' })
    expect(pictureSource(PORTRAITS, 'autumn')).toMatchObject({ outfit: 'spring', path: PORTRAITS.bases.spring!.path })
    expect(pictureSource(PORTRAITS, 'winter')).toMatchObject({ outfit: 'spring' })
  })
})

describe('the avatar', () => {
  it('is a rounded square with her season’s crop, her badges in its corners outside the picture’s clip', async () => {
    today(14)
    await act(async () => root.render(<div style={{ width: 56 }}><Avatar id={ID} size={56} label="Her" badges={{ topLeft: <b data-badge="tl" />, bottomRight: <b data-badge="br" /> }} /></div>))
    await settle()
    const avatar = $(`[data-avatar="${ID}"]`)!
    expect(avatar.style.maxWidth).toBe('56px')
    const clip = avatar.querySelector('[role="img"]') as HTMLElement
    expect(clip.getAttribute('aria-label')).toBe('Her')
    expect(clip.className).toContain('rounded-avatar')
    expect(clip.className).not.toContain('rounded-full')
    expect($('[data-picture]')?.dataset.picture).toBe('summer')
    const img = $('[data-picture-cut="base"]') as HTMLImageElement
    expect(img.getAttribute('src')).toBe(`blob:${PORTRAITS.bases.summer!.path}`)
    expect(img.style.left).toBe(pictureStyle(pictureSource(PORTRAITS, 'summer') as never).left)
    // The badges are the avatar's, not the clip's.
    for (const badge of ['tl', 'br']) {
      const corner = $(`[data-badge="${badge}"]`)!.parentElement!
      expect(corner.parentElement).toBe(avatar)
      expect(clip.contains(corner)).toBe(false)
    }
    expect($('[data-badge="tl"]')!.parentElement!.className).toContain('top-1 left-1')
  })
  it('changes with the season: her spring base in winter, as she has no winter one', async () => {
    today(40)
    await act(async () => root.render(<Avatar id={ID} size={40} label="Her" />))
    await settle()
    expect($('[data-picture]')?.dataset.picture).toBe('spring')
  })
  it('shows nothing while her portraits are read, so a pilot’s picture never flashes blank', async () => {
    let release: (p: typeof PORTRAITS) => void = () => undefined
    setPortraitSource({ portraitsOf: () => new Promise((r) => { release = r }), art })
    await act(async () => root.render(<Avatar id={ID} size={40} label="Her" />))
    await settle()
    expect($('[data-picture]')?.dataset.picture).toBe('loading')
    expect($('[data-blank-profile]')).toBeNull()
    await act(async () => release(PORTRAITS))
    await settle()
    expect($('[data-picture]')?.dataset.picture).toBe('spring')
  })
  it('without portraits, is master data’s face filling the square as uma-kit’s FaceTile did, and loads no base', async () => {
    await act(async () => root.render(content(<><Avatar id="9000002" size={40} label="Another" /><Avatar id="9000004" size={40} label="Town Person" /></>)))
    await settle()
    const faces = [...host.querySelectorAll<HTMLImageElement>('[data-picture="face"] img[data-picture-cut="face"]')]
    expect(faces.map((f) => f.getAttribute('src'))).toEqual([`blob:${OUTFIT_FACE}`, `blob:${CHARACTER_FACE}`])
    expect(faces[0]!.className).toContain('object-cover')
    expect($('[data-blank-profile]')).toBeNull()
    expect(basesLoaded()).toBe(0)
  })
  it('without portraits or a face, is her blank profile in the season’s colours, and loads no picture', async () => {
    today(30)
    await act(async () => root.render(content(<Avatar id="9000003" size={40} label="Another" />)))
    await settle()
    expect($('[data-picture]')?.dataset.picture).toBe('blank')
    const blank = $('[data-blank-profile="9000003"]')!
    expect(blank.dataset.season).toBe('autumn')
    expect(blank.querySelector('rect')?.getAttribute('fill')).toBe(seasonBackdrop('autumn'))
    expect(blank.innerHTML).toContain(SEASON_CLOTH.autumn.main)
    expect(blank.textContent).toBe('A')
    expect(art.artUrl).not.toHaveBeenCalled()
  })
})

describe('uma-kit’s face tiles', () => {
  const tile = (id: string) => content(<AlbumArtProvider art={ALBUM_ART}><FaceTile outfitId={id} size={68} label="Her" /></AlbumArtProvider>)
  it('get no URL for her face while she has portraits: the album’s fallback draws her picture’s crop', async () => {
    await act(async () => root.render(tile(ID)))
    await settle()
    expect(host.querySelector('[role="img"] img[data-picture-cut="base"]')?.getAttribute('src')).toBe(`blob:${PORTRAITS.bases.spring!.path}`)
  })
  it('get master data’s face as before when she has none, and her blank profile without a face', async () => {
    await act(async () => root.render(tile('9000002')))
    await settle()
    expect(host.querySelector('[role="img"] > img')?.getAttribute('src')).toBe(`blob:${OUTFIT_FACE}`)
    expect($('[data-picture]')).toBeNull()
    await act(async () => root.render(tile('9000003')))
    await settle()
    expect($('[data-blank-profile="9000003"]')?.dataset.season).toBe('spring')
    expect(basesLoaded()).toBe(0)
  })
})
