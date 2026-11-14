// The cards that close an event: **the level-up card** closes every event:
// her heart fills with a short sparkle (still, with reduced motion) and she says her last line; then the sum ("+50 event
// · +30 choice · +15 Great = +95 toward Romance 6 (+40 banked)"), the perk it brings (its words; it acts on the farm,
// and Friendship 4's names her signature dish's recipe),
// "‹caption› saved" (her Memory), any unlock, and the next rung's cost, its place and setup (the next beat's hint) and
// what it opens, with one **Continue**. **The stage-up screen** closes the confession's Yes (Partners), the proposal
// (Engaged: "Your wedding: tomorrow, whenever you're ready") and the wedding (Married: the track gold, the spouse ladder, her
// ring at her line, her anniversary, "Married n/N · next household scene at 5"): the route's track re-coloured, "Opens
// now" and **Continue**. The night levels (S2, S4) show the level-up card from the morning. Loaded on demand with the
// player.
import { dishName, freeRooms, LADDER_COLOURS, ladderOf, perkLineOf, rungName, withFarmer, type EventCard, type Love, type SaveV4, type StageUp, type StoryPack } from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { Button, UiMark, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { moveSpouseTo } from './homestead-actions'
import { RouteTrack } from './HeartMarks'
import { marriedWords, perkLineWords, ringGivenWords, STAGE_WORDS, stageOpens, sumWords, unlockWords, weddingWords } from './event-view'
import { routeTrack } from './hearts-view'


/** The level-up card. */
export function LevelUpCard({ card, id, name, love, pack, farmer, onContinue }: {
  card: EventCard
  id: string
  name: string
  /** Her route after the event. */
  love: Love
  pack: Pick<StoryPack, 'cast' | 'bibles'>
  farmer: string
  onContinue: () => void
}) {
  const reduced = useReducedMotionSetting()
  const colour = LADDER_COLOURS[ladderOf(love.stage)]
  const line = perkLineOf(pack, id)
  const perk = perkLineWords(card.perk, line)
  const opens = card.next ? perkLineWords(card.next.perk, line) : null
  const title = card.answer === 'not-yet' ? 'Not yet' : rungName(card.rung)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4" data-level-up={card.rung} data-paid={card.paid}>
      <div className="flex flex-col items-center gap-1 pt-2 text-center">
        <p className="font-display flex items-center gap-2 text-[22px] font-bold" style={{ color: colour }}>
          <span aria-hidden className={reduced ? '' : 'level-sparkle'}>♥</span>{title}<span aria-hidden className={reduced ? '' : 'level-sparkle'}>♥</span>
        </p>
        <div className="flex items-end gap-3">
          <UmaBust outfitId={id} label={name} size={96} />
          {card.line && <p className="max-w-[60%] rounded-md bg-sunken px-3 py-2 text-left text-[15px] italic" data-card-line>“{withFarmer(card.line, farmer)}”</p>}
        </div>
      </div>
      <section className="rounded-md border border-hairline p-3 text-[14px] tabular-nums" data-sum>{sumWords(card)}</section>
      <section className="space-y-1.5 rounded-md border border-hairline p-3 text-[14px]">
        {perk && <p data-card-perk><span className="text-micro pr-1.5">Perk</span>{perk}</p>}
        {card.recipe && <p data-card-recipe={card.recipe}><span className="text-micro pr-1.5">Recipe</span>{dishName(card.recipe)} · in the Kitchen’s list</p>}
        {card.ring && <p data-card-ring={card.ring}><span className="text-micro pr-1.5">Ring</span>{ringGivenWords(card.ring)}</p>}
        {card.wedding && <p data-card-wedding={card.wedding.place}><span className="text-micro pr-1.5">Wedding</span>{weddingWords(card.wedding)}</p>}
        {card.memory && <p className="flex items-center gap-1.5" data-card-memory><span className="text-micro pr-0.5">Memory</span><UiMark mark="hearts/memory-frame" fallback={<span aria-hidden>▢</span>} />“{card.memory}” saved</p>}
        {unlockWords(card) && <p data-card-unlock><span className="text-micro pr-1.5">Unlocked</span>{unlockWords(card)}</p>}
        {card.learnt.length > 0 && <p className="text-ink-soft" data-card-learnt>A taste learnt</p>}
      </section>
      {card.answer === 'not-yet' ? (
        <section className="rounded-md border border-hairline p-3 text-[14px]" data-card-next="ask">
          <p className="font-semibold">She stays a close friend.</p>
          <p className="text-ink-soft">Ask her again from her profile, once a day. Her points bank meanwhile.</p>
        </section>
      ) : card.next ? (
        <section className="space-y-1 rounded-md border border-hairline p-3 text-[14px]" data-card-next={card.next.rung}>
          <p className="font-semibold">Next: {rungName(card.next.rung)}{card.next.cost > 0 ? ` · ${card.next.cost.toLocaleString('en-US')} points` : ''}</p>
          {card.next.cost > 0 && <p className="text-ink-soft tabular-nums">{card.next.points.toLocaleString('en-US')} / {card.next.cost.toLocaleString('en-US')}{card.next.banked > 0 ? ` · +${card.next.banked.toLocaleString('en-US')} banked` : ''}</p>}
          {card.next.hint && <p>{card.next.hint}</p>}
          {opens && <p className="text-ink-soft">Opens: {opens}</p>}
        </section>
      ) : <p className="text-center text-[14px] font-semibold" data-card-next="done">Her route is complete.</p>}
      <Button className="w-full" onClick={onContinue} data-action="continue">Continue</Button>
    </div>
  )
}

/** The stage-up screen: the track re-coloured, what the stage opens, **Continue**. Married adds the
 * line ("Married 1/3 · next household scene at 5"). */
export function StageUpScreen({ stage, id, love, pack, married = null, save = null, onContinue }: {
  stage: StageUp
  id: string
  love: Love
  pack: Pick<StoryPack, 'cast' | 'bibles'>
  /** Married's count and the cast's size, for its line. */
  married?: { married: number; met: number } | null
  /** The save now: Married's room step reads the homestead. */
  save?: SaveV4 | null
  onContinue: () => void
}) {
  const colour = LADDER_COLOURS[stage === 'married' ? 'spouse' : 'romance']
  const track = routeTrack(love)
  const words = STAGE_WORDS[stage]
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4" data-stage-up={stage}>
      <div className="space-y-2 pt-4 text-center">
        <p className="font-display text-[26px] font-bold" style={{ color: colour }}>{words.title}</p>
        <p className="text-[14px] text-ink-soft">{words.line}</p>
      </div>
      <RouteTrack cells={track} label={`Her route, ${stage === 'married' ? 'the spouse ladder' : stage === 'engaged' ? 'the wedding' : 'romance'} next`} />
      <section className="space-y-1 rounded-md border border-hairline p-3 text-[14px]">
        <h3 className="text-micro">Opens now</h3>
        <ul className="space-y-1" data-opens>
          {stageOpens(stage, perkLineOf(pack, id), {
            ring: love.ring ?? null, wed: love.wed ?? null,
            ...(stage === 'married' && save ? { house: love.house === undefined ? null : save.homestead.houses[love.house]?.name ?? null } : {}),
          }).map((line) => <li key={line}>· {line}</li>)}
        </ul>
      </section>
      {stage === 'romance' && love.points > 0 && <p className="text-center text-[14px] tabular-nums" style={{ color: colour }}>+{love.points.toLocaleString('en-US')} banked toward Romance 1</p>}
      {stage === 'married' && love.points > 0 && <p className="text-center text-[14px] tabular-nums" style={{ color: colour }}>+{love.points.toLocaleString('en-US')} toward Spouse 1</p>}
      {stage === 'married' && married && <p className="text-center font-display text-[16px] font-bold" data-married-line={married.married}>{marriedWords(married.married, married.met)}</p>}
      {stage === 'married' && save && <RoomStep save={save} id={id} />}
      <Button className="w-full" onClick={onContinue} data-action="continue">Continue</Button>
    </div>
  )
}

/** The wedding's room step (the stage-up screen gains it): her room, already taken by the default, and the other
 * houses with a free room to move her to at once, free. */
function RoomStep({ save, id }: { save: SaveV4; id: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const here = save.love[id]?.house
  const others = save.homestead.houses.map((h, n) => ({ n, name: h.name })).filter((h) => h.n !== here && freeRooms(save, h.n) > 0)
  if (others.length === 0) return null
  const move = (n: number) => {
    setBusy(true)
    setError(null)
    moveSpouseTo(id, n).catch((e: unknown) => setError(e instanceof Error ? e.message : 'That didn’t work.')).finally(() => setBusy(false))
  }
  return (
    <section className="space-y-1.5 rounded-md border border-hairline p-3 text-[14px]" data-room-step>
      <h3 className="text-micro">Her room</h3>
      <div className="flex flex-wrap gap-2">
        {others.map((h) => (
          <button key={h.n} type="button" disabled={busy} onClick={() => move(h.n)} className="min-h-11 rounded-sm border border-hairline-strong px-3 text-[14px] font-semibold" data-room-to={h.n}>
            {here === undefined ? `A room in ${h.name}` : `Move her to ${h.name}`}
          </button>
        ))}
      </div>
      {error && <p className="text-[12px] text-danger" role="alert">{error}</p>}
    </section>
  )
}
