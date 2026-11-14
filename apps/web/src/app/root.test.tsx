// Getting in: a save from before v4 stops at the start-over card (the kit's first-launch step), whose button starts the
// new farm and opens the app; any other boot opens the app at once. And the way onto a new build (the update prompt):
// the kit's Update ready · Restart sits beside the boot gates, not inside them, so a build that stops at a newer save
// still offers the new build, and Restart activates it. The gate says why it stopped and asks the browser for the new
// build at once. The same holds over a running farm. The boot and the start-over are stubs.
import { act } from 'react'
import { createRoot, type Root as ReactRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const game = vi.hoisted(() => ({ boot: vi.fn<(uid: string) => Promise<{ startOver: boolean }>>(), startOver: vi.fn<() => Promise<void>>() }))
vi.mock('../save/game', async (importOriginal) => ({
  NEWER_SAVE_WORDS: (await importOriginal<typeof import('../save/game')>()).NEWER_SAVE_WORDS, boot: game.boot, startOver: game.startOver,
  startSyncTriggers: () => () => undefined,
}))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(),
  useAuth: () => ({ ready: true, authRequired: true, user: { uid: 'owner', name: 'Owner', email: null }, error: null, signIn: async () => undefined, signOut: async () => undefined, idToken: async () => null }),
}))

const { Root } = await import('./Root')
const { NEWER_SAVE_WORDS } = await import('../save/game')
const { START_OVER_WORDS } = await import('./StartOverCard')
const { appUpdateLifecycle } = await import('@luismlorenzana/uma-kit/places')

let host: HTMLDivElement
let root: ReactRoot
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
const text = () => document.body.textContent ?? ''
const button = (words: string) => [...document.body.querySelectorAll('button')].find((b) => b.textContent === words)
const restart = () => button('Restart')

beforeEach(() => {
  game.startOver.mockClear()
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

describe('the start-over card', () => {
  it('stops a save from before v4 at the card; its button starts the new farm and opens the app', async () => {
    game.boot.mockResolvedValue({ startOver: true })
    let started: () => void = () => undefined
    game.startOver.mockReturnValue(new Promise<void>((resolve) => { started = resolve }))
    await renderRoot()
    await settle()
    expect(text()).toContain(START_OVER_WORDS.title)
    expect(text()).toContain('Your farm starts over')
    expect(text()).toContain('This version of the game begins a new farm on day 1.')
    expect(document.querySelector('[data-app]')).toBeNull()
    await act(async () => button('Start the new farm')!.click())
    expect(game.startOver).toHaveBeenCalledOnce()
    expect(document.querySelector('[data-app]')).toBeNull()
    expect(button('Start the new farm')!.disabled).toBe(true)
    await act(async () => started())
    await settle()
    expect(document.querySelector('[data-app]')).not.toBeNull()
    expect(document.querySelector('[data-start-over]')).toBeNull()
  })

  it('says why when the new farm can’t start, and offers the button again', async () => {
    game.boot.mockResolvedValue({ startOver: true })
    game.startOver.mockRejectedValue(new Error('This device couldn’t keep a copy of its save. Try again.'))
    await renderRoot()
    await settle()
    await act(async () => button('Start the new farm')!.click())
    await settle()
    expect(text()).toContain('couldn’t keep a copy')
    expect(button('Start the new farm')!.disabled).toBe(false)
    expect(document.querySelector('[data-app]')).toBeNull()
  })

  it('opens the app at once for any other boot', async () => {
    game.boot.mockResolvedValue({ startOver: false })
    await renderRoot()
    await settle()
    expect(document.querySelector('[data-app]')).not.toBeNull()
    expect(document.querySelector('[data-start-over]')).toBeNull()
  })
})

describe('the update prompt', () => {
  it('offers it over a running farm', async () => {
    game.boot.mockResolvedValue({ startOver: false })
    await renderRoot()
    await settle()
    expect(document.querySelector('[data-app]')).not.toBeNull()
    newBuildWaiting(vi.fn(async () => undefined))
    expect(text()).toContain('Update ready')
    expect(restart()).toBeDefined()
    // Clear of the side safe areas too, where a phone held sideways has its notch and home bar.
    expect(document.querySelector('[data-clear-sides]')).not.toBeNull()
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
