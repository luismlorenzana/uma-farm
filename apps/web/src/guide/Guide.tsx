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
  const { steps, line } = TOPICS[topic]
  return (
    <div className="space-y-2" data-guide={topic}>
      <ol className="grid grid-cols-3 gap-2" aria-label="Steps">
        {steps.map(([icon, label], index) => {
          const Mark = ICONS[icon]
          return (
            <li key={label} className="relative flex min-h-[84px] min-w-0 flex-col items-center justify-center gap-1 rounded-lg bg-sunken px-1.5 py-2 text-center text-[12px] leading-tight font-semibold text-ink">
              <span className="text-accent-strong" aria-hidden="true"><Mark size={24} variant="duotone" /></span>
              {label}
              {index < steps.length - 1 && <span className="absolute -right-3 top-6 z-10 rounded-full bg-panel p-0.5 text-ink-soft" aria-hidden="true"><ChevronRightIcon size={14} /></span>}
            </li>
          )
        })}
      </ol>
      <p className="text-[14px] leading-snug text-ink">{line}</p>
    </div>
  )
}

export function GuideContent({ topic, children }: { topic: TopicId; children?: ReactNode }) {
  return (
    <>
      <GuideCard topic={topic} />
      {children && (
        <details>
          <summary className="flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-ink">More details</summary>
          <div className="space-y-2 text-[13px]">{children}</div>
        </details>
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
