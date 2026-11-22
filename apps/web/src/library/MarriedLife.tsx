import { ANNIVERSARY_LOOK_POINTS, EVENINGS, formalLooks, HEIRLOOM_IDS, HEIRLOOMS, heirloomOf, greaterLoveOf, PAJAMA_POINTS, TRUE_LOVE, visitLookKind, type FarmSave, type NightKind, type StoryPack } from '@farm/domain'
import { JewelMark } from '../items/JewelMark'
import { Link } from 'react-router'
import { NightReplayLinks } from '../loop/NightReplayLinks'
import { libraryDate } from './LibraryPage'

export function MarriedLife({ save, pack, id, nameOf }: { save: FarmSave; pack: StoryPack; id: string; nameOf: (id: string) => string }) {
  const heart = greaterLoveOf(save, id)
  const collections: readonly { kind: NightKind; title: string; thresholds: readonly number[] }[] = [
    { kind: 'pajamas', title: 'Pajamas', thresholds: PAJAMA_POINTS },
    { kind: 'anniversary', title: 'Birthday and anniversary outfits', thresholds: ANNIVERSARY_LOOK_POINTS },
  ]
  return <>
    <h2>Married Life</h2>
    <p data-greater-love={heart.points}>{heart.trueDay ? `True Love · ${libraryDate(heart.trueDay)}` : `Greater Love · ${heart.points}/${TRUE_LOVE}`}</p>
    <progress className="lib-greater-love" aria-label="Greater Love" value={heart.points} max={TRUE_LOVE} />
    {collections.map(({ kind, title, thresholds }) => {
      const seen = new Set(heart.memories.flatMap(visit => {
        const index = visit.who.indexOf(id)
        return visitLookKind(visit, index) === kind ? [visit.looks[index]] : []
      }))
      const open = (slot: number, points: number) => kind === 'anniversary' ? formalLooks(save, id).includes(slot) : heart.points >= points
      return <section key={kind} className="pb-2">
        <h3>{title} · {seen.size}/{thresholds.length} seen</h3>
        <ul className="grid grid-cols-5 gap-1" aria-label={title}>
          {thresholds.map((points, i) => <li key={points} className={!open(i + 1, points) ? 'rounded bg-ink/85 px-1 py-2 text-center text-white' : 'rounded border border-hairline px-1 py-2 text-center'}>
            <strong>{i + 1}</strong>
            <small className="block">{seen.has(i + 1) ? 'Seen' : open(i + 1, points) ? 'Open' : heart.points < points ? points + ' ♥' : 'Heirloom'}</small>
          </li>)}
        </ul>
      </section>
    })}
    {save.love[id]?.stage === 'spouse' && <section className="pb-2" aria-label="Heirloom jewelry" data-heirloom-book={id}>
      <h3>Heirlooms · {HEIRLOOM_IDS.filter(piece => heirloomOf(save, id, piece)?.gifted).length}/4 gifted</h3>
      <ul className="grid grid-cols-2 gap-1">
        {HEIRLOOM_IDS.map(piece => {
          const recipe = HEIRLOOMS[piece]
          const order = heirloomOf(save, id, piece)
          return <li key={piece} className="rounded border border-hairline p-2">
            <strong className="flex items-center gap-2"><JewelMark piece={piece} />{recipe.name}</strong>
            <p>{order?.gifted ? `Gifted · ${libraryDate(order.gifted)}` : order?.ready ? 'Ready to give' : order ? `Ready ${libraryDate(order.due)}` : `Look ${recipe.look} · ${ANNIVERSARY_LOOK_POINTS[recipe.look - 1]} Greater Love`}</p>
            {order?.gifted && order.assistant && <small>Prepared with {nameOf(order.assistant)}</small>}
            {!order?.gifted && <Link to={`/?sheet=forge&tab=heirlooms&recipient=${id}&piece=${piece}`} state={{ back: true }} className="flex min-h-11 items-center font-semibold text-accent-strong">{order?.ready ? 'Give her the heirloom ›' : 'See commission ›'}</Link>}
          </li>
        })}
      </ul>
    </section>}
    <h3>Night memories</h3>
    <ul className="lib-lines">
      {heart.memories.map((visit, index) => {
        const own = visit.who.indexOf(id)
        const withUma = visit.who.find(who => who !== id)
        const occasion = visit.kind === 'anniversary' ? `Anniversary ${visit.anniversary}` : visit.kind === 'birthday' ? 'Birthday night' : null
        const look = visitLookKind(visit, own) === 'anniversary' ? 'Occasion look' : 'Pajamas'
        const label = `${occasion ? occasion + ' · ' : ''}${look} ${visit.looks[own]}`
        return <li key={index}>
          <span>{label}{withUma && ` · With ${nameOf(withUma)}`}</span>
          <small>{libraryDate(visit.day)}</small>
          <NightReplayLinks save={save} visit={visit} owner={id} index={index} className="lib-button" />
        </li>
      })}
      {save.longGame?.outings?.map((outing, index) => outing.who.includes(id) && <li key={`outing:${index}`}>
        <span>{EVENINGS[outing.kind].name} · With {nameOf(outing.who.find(who => who !== id)!)}</span>
        <small>{libraryDate(outing.day)}</small>
        <Link className="lib-button" to={`/library?uma=${id}&page=married&visitReplay=${id}:e${index}`} state={{ back: true }}>Replay</Link>
      </li>)}
    </ul>
  </>
}
