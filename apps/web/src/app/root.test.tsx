// The way onto a new build (F3's update prompt; F24's go-live): the kit's Update ready · Restart sits beside the
// boot gates, not inside them, so an old build that stops at a newer save (the Wilds' build at the owner's v3, D30 e;
// the M4 build at the romance core's v4, F46 decision 2) still offers the new build, and Restart activates it. The gate
// says why it stopped and asks the browser for the new build at once. The same holds over a
// running farm. The boot is a stub.
import { act } from 'react'
import { createRoot, type Root as ReactRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const game = vi.hoisted(() => ({ boot: vi.fn<(uid: string) => Promise<void>>() }))
vi.mock('../save/game', async (importOriginal) => ({
  NEWER_SAVE_WORDS: (await importOriginal<typeof import('../save/game')>()).NEWER_SAVE_WORDS, boot: game.boot, startSyncTriggers: () => () => undefined,
}))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(),
  useAuth: () => ({ ready: true, authRequired: true, user: { uid: 'owner', name: 'Owner', email: null }, error: null, signIn: async () => undefined, signOut: async () => undefined, idToken: async () => null }),
}))

const { Root } = await import('./Root')
const { NEWER_SAVE_WORDS } = await import('../save/game')
const { appUpdateLifecycle } = await import('@luismlorenzana/uma-kit/places')

let host: HTMLDivElement
let root: ReactRoot
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const text = () => document.body.textContent ?? ''
const restart = () => [...document.body.querySelectorAll('button')].find((b) => b.textContent === 'Restart')

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

const renderRoot = () => act(async () => root.render(
  <MemoryRouter><Routes><Route path="*" element={<Root />}><Route path="*" element={<p data-app>The farm</p>} /></Route></Routes></MemoryRouter>,
))
/** A new build waiting, as `watchAppUpdates(registerSW)` reports it to the page's lifecycle (main.tsx); `activate` is the
 * service worker's skip-waiting and reload. */
const newBuildWaiting = (activate: () => Promise<void>) => act(() => appUpdateLifecycle.workerWaiting(activate))

describe('the update prompt (D11, D30 e)', () => {
  it('offers it over a running farm', async () => {
    game.boot.mockResolvedValue(undefined)
    await renderRoot()
    await settle()
    expect(document.querySelector('[data-app]')).not.toBeNull()
    newBuildWaiting(vi.fn(async () => undefined))
    expect(text()).toContain('Update ready')
    expect(restart()).toBeDefined()
  })

  it('says the save is newer when the boot stops at one, offers the new build, and Restart takes it', async () => {
    const update = vi.fn(async () => undefined)
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: { getRegistration: async () => ({ update }) } })
    game.boot.mockRejectedValue(new Error(NEWER_SAVE_WORDS))
    await renderRoot()
    await settle()
    expect(text()).toContain('This save is from a newer version of the farm.')
    expect(text()).not.toContain("couldn't open")
    expect(document.querySelector('[data-app]')).toBeNull()
    expect(update).toHaveBeenCalled()
    const activate = vi.fn(async () => undefined)
    newBuildWaiting(activate)
    expect(text()).toContain('Update ready')
    await act(async () => restart()!.click())
    expect(activate).toHaveBeenCalledOnce()
  })

  it("keeps the kit's words for any other failure, and the newer words once Try again meets the newer save", async () => {
    game.boot.mockRejectedValueOnce(new Error('offline')).mockRejectedValue(new Error(NEWER_SAVE_WORDS))
    await renderRoot()
    await settle()
    expect(text()).toContain("The game couldn't open on this phone.")
    await act(async () => [...document.body.querySelectorAll('button')].find((b) => b.textContent === 'Try again')!.click())
    await settle()
    expect(text()).toContain(NEWER_SAVE_WORDS)
    expect(text()).toContain('Try again')
  })
})
