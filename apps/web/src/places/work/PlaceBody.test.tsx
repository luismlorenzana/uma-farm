// A place's page as rendered (F5): uma-kit's four slot rows over the save, a running job's row, the header's line and
// help, no speed-up control (no Speed Tickets), and the quick look. Invented outfits and a fake clock.
import { newSaveV2, rosterContext, startJob, type Save } from '@farm/domain'
import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { albumFixture, NOW } from '../../album/testing'
import { FarmWorkProvider } from './FarmWork'
import { PlaceBody, PlacePeek } from './PlaceBody'

/** Renders on the client (the kit's sheets portal to the body) and returns the page's HTML. */
async function html(node: ReactNode): Promise<string> {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  await act(async () => root.render(node))
  const out = host.innerHTML
  await act(async () => root.unmount())
  host.remove()
  return out
}
afterEach(() => vi.unstubAllGlobals())

async function render(placeId: string, peek = false) {
  const { view } = await albumFixture()
  let save: Save = { ...newSaveV2('u1', NOW), items: { 'copper-ore': 2 } }
  save = startJob(save, 'mine', 0, { outfitId: '81001' }, 'copper-ore', 2, NOW, rosterContext(view.roster))
  const now = Date.parse(NOW) + 5 * 60_000
  return html(
    <MemoryRouter initialEntries={[`/wilds/${placeId}`]}>
      <FarmWorkProvider view={view} save={save} now={now}>
        {peek ? <PlacePeek view={view} placeId={placeId} /> : <PlaceBody view={view} save={save} now={now} placeId={placeId} />}
      </FarmWorkProvider>
    </MemoryRouter>,
  )
}

describe('a place\'s page', () => {
  it('shows four slot rows, the running job, the header\'s line and help, and no speed-up', async () => {
    const page = await render('mine')
    expect(page).toContain('Mining · 4 slots · ×1.25')
    expect(page.match(/data-slot-card="running"/g)).toHaveLength(1)
    expect(page).toContain('data-outfit="81001"')
    expect(page).toContain('How the Mine works')
    expect(page).not.toContain('data-action="speed"')
    expect(page).not.toContain('data-open-shop')
  })

  it('shows an empty place\'s four free slots, and the quick look with its line', async () => {
    const bench = await render('den-workbench')
    expect(bench).toContain('Stonecutting · 4 slots · ×1.25')
    expect(bench).not.toContain('data-slot-card="running"')
    const peek = await render('weapon-forge', true)
    expect(peek).toContain('data-place-peek="weapon-forge"')
    expect(peek).toContain('Arms Gem G1–G10')
  })

  it('opens a place with no Uma of its trade to everyone', async () => {
    const { view } = await albumFixture([['front'], ['pace']])
    const page = await html(
      <MemoryRouter><FarmWorkProvider view={view} save={newSaveV2('u1', NOW)} now={Date.parse(NOW)}>
        <PlaceBody view={view} save={newSaveV2('u1', NOW)} now={Date.parse(NOW)} placeId="lapidary" />
      </FarmWorkProvider></MemoryRouter>,
    )
    expect(page).toContain('Open shop: anyone works here')
  })
})
