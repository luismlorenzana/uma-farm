// The start's sheet (F23 decisions 1, 2 and 11; core spec CS2): the first tap of the game. While the roster holds fewer
// than three, six cards cover the farm, two columns of three: each her face with her favourite line's mark, her name and
// outfit's title (master data) and her three day-1 talents (farming, foraging, fishing). Tap to choose, **Pick 3** to start, and one
// free **Redraw** for six more. The farm's own cards, not uma-kit's picker: six need no filters. Loaded on demand.
import { ACTIVITY_NAMES, favouriteActivity, picksLeft, redrawsLeft, START_NEEDS, startSheet, TALENT_GRADES, type Activity, type SaveV3 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { Button, HelpButton } from '@luismlorenzana/uma-kit/ui'
import { useMemo, useState } from 'react'
import { ItemIcon } from '../items/ItemIcon'
import { MasterGate } from '../master/MasterGate'
import type { MasterView } from '../master/master'
import { useLoopSave } from '../save/game'
import { pickFirstHands, redrawFirstHands } from './actions'
import { talentsFor } from './talents'
import { FavouriteMark, TalentChip } from './UmaMarks'

/** Each need's mark: its line's first raw good, as on the faces. */
const NEED_ICON: Readonly<Partial<Record<Activity, string>>> = { farming: 'carrot', foraging: 'pine-log', fishing: 'carp' }
const errorWords = (err: unknown): string => (err instanceof Error ? err.message : 'That didn’t work. Try again.')

export default function StartPicks() {
  const save = useLoopSave()
  if (!save || save.version !== 3 || picksLeft(save) === 0) return null
  return (
    <div className="pt-safe pb-safe fixed inset-0 z-[60] flex flex-col bg-page" data-start role="dialog" aria-modal="true" aria-label="Your first hands">
      <MasterGate>{(master) => <Cards save={save} master={master} />}</MasterGate>
    </div>
  )
}

function Cards({ save, master }: { save: SaveV3; master: MasterView }) {
  const release = useMemo(() => master.roster.map((o) => o.outfitId), [master])
  const talentOf = talentsFor(master)
  const sheet = useMemo(() => startSheet(save, release, talentOf), [save, release, talentOf])
  const want = Math.min(picksLeft(save), sheet.length)
  const [chosen, setChosen] = useState<string[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lines = useMemo(() => new Map(master.roster.map((o) => [o.outfitId, favouriteActivity(o)])), [master])
  const toggle = (id: string) => setChosen((now) => (now.includes(id) ? now.filter((c) => c !== id) : now.length < want ? [...now, id] : now))
  const run = (action: () => Promise<unknown>, after?: () => void) => {
    setPending(true)
    setError(null)
    action().then(() => after?.(), (err: unknown) => setError(errorWords(err))).finally(() => setPending(false))
  }
  const left = redrawsLeft(save)
  return (
    <>
      <header className="flex items-start justify-between gap-2 px-4 pt-4">
        <div>
          <h1 className="font-display text-[22px] font-bold">Your first hands</h1>
          <p className="text-[14px] text-ink-soft" data-start-want={want}>Pick {want} to start the farm{chosen.length > 0 ? ` · ${chosen.length} chosen` : ''}</p>
        </div>
        <HelpButton title="Your first hands" label="About the first picks">
          <p>Each card shows her talents, G to S, in the three things day 1 has: farming the Fields, foraging the Woods and fishing the Pond. The sheet always holds a C or better in each.</p>
          <p>The mark on her face is her favourite line, where she ranks up a little faster. She can work anywhere.</p>
          <p>Not the six you want? One free redraw shows six more. Everyone else can join later, at the Gate and with chapters.</p>
        </HelpButton>
      </header>
      <ul className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto px-4 py-3" data-start-sheet>
        {sheet.map((id) => {
          const name = master.album.get(id)?.name ?? 'Uma'
          const title = master.album.get(id)?.title ?? null
          const picked = chosen.includes(id)
          const favourite = lines.get(id) ?? null
          return (
            <li key={id}>
              <button type="button" onClick={() => toggle(id)} aria-pressed={picked} data-card={id}
                aria-label={`${name}: ${START_NEEDS.map((a) => `${ACTIVITY_NAMES[a]} ${TALENT_GRADES[talentOf(id, a)]}`).join(', ')}`}
                className={`flex w-full flex-col items-center gap-1 rounded-md border bg-panel p-2 text-center shadow-1 ${picked ? 'border-accent ring-2 ring-accent' : 'border-hairline'}`}>
                <FaceTile outfitId={id} size={84} label={name} selected={picked}
                  badges={{ ...(favourite ? { topLeft: <FavouriteMark activity={favourite} /> } : {}), ...(picked ? { topRight: <span className="grid size-5 place-items-center rounded-full bg-accent text-[12px] font-bold text-accent-ink">✓</span> } : {}) }} />
                <span className="w-full truncate text-[14px] font-semibold">{name}</span>
                {title && <span className="-mt-1 w-full truncate text-[11px] text-ink-faint" data-card-title>{title}</span>}
                <span className="flex items-center justify-center gap-1.5">
                  {START_NEEDS.map((a) => (
                    <span key={a} className="flex items-center gap-0.5" data-need={a} data-grade={TALENT_GRADES[talentOf(id, a)]}>
                      <ItemIcon id={NEED_ICON[a]!} size={16} label={ACTIVITY_NAMES[a]} />
                      <TalentChip step={talentOf(id, a)} label={`${ACTIVITY_NAMES[a]} talent ${TALENT_GRADES[talentOf(id, a)]}`} size={18} />
                    </span>
                  ))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <footer className="space-y-1 border-t border-hairline bg-panel px-4 pt-3 pb-3">
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" disabled={pending || left === 0} onClick={() => { setChosen([]); run(redrawFirstHands) }} data-action="redraw">
            {left > 0 ? `Redraw (${left} left)` : 'No redraws left'}
          </Button>
          <Button disabled={pending || chosen.length !== want} onClick={() => run(() => pickFirstHands(chosen))} data-action="pick">Pick {want}</Button>
        </div>
      </footer>
    </>
  )
}
