import { Avatar } from '../dialogue/Avatar'

type Face = { id: string; faint?: boolean }

export function CalendarFaces({ shown, more, nameOf, focus }: {
  shown: readonly Face[]; more: number; nameOf: (id: string) => string; focus?: string | null
}) {
  if (shown.length === 0) return null
  return <span aria-hidden className="mt-auto grid w-full max-w-[64px] shrink-0 grid-cols-3 gap-0.5" data-cell-faces>
    {shown.map(({ id, faint }) => <span key={id}
      className={'rounded-avatar min-w-0 ' + (id === focus ? 'ring-1 ring-accent' : '') + (faint ? ' opacity-45' : '')}
      data-cell-face={id} data-faint={faint || undefined}>
      <Avatar id={id} size={20} label={nameOf(id)} />
    </span>)}
    {more > 0 && <span className="rounded-avatar grid aspect-square min-w-0 place-items-center bg-sunken text-[9px] font-bold leading-none text-ink ring-1 ring-panel" data-more>+{more}</span>}
  </span>
}
