import { PlaceHeader, useLeave } from '@luismlorenzana/uma-kit/shell'
import { useLocation, useSearchParams } from 'react-router'
import { GuideCard } from './Guide'
import { GROUPS, TOPICS, type TopicId } from './topics'

export default function GuidePage() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const leave = useLeave()
  const name = params.get('topic') ?? ''
  const topic: TopicId = Object.hasOwn(TOPICS, name) ? name as TopicId : 'actions'
  return (
    <div className="absolute inset-0 flex flex-col" data-page="guide">
      <PlaceHeader title="Farm guides" onBack={() => leave('/')} words={{ back: 'Back', about: 'About farm guides' }} />
      <main className="grid min-h-0 flex-1 grid-cols-[minmax(132px,1fr)_minmax(0,2fr)]">
        <nav className="overflow-y-auto border-r border-hairline px-2 pb-3" aria-label="Guide topics">
          {GROUPS.map(({ title, topics }) => (
            <section key={title}>
              <h2 className="px-1 pt-2 text-[12px] font-semibold text-ink-soft">{title}</h2>
              {topics.map((key) => (
                <button type="button" key={key} aria-pressed={key === topic}
                  onClick={() => setParams({ topic: key }, { replace: true, state: location.state })}
                  className={`block min-h-11 w-full rounded-md px-2 text-left text-[13px] leading-tight ${key === topic ? 'bg-sunken font-semibold' : ''}`}>
                  {TOPICS[key].title}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <section className="space-y-2 overflow-y-auto p-3" aria-live="polite">
          <h2 className="font-display text-[18px] font-semibold">{TOPICS[topic].title}</h2>
          <GuideCard topic={topic} />
        </section>
      </main>
    </div>
  )
}
