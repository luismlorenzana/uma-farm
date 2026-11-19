import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixture = vi.hoisted(() => ({ view: null as unknown, portraits: vi.fn(async () => null), scenes: vi.fn(async () => null) }))
vi.mock('../master/master', () => ({ masterReady: async () => fixture.view, useMaster: () => ({ status: 'ready', view: fixture.view }) }))
vi.mock('../content/client', () => ({ CONTENT: { release: async () => ({ dialoguePortraits: fixture.portraits, illustrations: fixture.scenes }), artUrl: async (path: string) => path, hold: () => () => undefined } }))

const { usePortraitsOf, setPortraitSource } = await import('./portraits')
const { useIllustrationsOf, setIllustrationSource } = await import('./illustrations')
let root: Root, host: HTMLDivElement
function Probe({ id }: { id: string }) {
  const portraits = usePortraitsOf(id), scenes = useIllustrationsOf(id)
  return <span>{String(Boolean(portraits || scenes))}</span>
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  fixture.portraits.mockClear(); fixture.scenes.mockClear()
  setPortraitSource(null); setIllustrationSource(null)
  fixture.view = { manifest: { version: 'invented' }, outfits: new Map([['900102', { characterId: '9001' }]]), art: {
    dialoguePortraits: { '9001': 'original-portraits', 'outfit:900102': 'sister-portraits' },
    illustrations: { '9001': 'original-scenes', 'outfit:900102': 'sister-scenes' },
  } }
  host = document.createElement('div'); document.body.append(host); root = createRoot(host)
})
afterEach(async () => { await act(async () => root.unmount()); host.remove(); setPortraitSource(null); setIllustrationSource(null); vi.unstubAllGlobals() })

describe('the release art readers', () => {
  it('requests the sister outfit for portraits and illustrations', async () => {
    await act(async () => root.render(<Probe id="s900102" />))
    const view = fixture.view as { manifest: unknown; art: unknown }
    expect(fixture.portraits).toHaveBeenCalledWith(view.manifest, view.art, 9001, 900102)
    expect(fixture.scenes).toHaveBeenCalledWith(view.manifest, view.art, 9001, 900102)
  })
  it('retains original character selections', async () => {
    await act(async () => root.render(<Probe id="9001" />))
    const view = fixture.view as { manifest: unknown; art: unknown }
    expect(fixture.portraits).toHaveBeenCalledWith(view.manifest, view.art, 9001, undefined)
    expect(fixture.scenes).toHaveBeenCalledWith(view.manifest, view.art, 9001, undefined)
  })
  it('does not substitute the original when the sister art is missing', async () => {
    const view = fixture.view as { art: { dialoguePortraits: Record<string, string>; illustrations: Record<string, string> } }
    delete view.art.dialoguePortraits['outfit:900102']; delete view.art.illustrations['outfit:900102']
    await act(async () => root.render(<Probe id="s900102" />))
    expect(fixture.portraits).not.toHaveBeenCalled()
    expect(fixture.scenes).not.toHaveBeenCalled()
    expect(host.textContent).toBe('false')
  })
})