// The dialogue engine's one layout, for every scene (the opening, meeting her, the ring bench's, heart events, pair
// talks, the household's scenes): the environment spans the stage, her bust is on the left, and dialogue and choices
// sit in a readable panel on the right.
// The next line's bust is preloaded while this one shows. While her illustration is up (`Illustration.tsx`) there's no
// bust: the line or the choices sit in the text box over the picture's lower edge, and a tap on the picture is the
// line's tap. Loaded with the players.
import type { ReactNode } from 'react'
import { PreloadLine, SceneBust, useSceneSpeaker } from './Bust'
import { useArtMode } from './Illustration'
import { useMaster } from '../master/master'
import { nameOfAnyone } from '../story/people'
import { useStory } from '../story/story'
import { SceneBackground, useEnvironment } from './SceneBackground'
import type { SceneEnvironment } from './scene-context'

/** Who's on the stage: the speaker (or the scene's own Uma), her name and the line's emote. */
export interface OnStage { who: string; name: string; emote?: string | null }
type Data = { [key: `data-${string}`]: string | number | boolean | undefined }

/** The bust's panel: its backdrop, and her bust standing on its foot. A tap on it is the line's tap. */
export function BustPanel({ bust: written, backdrop = null, onTap, data = {} }: { bust: OnStage | null; backdrop?: ReactNode; onTap?: () => void; data?: Data }) {
  const who = useSceneSpeaker(written?.who ?? null)
  const master = useMaster()
  const story = useStory()
  const bust = who && written ? { ...written, who, name: who === written.who ? written.name : nameOfAnyone(master.status === 'ready' ? master.view : null, story, who) } : null
  return (
    <div className="relative flex w-[40%] max-w-[380px] shrink-0 items-end justify-center self-stretch overflow-hidden"
      onClick={onTap} aria-hidden={bust ? undefined : true} data-bust={bust ? bust.who : 'narrator'} data-stage-bust {...data}>
      {backdrop}
      {bust && (
        // As wide as the panel: the bust inside is sized by its height, and Safari sizes a box that shrinks to fit it as
        // 0 px wide (iPhone showed no bust at all).
        <span className={`relative flex h-full w-full max-w-full items-end ${backdrop ? 'justify-end pt-6 pr-3' : 'justify-center pt-1'}`} data-who={bust.who} data-bust-box>
          <SceneBust who={bust.who} name={bust.name} emote={bust.emote ?? null} size={220} />
        </span>
      )}
    </div>
  )
}

/** The stage: the bust's panel on the left, `children` (the line, or the choices) on the right; `next` is preloaded. */
export function Stage({ bust, next = null, backdrop = null, onTap, data = {}, panel = {}, environment, walkOn, footer, children }: {
  bust: OnStage | null; next?: { who: string; emote?: string | null } | null; backdrop?: ReactNode; onTap?: () => void; data?: Data; panel?: Data; environment?: SceneEnvironment; walkOn?: ReactNode; footer?: ReactNode; children: ReactNode
}) {
  const shared = useEnvironment()
  const art = useArtMode()
  if (art !== 'none') {
    return (
      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-end px-3 pb-3" data-scene-row data-art-stage={art} {...data}>
        {onTap && <div aria-hidden className="absolute inset-0" onClick={onTap} data-art-tap />}
        <div className="relative mx-auto flex max-h-full w-full max-w-[46rem] min-h-0 flex-row flex-wrap gap-2 overflow-y-auto rounded-xl border border-white/15 bg-[#17121c]/72 px-4 py-2.5 text-white shadow-3 backdrop-blur-md"
          data-art-box>
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className="relative z-10 flex min-h-0 flex-1 flex-row items-stretch gap-4 px-4 pt-1 pb-4" data-scene-row {...data}>
      <SceneBackground environment={environment ?? shared} />
      {walkOn}
      <BustPanel bust={bust} backdrop={backdrop} onTap={onTap} data={panel} />
      {footer ? <div className="relative flex min-h-0 min-w-0 flex-1 flex-col justify-end pt-1">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-hairline bg-panel/95 shadow-2">
          <div className="min-h-0 overflow-y-auto overscroll-contain px-3 py-2" data-stage-scroll>{children}</div>
          <div className="shrink-0 space-y-1 border-t border-hairline p-1.5" data-stage-footer>{footer}</div>
        </div>
      </div> : <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pt-2">
        <div className="mt-auto flex shrink-0 flex-col gap-2 rounded-xl border border-hairline bg-panel/95 p-2.5 shadow-2">{children}</div>
      </div>}
      {next && <PreloadLine who={next.who} emote={next.emote ?? null} />}
    </div>
  )
}
