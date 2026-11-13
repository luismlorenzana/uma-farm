// The Diary's Conversations: one row a pair with a bond heart,
// the most hearts first. Each shows the two faces, their names and hearts, and their conversations: those read as
// "Bond n" chips that replay them, **Read** for any opened and unread, and the tie's line for a pair with none written.
// Replays pay nothing and mark nothing new. Loaded on demand with the Diary.
import type { SaveV4 } from '@farm/domain'
import { FaceTile } from '@luismlorenzana/uma-kit/album'
import { withParam } from '@luismlorenzana/uma-kit/shell'
import { Panel } from '@luismlorenzana/uma-kit/ui'
import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useMaster } from '../master/master'
import { storyReady, useStory } from '../story/story'
import { conversationRows, readParam, type ConversationRow } from './hearts-view'
import { PAIR_MARK } from './summary-words'

export default function Conversations({ save }: { save: SaveV4 }) {
  const pack = useStory()
  useEffect(() => void storyReady().catch(() => undefined), [])
  const master = useMaster()
  const rows = useMemo(() => (pack ? conversationRows(save, pack) : []), [save, pack])
  const nameOf = (id: string): string => (master.status === 'ready' ? master.view.album.get(id)?.name : undefined) ?? 'An Uma'
  return (
    <Panel label="Conversations" data-conversations={rows.length}>
      {rows.length === 0
        ? <p className="py-2 text-ink-soft">None yet. Umas who work together grow close.</p>
        : <ul className="divide-y divide-hairline">{rows.map((row) => <PairRow key={`${row.a}:${row.b}`} row={row} nameOf={nameOf} />)}</ul>}
    </Panel>
  )
}

function PairRow({ row, nameOf }: { row: ConversationRow; nameOf: (id: string) => string }) {
  const location = useLocation()
  const link = (levels: readonly number[]) => withParam(location, 'read', readParam(row.a, row.b, levels))
  return (
    <li className="space-y-1 py-2" data-pair={`${row.a}-${row.b}`} data-hearts={row.hearts}>
      <div className="flex items-center gap-2.5">
        <span className="flex shrink-0 -space-x-2">
          <span className="block size-7"><FaceTile outfitId={row.a} size={28} label={nameOf(row.a)} round /></span>
          <span className="block size-7"><FaceTile outfitId={row.b} size={28} label={nameOf(row.b)} round /></span>
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{nameOf(row.a)} &amp; {nameOf(row.b)}</span>
        <span className="shrink-0 text-[14px] tracking-[-1px]" aria-label={`Bond ${row.hearts} of 5`}>
          <span className="text-[#e0567a]">{'♥'.repeat(row.hearts)}</span><span className="text-ink-faint/40">{'♥'.repeat(5 - row.hearts)}</span>
        </span>
      </div>
      {row.read.length + row.unread.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pl-[58px]">
          {row.read.map((h) => (
            <Link key={h} to={link([h])} state={{ back: true }} data-replay={h}
              className="grid min-h-11 place-items-center rounded-full border border-hairline-strong px-3 text-[13px] font-semibold">
              Bond {h}
            </Link>
          ))}
          {row.unread.length > 0 && (
            <Link to={link(row.unread)} state={{ back: true }} data-action="read" data-read={row.unread.join(',')}
              className="grid min-h-11 place-items-center rounded-full bg-[#c2385e] px-3 text-[13px] font-bold text-white">
              {PAIR_MARK} Read
            </Link>
          )}
        </div>
      ) : (
        <p className="pl-[58px] text-[12px] text-ink-soft" data-pair-line>{row.line ?? 'Closer now'}</p>
      )}
    </li>
  )
}
