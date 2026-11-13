// The owner's first open of the live loop: production holds one save, a v2 made with F4 that has
// no Umas, no items and no jobs. The app migrates it to v3 without moving `updatedAt`, uploads it, and offers the start's
// three picks; then the opening scene plays once and the first tap is planting. Invented outfits (the album fixture);
// the server is an in-memory stand-in with the API's revision and version rules.
import 'fake-indexeddb/auto'
import { CAST, OPENING_SCENE, picksLeft, sceneDue, versionOf, type SaveEnvelope, type SaveV2, type SaveV3, type StoredSave } from '@farm/domain'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MasterView } from '../master/master'

const fixture = vi.hoisted(() => ({ view: null as MasterView | null }))
vi.mock('../master/master', async (importOriginal) => ({
  ...await importOriginal<typeof import('../master/master')>(),
  masterReady: vi.fn(async () => fixture.view), masterRoster: () => fixture.view?.roster ?? null,
  useMaster: () => ({ status: 'ready', view: fixture.view }), retryMaster: () => undefined,
}))
vi.mock('@luismlorenzana/uma-kit/auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('@luismlorenzana/uma-kit/auth')>(), useAuth: () => ({ user: { name: 'Owner' } }),
}))

const server: { envelope: SaveEnvelope; puts: { base: number; version: number; updatedAt: string }[] } = { envelope: { revision: 0, save: null }, puts: [] }
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client')
  return {
    ...actual,
    saveApi: {
      load: vi.fn(async () => structuredClone(server.envelope)),
      put: vi.fn(async (baseRevision: number, save: StoredSave) => {
        if (baseRevision !== server.envelope.revision || save.version < versionOf(server.envelope.save)) {
          throw new actual.ApiError('/api/save', 409, { current: structuredClone(server.envelope) })
        }
        server.puts.push({ base: baseRevision, version: save.version, updatedAt: save.account.updatedAt })
        server.envelope = { revision: baseRevision + 1, save: structuredClone(save) }
        return structuredClone(server.envelope)
      }),
    },
  }
})

const { albumFixture } = await import('../album/testing')
const { boot, resetGame, syncNow, useGame } = await import('../save/game')
const { db, readSaveRow } = await import('../save/db')
const { Shell } = await import('../shell/Shell')

/** Breezy, steady, bold, gritty and clever stats for the first five; the sixth the synthetic one's. */
fixture.view = (await albumFixture(undefined, [
  { star5: [140, 100, 100, 100, 100] }, { star5: [100, 140, 100, 100, 100] }, { star5: [100, 100, 140, 100, 100] },
  { star5: [100, 100, 100, 140, 100] }, { star5: [100, 100, 100, 100, 140] },
])).view

/** The owner's production save as the live one is: v2 (the Wilds'), nobody worked, nothing held. */
const OWNER: SaveV2 = {
  version: 2, account: { uid: 'owner', createdAt: '2026-11-08T09:12:44.000Z', updatedAt: '2026-11-08T21:40:03.512Z' }, umas: {}, items: {}, buildings: {}, work: {},
}
const save = (): SaveV3 => useGame.getState().save as SaveV3

let host: HTMLDivElement
let root: Root
let path = ''
function Where() {
  const location = useLocation()
  path = location.pathname
  return null
}
async function renderShell(at = '/') {
  await act(async () => root.render(
    <MemoryRouter initialEntries={[at]}><Routes><Route element={<Shell />}><Route path="*" element={<Where />} /></Route></Routes></MemoryRouter>,
  ))
  await settle()
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 0)) })
/** Waits for a lazy overlay (the start's sheet, the scene player) to land. */
const find = async (selector: string): Promise<HTMLElement> => {
  for (let i = 0; i < 100 && !document.body.querySelector(selector); i++) await act(async () => { await new Promise((r) => setTimeout(r, 10)) })
  expect(document.body.querySelector(selector)).not.toBeNull()
  return document.body.querySelector(selector) as HTMLElement
}
const $ = (selector: string) => document.body.querySelector(selector) as HTMLElement | null
const $$ = (selector: string) => [...document.body.querySelectorAll(selector)] as HTMLElement[]
const click = async (el: HTMLElement | null | undefined) => {
  expect(el).toBeTruthy()
  await act(async () => el!.click())
  await settle()
}

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  resetGame()
  server.envelope = { revision: 12, save: structuredClone(OWNER) }
  server.puts = []
  await db.save.clear()
  await db.safety.clear()
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

describe("the owner's first open", () => {
  it('migrates the v2 on the phone to v3, uploads it with updatedAt unchanged, and offers the three picks', async () => {
    await db.save.put({ id: 'main', uid: 'owner', revision: 12, dirty: false, save: structuredClone(OWNER) })
    await boot('owner')
    expect(save()).toMatchObject({
      version: 3, account: OWNER.account, calendar: { day: 1 }, gold: 500, roster: {}, items: { 'seed-carrot': [9, 0, 0, 0, 0] }, work: {},
      dorm: { level: 1, home: [] }, farm: { chapter: 1, points: 0, goals: {} }, diary: { read: [], milestones: [] }, summary: null,
    })
    expect(picksLeft(save())).toBe(3)
    expect(sceneDue(save())).toBeNull()
    // The device holds the v3 at once, so a reload doesn't migrate again.
    expect((await readSaveRow('owner'))?.save).toEqual(save())
    await syncNow()
    // The first upload is the migration itself: v3, on the revision it read, its updatedAt where the v2 had it.
    expect(server.puts[0]).toEqual({ base: 12, version: 3, updatedAt: OWNER.account.updatedAt })
    expect(server.envelope).toMatchObject({ revision: 13, save: { version: 3, account: OWNER.account } })
    expect(useGame.getState()).toMatchObject({ dirty: false, revision: 13, sync: 'synced' })
    await renderShell()
    await find('[data-start]')
    expect($('[data-start-want]')?.textContent).toContain('Pick 3')
    expect($$('[data-card]')).toHaveLength(6)
    expect($('[data-scene]')).toBeNull()
  })

  it('does the same from the server alone, on a phone whose device save is gone', async () => {
    await boot('owner')
    expect(save()).toMatchObject({ version: 3, account: OWNER.account, roster: {} })
    await syncNow()
    expect(server.puts).toEqual([{ base: 12, version: 3, updatedAt: OWNER.account.updatedAt }])
  })

  it('plays the opening scene once after the picks, its roles filled, and the first tap is planting', async () => {
    await boot('owner')
    await renderShell()
    await find('[data-card]')
    for (const id of ['81001', '81003', '81005']) await click($(`[data-card="${id}"]`))
    await click($('[data-action="pick"]'))
    expect(Object.keys(save().roster).sort()).toEqual(['81001', '81003', '81005'])
    expect($('[data-start]')).toBeNull()
    await find('[data-scene="scene:1:open"] [data-beat]')
    expect($('[data-speaker]')).toBeNull() // the narrator opens it
    expect($('[data-line]')?.textContent).toBe(OPENING_SCENE.beats[0]!.line)
    await click($('[data-beat]'))
    expect($('[data-speaker]')?.textContent).toBe(CAST['hollis-pryor'].name)
    expect($('[data-bust="cast"] [data-cast="hollis-pryor"]')?.textContent).toBe('H')
    const heard: string[] = []
    while ($('[data-beat]')) {
      if ($('[data-bust="uma"]')) heard.push($('[data-line]')!.textContent!)
      await click($('[data-beat]'))
    }
    // The first hands, in the order they joined (by id on the same day), each saying her temperament's hello.
    expect(heard).toEqual(['“Hi, I’m Aster! Point me at the work and I’m off.”', '“I’m Cinder, and this farm is about to wake up.”', '“Hello, I’m Ember. I’ve counted the plots already: nine.”'])
    expect($$('[data-chapter-card="1"] li')).toHaveLength(6)
    await click($('[data-action="plant"]'))
    expect(path).toBe('/fields')
    expect(save().diary.read).toEqual(['scene:1:open'])
    expect($('[data-scene]')).toBeNull()
    // Once: a reload plays nothing.
    await act(async () => {
      resetGame()
      await boot('owner')
    })
    await renderShell()
    expect($('[data-scene]')).toBeNull()
  })

  it('skips the scene for good, with or without master data', async () => {
    await boot('owner')
    useGame.setState({ save: { ...save(), roster: Object.fromEntries(['81002', '81004', '81006'].map((id) => [id, { joined: 1, ranks: save().roster[id]?.ranks ?? emptyRanks(), affinity: 0, wellFed: 0 }])), dorm: { level: 1, home: ['81002', '81004', '81006'], swaps: [] } } })
    await renderShell()
    await find('[data-scene="scene:1:open"]')
    await click($('[data-action="skip"]'))
    expect(save().diary.read).toEqual(['scene:1:open'])
    expect($('[data-scene]')).toBeNull()
  })
})

function emptyRanks(): SaveV3['roster'][string]['ranks'] {
  const r = { points: 0, rank: 0 as const, challenge: 0 }
  return { farming: r, ranch: r, mining: r, fishing: r, foraging: r, cooking: r, serving: r, forging: r, expeditions: r }
}
