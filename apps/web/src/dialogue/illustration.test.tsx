// Her illustration in the dialogue engine, on master data's synthetic `illustrations` family (invented ids, fake
// pictures): full screen behind the frame, the text box over its lower edge and no bust while it's up, fading in and out
// (swapping at once with reduced motion), the dark ground while it loads, her bust for a moment she has no scene for or
// a picture that can't load, each one shown handed to the gallery once; and the source reading her manifest from the
// release, with nothing fetched for an Uma the family doesn't hold.
import { illustrate, illustrationAt, sceneSteps, type Step } from '@farm/domain'
import { createReleaseClient, type MasterData } from '@luismlorenzana/uma-data'
import { buildMemoryRelease, createMemorySource, syntheticIllustrations, syntheticMasterData } from '@luismlorenzana/uma-data/testing'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({ view: null as unknown, release: vi.fn() }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view),
  useMaster: () => (fixture.view ? { status: 'ready', view: fixture.view } : { status: 'loading' }),
}))
vi.mock('../content/client', () => ({ CONTENT: { release: fixture.release, artUrl: async (p: string) => `blob:${p}`, hold: () => () => undefined } }))

const { ArtCue, ArtHost, ART_FADE_MS } = await import('./Illustration')
const { Stage } = await import('./Stage')
const { Line } = await import('./Line')
const { setIllustrationSource } = await import('./illustrations')

const ID = '9000001'
const OTHER = '9000002'
const ILLS = syntheticIllustrations(Number(ID), ['meeting', 'confession', 'confession-yes'])
const ART = { artUrl: async (path: string) => `blob:${path}`, hold: () => () => undefined }
/** Her confession by the default mapping: a line, the question, the answer, her line after it. */
const CONFESSION = illustrate('confession', [
  { narrate: 'Dusk.' }, { say: ID, line: 'I like you.' }, { choice: [{ text: 'Yes.', answer: 'yes', then: [{ say: ID, line: 'Oh!' }] }, { text: 'Not yet.', answer: 'not-yet' }] },
] as Step[])

let host: HTMLDivElement
let root: Root
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const $ = (selector: string) => host.querySelector(selector) as HTMLElement | null
const seen = vi.fn(async () => undefined)

/** A scene's frame with her steps at `at` (`picks` made): the cue, and the stage with the line or the choice. */
function scene(owner: string, steps: readonly Step[], at: number, picks: number[] = []) {
  const shown = sceneSteps(steps, picks)
  const step = shown[at]!
  return (
    <ArtHost onSeen={seen}>
      <header data-head>Title</header>
      <ArtCue owner={owner} ask={illustrationAt(shown, at)} steps={steps} />
      <Stage bust={{ who: owner, name: 'Her' }}>
        {'choice' in step ? <div data-choice>{step.choice.map((o, i) => <button key={i} data-option={i}>{o.text}</button>)}</div>
          : <Line step={step} nameOf={() => 'Her'} farmer="Robin" onNext={() => undefined} />}
      </Stage>
    </ArtHost>
  )
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  seen.mockClear()
  fixture.view = null
  // As master data's art index says it: only she is listed, so nothing loads (or flashes) for anyone else.
  setIllustrationSource({ illustrationsOf: async (id) => (id === ID ? ILLS : null), listed: (id) => id === ID, art: ART })
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  setIllustrationSource(null)
  vi.unstubAllGlobals()
})

describe('her illustration on the stage', () => {
  it('comes up full screen with the text box over it and no bust, fading in; it joins her gallery once', async () => {
    // Her question: the line before the answer.
    await act(async () => root.render(scene(ID, CONFESSION, 2)))
    await settle()
    await settle()
    const layer = $('[data-illustration]')!
    expect(layer.dataset.illustration).toBe('confession')
    expect(layer.getAttribute('aria-label')).toBe('Scene confession')
    expect(layer.className).toContain('fixed inset-0')
    expect(layer.style.animation).toContain('portrait-face-in')
    expect($('[data-illustration-picture]')?.getAttribute('src')).toBe(`blob:${ILLS.scenes[1]!.path}`)
    expect($('[data-art-stage]')?.dataset.artStage).toBe('up')
    expect($('[data-art-box] [data-line]')?.textContent).toBe('I like you.')
    expect($('[data-stage-bust]')).toBeNull()
    expect(seen).toHaveBeenCalledWith(ID, 'confession')
    expect(seen).toHaveBeenCalledTimes(1)
  })
  it('swaps to her yes, the new picture fading in over the last', async () => {
    await act(async () => root.render(scene(ID, CONFESSION, 3)))
    await settle()
    await settle()
    expect($('[data-art-box] [data-choice]')).not.toBeNull()
    await act(async () => root.render(scene(ID, CONFESSION, 5, [0])))
    await settle()
    await settle()
    expect($('[data-illustration]')?.dataset.illustration).toBe('confession-yes')
    expect(host.querySelectorAll('[data-illustration] img').length).toBe(2)
    expect($('[data-illustration-picture]')?.style.animation).toContain('portrait-face-in')
    await act(async () => { await new Promise((r) => setTimeout(r, ART_FADE_MS + 20)) })
    expect(host.querySelectorAll('[data-illustration] img').length).toBe(1)
    expect(seen).toHaveBeenLastCalledWith(ID, 'confession-yes')
  })
  it('a Not yet takes it down: it fades out and her bust is back', async () => {
    await act(async () => root.render(scene(ID, CONFESSION, 3)))
    await settle()
    await settle()
    await act(async () => root.render(scene(ID, CONFESSION, 4, [1])))
    await settle()
    expect($('[data-stage-bust]')).not.toBeNull()
    expect($('[data-illustration]')?.style.animation).toContain('portrait-face-out')
    await act(async () => { await new Promise((r) => setTimeout(r, ART_FADE_MS + 20)) })
    expect($('[data-illustration]')).toBeNull()
  })
  it('with reduced motion it simply swaps', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), addEventListener: () => undefined, removeEventListener: () => undefined }))
    await act(async () => root.render(scene(ID, CONFESSION, 2)))
    await settle()
    await settle()
    expect($('[data-illustration]')?.style.animation).toBe('')
    await act(async () => root.render(scene(ID, CONFESSION, 4, [1])))
    await settle()
    expect($('[data-illustration]')).toBeNull()
  })
  it('holds a dark ground while the picture loads, never a bust', async () => {
    let release = (_: string) => undefined as void
    setIllustrationSource({ illustrationsOf: async () => ILLS, art: { artUrl: (path: string) => new Promise<string>((r) => { release = () => r(`blob:${path}`) }), hold: () => () => undefined } })
    await act(async () => root.render(scene(ID, CONFESSION, 2)))
    await settle()
    await settle()
    expect($('[data-illustration]')?.dataset.illustration).toBe('loading')
    expect($('[data-art-stage]')?.dataset.artStage).toBe('loading')
    expect($('[data-stage-bust]')).toBeNull()
    expect(seen).not.toHaveBeenCalled()
    await act(async () => release(''))
    await settle()
    expect($('[data-illustration]')?.dataset.illustration).toBe('confession')
  })
  it('an Uma without illustrations, a moment she has no scene for, or a picture that can’t load: her bust, as before', async () => {
    const meeting = illustrate('meeting', [{ say: OTHER, line: 'Hello.' }] as Step[])
    await act(async () => root.render(scene(OTHER, meeting, 1)))
    await settle()
    await settle()
    expect($('[data-illustration]')).toBeNull()
    expect($('[data-stage-bust]')).not.toBeNull()
    const beach = illustrate('shore', [{ say: ID, line: 'Sun!' }] as Step[])
    await act(async () => root.render(scene(ID, beach, 1)))
    await settle()
    await settle()
    expect($('[data-stage-bust]')).not.toBeNull()
    setIllustrationSource({ illustrationsOf: async () => ILLS, art: { artUrl: async () => { throw new Error('offline') }, hold: () => () => undefined } })
    await act(async () => root.render(scene(ID, CONFESSION, 2)))
    await settle()
    await settle()
    await settle()
    expect($('[data-stage-bust]')).not.toBeNull()
    expect(seen).not.toHaveBeenCalled()
  })
})

describe('the illustrations’ source', () => {
  it('reads her manifest from master data’s family, checked against the release; nothing is fetched for one it doesn’t hold', async () => {
    const data: MasterData = syntheticMasterData()
    const { manifest, objects } = await buildMemoryRelease(data, { illustrations: [ILLS] })
    const client = createReleaseClient({ source: createMemorySource(objects) })
    const art = await client.art(manifest)
    expect(art?.illustrations?.[ID]).toBeTruthy()
    fixture.view = { manifest, art }
    fixture.release.mockResolvedValue(client)
    fixture.release.mockClear()
    setIllustrationSource(null)
    await act(async () => root.render(scene(ID, CONFESSION, 2)))
    await settle()
    await settle()
    await settle()
    expect($('[data-illustration]')?.dataset.illustration).toBe('confession')
    expect(fixture.release).toHaveBeenCalledTimes(1)
    fixture.release.mockClear()
    const meeting = illustrate('meeting', [{ say: OTHER, line: 'Hello.' }] as Step[])
    await act(async () => root.render(scene(OTHER, meeting, 1)))
    expect($('[data-illustration]')?.dataset.illustration).toBe('leaving')
    await act(async () => { await new Promise((r) => setTimeout(r, ART_FADE_MS + 20)) })
    expect($('[data-illustration]')).toBeNull()
    expect($('[data-stage-bust]')).not.toBeNull()
    expect(fixture.release).not.toHaveBeenCalled()
  })
})
