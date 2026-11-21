import {
  BookIcon, CarrotIcon, ChevronRightIcon, CoinIcon, GateIcon, GemIcon, HeartIcon, HelpButton, HomeIcon,
  LevelUpIcon, MoonIcon, PickaxeIcon, StableIcon, StarIcon, StopwatchIcon, SyncIcon, TrophyIcon,
} from '@luismlorenzana/uma-kit/ui'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { TOPICS, type GuideIcon, type TopicId } from './topics'

const ICONS: Record<GuideIcon, typeof HomeIcon> = {
  home: HomeIcon, time: StopwatchIcon, night: MoonIcon, crop: CarrotIcon, goods: GemIcon, rank: LevelUpIcon,
  animal: StableIcon, tools: PickaxeIcon, town: GateIcon, book: BookIcon, heart: HeartIcon, star: StarIcon,
  festival: TrophyIcon, trade: CoinIcon, save: SyncIcon,
}

export function GuideCard({ topic }: { topic: TopicId }) {
  const { lead, items, flow, example } = TOPICS[topic]
  const List = flow ? 'ol' : 'ul'
  return (
    <div className="space-y-3 text-[14px] leading-snug" data-guide={topic}>
      <p className="font-medium text-ink">{lead}</p>
      {example && <p className="rounded-r-md border-l-2 border-accent bg-accent/8 px-3 py-2 text-ink">{example}</p>}
      <List className="divide-y divide-hairline rounded-lg border border-hairline bg-sunken/55" aria-label={flow ? 'What to do in order' : 'What to do'}>
        {items.map(([icon, label, instruction], index) => {
          const Mark = ICONS[icon]
          return (
            <li key={label} className="flex min-w-0 items-start gap-2.5 p-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-panel text-accent-strong" aria-hidden="true"><Mark size={24} variant="duotone" /></span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{flow ? `${index + 1}. ` : ''}{label}</p>
                <p className="text-ink-soft">{instruction}</p>
              </div>
            </li>
          )
        })}
      </List>
    </div>
  )
}

export function GuideContent({ topic, children }: { topic: TopicId; children?: ReactNode }) {
  return (
    <>
      <GuideCard topic={topic} />
      {children && (
        <div className="space-y-2 border-t border-hairline py-2 text-[13px] text-ink-soft">{children}</div>
      )}
      <Link to={`/guide?topic=${topic}`} state={{ back: true }} className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-accent-strong">
        All farm guides <ChevronRightIcon size={14} />
      </Link>
    </>
  )
}

export function GuideButton({ topic, title, label, children }: { topic: TopicId; title?: string; label?: string; children?: ReactNode }) {
  return (
    <HelpButton title={title ?? TOPICS[topic].title} label={label}>
      <GuideContent topic={topic}>{children}</GuideContent>
    </HelpButton>
  )
}
