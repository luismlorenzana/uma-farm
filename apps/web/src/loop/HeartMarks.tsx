// The Hearts marks: the stage hearts, the bar's segments and the route's track are
// CSS shapes in the ladders' colours (coral, rose, gold), since they fill by points; the Ready and invitation chips carry
// F55's `hearts/ready` and `hearts/invitation` marks (uma-art 2.26.0, pinned from F49), a glyph without them. Loaded on
// demand with the Hearts tab.
import { UiMark } from '@luismlorenzana/uma-kit/ui'
import type { HeartBar, TrackCell } from './hearts-view'

const TRACK = 'var(--color-hairline-strong)'

/** A heart filling from the bottom in the ladder's colour: the stage heart (`hearts/friendship`, `romance`, `spouse`). The
 * fill is an inline background image and the clip a class, never the `background` shorthand, which resets the clip. */
export function FillingHeart({ colour, share, size = 14 }: { colour: string; share: number; size?: number }) {
  const at = Math.round(Math.max(0, Math.min(1, share)) * 100)
  return (
    <span aria-hidden className="inline-block shrink-0 bg-clip-text leading-none font-bold text-transparent" data-filling-heart={at}
      style={{ fontSize: size, width: size, backgroundImage: `linear-gradient(to top, ${colour} ${at}%, ${TRACK} ${at}%)` }}>
      ♥
    </span>
  )
}

/** The row's bar: her ladder's hearts as segments, the levels played full, the next filling, a waiting rung's
 * mark after them with "Tomorrow" or "Ready". */
export function HeartSegments({ heart }: { heart: HeartBar }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-1" data-segments={heart.segments.map((s) => (s.state === 'full' ? '■' : s.state === 'filling' ? '▣' : '□')).join('')}>
      <span aria-hidden className="flex min-w-0 flex-1 gap-[2px]">
        {heart.segments.map((s, i) => (
          <span key={i} className="block h-2 min-w-0 flex-1 rounded-[2px]" data-segment={s.state}
            style={{ background: s.state === 'full' ? heart.colour : s.state === 'filling' ? `linear-gradient(to right, ${heart.colour} ${Math.round(s.share * 100)}%, ${TRACK} ${Math.round(s.share * 100)}%)` : TRACK }} />
        ))}
      </span>
      {heart.mark && (
        <span className="shrink-0 text-[12px] font-bold" style={{ color: heart.colour }} data-mark={heart.mark}>
          {heart.mark}{heart.markWords && <span className="pl-0.5 text-[11px]">{heart.markWords}</span>}
        </span>
      )}
    </span>
  )
}

/** "● Ready" in the stage's colour, its dot uma-art's `hearts/ready` mark. */
export function ReadyChip({ colour }: { colour: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[11px] leading-5 font-bold text-white" style={{ background: colour }} data-ready-chip>
      <UiMark mark="hearts/ready" fallback="●" /> Ready
    </span>
  )
}

/** "✉" an invitation from her today, uma-art's `hearts/invitation` mark (F50 sends them). */
export function InviteChip() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#e0567a]/15 px-1.5 text-[11px] leading-5 font-bold text-[#c2385e]" aria-label="An invitation" data-invite-chip>
      <UiMark mark="hearts/invitation" fallback="✉" />
    </span>
  )
}

/** "Away" on her off-season. */
export function AwayChip() {
  return <span className="inline-flex shrink-0 items-center rounded-full bg-sunken px-1.5 text-[11px] leading-5 font-semibold text-ink-soft" data-away-chip>Away</span>
}

/** The route as one track: F1–F10, ◆, R1–R10, ◇, ◇, S1–S5 in one row, two under 375 pt. Played rungs are
 * filled in their ladder's colour, the next one filling, the rest empty; a waiting rung is a diamond. */
export function RouteTrack({ cells, label }: { cells: readonly TrackCell[]; label: string }) {
  return (
    <div role="img" aria-label={label} className="grid grid-cols-[repeat(28,minmax(0,1fr))] items-center gap-x-[2px] max-[375px]:grid-cols-[repeat(14,minmax(0,1fr))] max-[375px]:gap-y-1.5" data-track>
      {cells.map((cell) => {
        const at = Math.round(cell.share * 100)
        const fill = cell.state === 'played' ? cell.colour : cell.state === 'next' ? `linear-gradient(to right, ${cell.colour} ${at}%, ${TRACK} ${at}%)` : TRACK
        return cell.wait ? (
          <span key={cell.rung} className="flex h-3 items-center justify-center" data-rung={cell.rung} data-state={cell.state}>
            <span className="block size-2 rotate-45 rounded-[1px]"
              style={{ background: cell.state === 'played' ? cell.colour : cell.state === 'next' ? `${cell.colour}55` : 'transparent', boxShadow: `inset 0 0 0 1.5px ${cell.state === 'ahead' ? TRACK : cell.colour}` }} />
          </span>
        ) : (
          <span key={cell.rung} className={`block h-2.5 rounded-[2px] ${cell.state === 'next' ? 'ring-1 ring-offset-1 ring-offset-panel' : ''}`} data-rung={cell.rung} data-state={cell.state}
            style={{ background: fill, ...(cell.state === 'next' ? { ['--tw-ring-color' as string]: cell.colour } : {}) }} />
        )
      })}
    </div>
  )
}
