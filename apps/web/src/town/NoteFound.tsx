// "Town note · ‹title› ›": the line a talk in town or Say hello at the Gate shows when it unlocks a Town note, a tap to
// read it in the Diary. The night's notes are the morning's. Light: the town's screen and the Gate's quick look show it.
import { townNoteOf, type StoryPack } from '@farm/domain'
import { Link } from 'react-router'

/** The notes just found, the first by its title ("+1 more" after it); nothing for none. */
export function NoteFound({ ids, pack }: { ids: readonly string[]; pack: Partial<Pick<StoryPack, 'world'>> | null }) {
  const first = ids[0]
  if (first === undefined) return null
  const title = townNoteOf(pack, first)?.title ?? 'A Town note'
  return (
    <p role="status" className="text-center text-[14px]" data-note-found={first}>
      <span className="rounded-full bg-success/15 px-1.5 text-[11px] font-semibold text-success">{ids.length > 1 ? 'Town notes' : 'Town note'}</span>{' '}
      <Link to={`/diary?note=${first}`} state={{ back: true }} className="font-semibold text-accent-strong underline">
        {title}{ids.length > 1 ? ` +${ids.length - 1} more` : ''} ›
      </Link>
    </p>
  )
}
