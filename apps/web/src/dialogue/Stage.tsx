// The dialogue engine's one layout, for every scene (the opening, meeting her, the ring bench's, heart events, pair
// talks, the household's scenes): landscape, her bust on the left on the scene's backdrop when it has one (a heart
// event's place card; plain until place art exists), the line or the choices on the right, both resting on the foot.
// The next line's bust is preloaded while this one shows. Loaded with the players.
import type { ReactNode } from 'react'
import { PreloadLine, SceneBust } from './Bust'

/** Who's on the stage: the speaker (or the scene's own Uma), her name and the line's emote. */
export interface OnStage { who: string; name: string; emote?: string | null }
type Data = { [key: `data-${string}`]: string | number | boolean | undefined }

/** The bust's panel: its backdrop, and her bust standing on its foot. A tap on it is the line's tap. */
export function BustPanel({ bust, backdrop = null, onTap, data = {} }: { bust: OnStage | null; backdrop?: ReactNode; onTap?: () => void; data?: Data }) {
  return (
    <div className={`relative flex w-[40%] max-w-[380px] shrink-0 items-end justify-center self-stretch overflow-hidden ${backdrop ? 'rounded-lg border border-hairline' : ''}`}
      onClick={onTap} aria-hidden={bust ? undefined : true} data-bust={bust ? bust.who : 'narrator'} data-stage-bust {...data}>
      {backdrop}
      {bust && (
        <span className={`relative flex h-full max-w-full items-end ${backdrop ? 'ml-auto justify-end pt-6 pr-3' : 'justify-center pt-1'}`} data-who={bust.who}>
          <SceneBust who={bust.who} name={bust.name} emote={bust.emote ?? null} size={220} />
        </span>
      )}
    </div>
  )
}

/** The stage: the bust's panel on the left, `children` (the line, or the choices) on the right; `next` is preloaded. */
export function Stage({ bust, next = null, backdrop = null, onTap, data = {}, panel = {}, children }: {
  bust: OnStage | null; next?: { who: string; emote?: string | null } | null; backdrop?: ReactNode; onTap?: () => void; data?: Data; panel?: Data; children: ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-row items-stretch gap-4 px-4 pt-1 pb-4" data-scene-row {...data}>
      <BustPanel bust={bust} backdrop={backdrop} onTap={onTap} data={panel} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end gap-2 overflow-y-auto">{children}</div>
      {next && <PreloadLine who={next.who} emote={next.emote ?? null} />}
    </div>
  )
}
