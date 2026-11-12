// The cards that close an event (F49 decisions 9 and 11; romance spec RM55): **the level-up card** closes every event:
// her heart fills with a short sparkle (still, with reduced motion) and she says her last line; then the sum ("+50 event
// · +30 choice · +15 Great = +95 toward Romance 6 (+40 banked)"), the perk it brings (F48's words; F51 makes it act, and
// Friendship 4's names her signature dish's recipe),
// "‹caption› saved" (her Memory), any unlock, and the next rung's cost, its place and setup (the next beat's hint) and
// what it opens, with one **Continue**. **The stage-up screen** closes the confession's Yes (and, from F53, the proposal
// and the wedding): the route's track re-coloured, "Opens now" and **Continue**. F54's night levels (S2, S4) show the
// level-up card from the morning. Loaded on demand with the player.
import { dishName, LADDER_COLOURS, ladderOf, perkLineOf, rungName, withFarmer, type EventCard, type Love, type StoryPack } from '@farm/domain'
import { UmaBust } from '@luismlorenzana/uma-kit/album'
import { Button, UiMark, useReducedMotionSetting } from '@luismlorenzana/uma-kit/ui'
import { RouteTrack } from './HeartMarks'
import { perkLineWords, stageOpens, sumWords, unlockWords } from './event-view'
import { routeTrack } from './hearts-view'


/** The level-up card (decision 9). */
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

/** The stage-up screen (decision 11): the track re-coloured, what the stage opens, **Continue**. */
export function StageUpScreen({ stage, id, love, pack, onContinue }: { stage: 'romance'; id: string; love: Love; pack: Pick<StoryPack, 'cast' | 'bibles'>; onContinue: () => void }) {
  const colour = LADDER_COLOURS[stage]
  const track = routeTrack(love)
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4" data-stage-up={stage}>
      <div className="space-y-2 pt-4 text-center">
        <p className="font-display text-[26px] font-bold" style={{ color: colour }}>Partners</p>
        <p className="text-[14px] text-ink-soft">Romance opens. Her bar turns rose.</p>
      </div>
      <RouteTrack cells={track} label="Her route, romance next" />
      <section className="space-y-1 rounded-md border border-hairline p-3 text-[14px]">
        <h3 className="text-micro">Opens now</h3>
        <ul className="space-y-1" data-opens>
          {stageOpens(stage, perkLineOf(pack, id)).map((line) => <li key={line}>· {line}</li>)}
        </ul>
      </section>
      {love.points > 0 && <p className="text-center text-[14px] tabular-nums" style={{ color: colour }}>+{love.points.toLocaleString('en-US')} banked toward Romance 1</p>}
      <Button className="w-full" onClick={onContinue} data-action="continue">Continue</Button>
    </div>
  )
}
