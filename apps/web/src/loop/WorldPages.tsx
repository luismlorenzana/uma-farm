// The Diary's world pages, from the pack's `world.json`: **The farm** (its name, the town and the region it's in, and its
// history) and **Town notes** (the short pieces of the world you've found, in the pack's order; each a tap to read it,
// `?note=<id>` opening one, as the morning's line does). Each shows only when the world writes it, so a pack with no
// `world.json` reads as before. The notes unlock at a talk, a visit or the night (`town/notes.ts`); the save keeps their
// ids. Loaded on demand with the Diary.
import { historyOf, knownNotes, townNotesOf, withFarmer, worldNamesOf, type FarmSave, type StoryPack } from '@farm/domain'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { useStory } from '../story/story'

/** The farm and Town notes, each when the world writes it; nothing before the pack loads. */
export default function WorldPages({ save }: { save: FarmSave }) {
  const pack = useStory()
  if (!pack) return null
  return (
    <>
      <TheFarm pack={pack} farmer={save.farmer.name} />
      <TownNotes save={save} pack={pack} />
    </>
  )
}

/** "The farm": its name (else "The farm"), where it is, and its history; none when the world names nothing. */
function TheFarm({ pack, farmer }: { pack: StoryPack; farmer: string }) {
  const names = worldNamesOf(pack)
  const history = historyOf(pack)
  if (history.length === 0 && names.farm === null && names.town === null && names.region === null) return null
  const where = [names.town, names.region].filter((n): n is string => n !== null).join(', ')
  return (
    <Panel label="The farm" data-the-farm>
      <h2 className="font-display text-[19px] font-bold" data-farm-name>{names.farm ?? 'The farm'}</h2>
      {where && <p className="text-[13px] text-ink-soft" data-farm-where>{where}</p>}
      {history.length > 0 && (
        <div className="space-y-2 pt-2 text-[15px]" data-farm-history>
          {history.map((line, i) => <p key={i}>{withFarmer(line, farmer)}</p>)}
        </div>
      )}
    </Panel>
  )
}

/** Town notes: the ones you know, each a tap to read; "None yet." until one unlocks; none when the world writes none. */
function TownNotes({ save, pack }: { save: FarmSave; pack: StoryPack }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const open = params.get('note')
  const all = townNotesOf(pack)
  const known = knownNotes(save, pack)
  // The morning's line opens its note: bring it into view.
  useEffect(() => {
    if (open) document.querySelector(`[data-note="${CSS.escape(open)}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open])
  if (all.length === 0) return null
  const toggle = (id: string) => navigate(withParam(location, 'note', open === id ? null : id), { replace: true, state: location.state })
  return (
    <Panel label="Town notes" data-town-notes>
      {known.length === 0
        ? <p className="py-2 text-ink-soft" data-notes-none>None yet.</p>
        : (
          <ul className="divide-y divide-hairline">
            {known.map((note) => {
              const shown = open === note.id
              return (
                <li key={note.id} data-note={note.id} data-open={shown || undefined}>
                  <button type="button" className="flex min-h-11 w-full items-center gap-2 text-left text-[15px] font-semibold" aria-expanded={shown} onClick={() => toggle(note.id)}>
                    <span className="min-w-0 flex-1">{note.title}</span>
                    <span aria-hidden className="text-ink-soft">{shown ? '−' : '+'}</span>
                  </button>
                  {shown && (
                    <div className="space-y-1.5 pb-3 text-[14px]" data-note-lines>
                      {note.lines.map((line, i) => <p key={i}>{withFarmer(line, save.farmer.name)}</p>)}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      <p className="pt-1 pb-1 text-[12px] text-ink-faint" data-notes-count>{known.length} of {all.length} found</p>
    </Panel>
  )
}
