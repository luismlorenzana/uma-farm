// The homestead (romance spec RM41's mockup), `?sheet=homestead` from a house's tap on the
// map (`&house=<n>` marks its row): one row a house, its mark, its name, its rooms (a face ▣ or a free room ▢) and its count;
// **Extend · 4,000g** on a built house; the next lot with a name field (grey "Rose Cottage") and **Build · 8,000g**, or
// "Need 300g more", or "Opens with your first wedding"; the lots after it in one line; "Needs a room: …"; moves (tap a face,
// then a free room or another face to swap); "Shared houses: +10 bond a night a pair."; and the furniture set from 5
// married, a piece a row and the house it stands in. "Married n/N" in the header. Loaded on demand, the romance build only.
import { houseNameIssue, HOUSE_NAME_MAX, type SaveV4 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { useLeave, withParam } from '@luismlorenzana/uma-kit/shell'
import { Button, HelpButton, Sheet, UiMark } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { MasterGate } from '../master/MasterGate'
import { useLoopSave } from '../save/game'
import { useStory } from '../story/story'
import { buildHouseNamed, extendHouseOnce, moveSpouseTo, placePiece, swapSpouseRooms } from './homestead-actions'
import { furnitureRows, HOMESTEAD_TEXT, homesteadView, priceWords, type HouseRow } from './homestead-view'

const ROSE = '#c2385e'

/** `?sheet=homestead`: the homestead over the farm. On v3 it closes itself. */
export default function HomesteadSheet() {
  const save = useLoopSave()
  const [params] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const close = () => {
    const at = new URL(withParam(location, 'sheet', null), 'http://farm')
    at.searchParams.delete('house')
    leave(`${at.pathname}${at.search}`)
  }
  const shut = !!save && save.version !== 4
  useEffect(() => {
    if (shut) close()
  }, [shut]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!save || save.version !== 4) return null
  const focus = Number(params.get('house'))
  return <Homestead save={save} focus={Number.isInteger(focus) ? focus : null} onClose={close} />
}

/** A face or a free room, picked to move: a resident by her id, or a free room by its house. */
type Picked = { id: string; house: number } | null

function Homestead({ save, focus, onClose }: { save: SaveV4; focus: number | null; onClose: () => void }) {
  const pack = useStory()
  const [picked, setPicked] = useState<Picked>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const act = async (run: () => Promise<void>, done: string | null = null) => {
    if (busy) return
    setBusy(true)
    setNote(null)
    try {
      await run()
      setNote(done)
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'That didn’t work. Try again.')
    } finally {
      setBusy(false)
      setPicked(null)
    }
  }
  const tapRoom = (house: number, id: string | null) => {
    if (picked === null) {
      if (id !== null) setPicked({ id, house })
      return
    }
    if (id === picked.id) return setPicked(null)
    if (house === picked.house) return setPicked(id === null ? null : { id, house })
    void act(() => (id === null ? moveSpouseTo(picked.id, house) : swapSpouseRooms(picked.id, id)))
  }
  return (
    <MasterGate skeleton={null}>
      {(master) => {
        const nameOf = (id: string) => master.album.get(id)?.name ?? 'An Uma'
        const view = homesteadView(save, nameOf)
        const cast = pack?.cast.umas.length ?? null
        return (
          <Sheet
            open
            onClose={onClose}
            title={HOMESTEAD_TEXT.title}
            label="The homestead"
            footer={<p className="min-h-5 text-center text-[13px] text-ink-soft" role={note ? 'status' : undefined} data-homestead-note>{picked ? `Move ${nameOf(picked.id)}: tap a free room, or a face to swap.` : note ?? HOMESTEAD_TEXT.move}</p>}
          >
            <div className="space-y-3 pb-2" data-homestead>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-ink-soft tabular-nums" data-married={view.married}>Married {view.married}{cast !== null ? `/${cast}` : ''} · {view.rooms.taken}/{view.rooms.rooms} rooms</span>
                <HelpButton title={HOMESTEAD_TEXT.title} label="How the homestead works">
                  {HOMESTEAD_TEXT.help.map((line) => <p key={line}>{line}</p>)}
                </HelpButton>
              </div>
              <ul className="divide-y divide-hairline rounded-md border border-hairline" aria-label="The houses">
                {view.houses.map((row) => (
                  <li key={row.n} data-house={row.n} data-focus={focus === row.n || undefined} className={focus === row.n ? 'bg-sunken/60' : undefined}>
                    <HouseLine row={row} nameOf={nameOf} picked={picked} busy={busy} onRoom={tapRoom}
                      onExtend={() => void act(() => extendHouseOnce(row.n), `${row.name} has four rooms now.`)} />
                  </li>
                ))}
                {view.lot && <li data-lot={view.lot.n} className={focus === view.lot.n ? 'bg-sunken/60' : undefined}><LotLine key={view.lot.n} lot={view.lot} busy={busy} onBuild={(name) => void act(() => buildHouseNamed(name), 'Built. It stands already.')} /></li>}
                {view.later && <li className="flex min-h-11 items-center gap-2 px-3 text-[13px] text-ink-faint" data-later><UiMark mark="homestead/house" fallback={<span aria-hidden>⌂</span>} />{view.later}</li>}
              </ul>
              <p className="text-[14px]" data-needs>{view.needs}</p>
              <p className="text-[13px] text-ink-soft">{HOMESTEAD_TEXT.shared}</p>
              {save.homestead.furniture.length > 0 && <Furniture save={save} busy={busy} onPlace={(piece, house) => void act(() => placePiece(piece, house))} />}
            </div>
          </Sheet>
        )
      }}
    </MasterGate>
  )
}

/** One house: its mark and name, its rooms as faces and free rooms (44 pt each), its count, and Extend. */
function HouseLine({ row, nameOf, picked, busy, onRoom, onExtend }: {
  row: HouseRow; nameOf: (id: string) => string; picked: Picked; busy: boolean; onRoom: (house: number, id: string | null) => void; onExtend: () => void
}) {
  return (
    <div className="space-y-1.5 px-3 py-2">
      <div className="flex items-center gap-2">
        <UiMark mark={row.yours ? 'homestead/farmhouse' : 'homestead/house'} fallback={<span aria-hidden>⌂</span>} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold" data-house-name>{row.name}</span>
        <span className="text-[13px] tabular-nums text-ink-soft" data-house-count>{row.count}{row.yours ? ' · yours' : ''}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {row.rooms.map((id, i) => {
          const on = picked !== null && id !== null && picked.id === id
          const target = picked !== null && picked.house !== row.n
          return (
            <button key={id ?? `free:${i}`} type="button" disabled={busy || (id === null && !target)} onClick={() => onRoom(row.n, id)}
              aria-label={id === null ? `A free room in ${row.name}` : `${nameOf(id)}, in ${row.name}`} aria-pressed={on}
              className={`grid size-11 place-items-center rounded-md border ${on ? 'border-[#c2385e] ring-2 ring-[#c2385e]' : id === null ? `border-dashed ${target ? 'border-[#c2385e]' : 'border-hairline-strong'}` : 'border-hairline'}`}
              data-room={id ?? 'free'}>
              {id === null ? <span aria-hidden className="text-[18px] text-ink-faint">▢</span> : <FaceTile outfitId={id} size={36} label={nameOf(id)} round />}
            </button>
          )
        })}
        {row.extend && (
          <button type="button" disabled={busy || row.extend.short > 0} onClick={onExtend}
            className="ml-auto min-h-11 rounded-sm border px-3 text-[13px] font-bold disabled:opacity-60" style={{ borderColor: ROSE, color: ROSE }} data-action="extend">
            {priceWords('Extend', row.extend.cost, row.extend.short)}
          </button>
        )}
      </div>
    </div>
  )
}

/** The next lot: a name field and Build, or what it waits for. */
function LotLine({ lot, busy, onBuild }: { lot: { n: number; cost: number; open: boolean; short: number }; busy: boolean; onBuild: (name: string) => void }) {
  const [name, setName] = useState('')
  const issue = houseNameIssue(name)
  const shown = name.length > 0 ? issue : null
  return (
    <form className="space-y-1.5 px-3 py-2" onSubmit={(e) => { e.preventDefault(); if (!issue && lot.open && lot.short === 0) onBuild(name) }}>
      <div className="flex items-center gap-2">
        <UiMark mark="homestead/house" fallback={<span aria-hidden>⌂</span>} />
        <span className="flex-1 text-[15px] font-semibold text-ink-soft">Lot {lot.n}</span>
        <span className="text-[18px] tracking-widest text-ink-faint" aria-hidden>▢▢</span>
      </div>
      {lot.open ? (
        <>
          <div className="flex items-center gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={HOMESTEAD_TEXT.placeholder} maxLength={40} autoComplete="off" autoCapitalize="words"
              spellCheck={false} aria-label={`House ${lot.n}'s name`} className="min-h-11 min-w-0 flex-1 rounded-md border border-hairline-strong bg-panel px-3 text-[15px] placeholder:text-ink-faint"
              data-house-field />
            <Button type="submit" disabled={busy || issue !== null || lot.short > 0} data-action="build">{priceWords('Build', lot.cost, lot.short)}</Button>
          </div>
          <p className={`min-h-4 text-[12px] ${shown ? 'text-danger' : 'text-ink-faint'}`} data-house-why>{shown ?? `Up to ${HOUSE_NAME_MAX} letters. It stands at once.`}</p>
        </>
      ) : <p className="text-[13px] text-ink-faint" data-lot-locked>{HOMESTEAD_TEXT.firstWedding} · {priceWords('Build', lot.cost, 0)}</p>}
    </form>
  )
}

/** The furniture set: a piece a row and where it stands; a tap cycles it through the houses with no piece. */
function Furniture({ save, busy, onPlace }: { save: SaveV4; busy: boolean; onPlace: (piece: number, house: number | null) => void }) {
  const rows = furnitureRows(save)
  const next = (piece: number, house: number | null): number | null => {
    const taken = new Set(save.homestead.furniture.filter((h, i) => h !== null && i !== piece))
    const order = [...save.homestead.houses.keys()].filter((h) => !taken.has(h))
    const at = house === null ? -1 : order.indexOf(house)
    return order[at + 1] ?? null
  }
  return (
    <section className="space-y-1" aria-label="The furniture set">
      <h3 className="text-micro">Furniture</h3>
      <ul className="divide-y divide-hairline rounded-md border border-hairline">
        {rows.map((row) => (
          <li key={row.piece}>
            <button type="button" disabled={busy} onClick={() => onPlace(row.piece, next(row.piece, row.house))} className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-[14px]" data-piece={row.piece}>
              <span className="min-w-0 flex-1 truncate">{row.name}</span>
              <span className="text-[13px] text-ink-soft">{row.where} ›</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[12px] text-ink-faint">One piece a house. Tap to move it on.</p>
    </section>
  )
}
