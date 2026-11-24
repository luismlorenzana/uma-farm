import { ANNIVERSARY_LOOK_POINTS, benchOpen, formalLooks, giveHeirloom, greaterLoveOf, HEIRLOOM_IDS, HEIRLOOMS, heirloomOf, type FarmSave, type HeirloomId, type StoryPack } from '@farm/domain'
import { useState } from 'react'
import { Link } from 'react-router'
import { JewelMark } from '../items/JewelMark'
import { RingSection } from '../loop/HeartProfile'
import { ringView } from '../loop/hearts-view'
import { changeHomestead } from '../loop/homestead-actions'
import { shortDate } from '../loop/words'

export function Jewelry({ save, pack, id }: { save: FarmSave; pack: StoryPack; id: string }) {
  const ring = ringView(save, pack, id)
  const spouse = save.love[id]?.stage === 'spouse'
  const points = greaterLoveOf(save, id).points
  const looks = formalLooks(save, id)
  const gifted = HEIRLOOM_IDS.filter(piece => heirloomOf(save, id, piece)?.gifted).length
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function give(piece: HeirloomId) {
    if (busy) return
    setBusy(true)
    try {
      await changeHomestead(state => giveHeirloom(state, id, piece))
      setMessage(HEIRLOOMS[piece].name + ' gifted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Try again.')
    } finally {
      setBusy(false)
    }
  }
  return <>
    <h2>Jewelry</h2>
    {ring?.ring || ring?.engraving || ring?.better.length ? <RingSection id={id} ring={ring} /> : <p>No wedding ring equipped.</p>}
    {benchOpen(save) && <Link className="lib-button" to="/?sheet=bench" state={{ back: true }}>Ring Bench ›</Link>}
    {spouse && <section className="pb-2" aria-label="Heirloom jewelry" data-heirloom-book={id}>
      <h3>Heirlooms · {gifted}/4 gifted</h3>
      <ul className="grid grid-cols-2 gap-1">
        {HEIRLOOM_IDS.map(piece => {
          const recipe = HEIRLOOMS[piece]
          const order = heirloomOf(save, id, piece)
          const threshold = ANNIVERSARY_LOOK_POINTS[recipe.look - 1]!
          return <li key={piece} className="min-w-0 rounded border border-hairline p-2">
            <strong className="flex items-center gap-1.5"><JewelMark piece={piece} />{recipe.name}</strong>
            <p>Occasion look {recipe.look} · {looks.includes(recipe.look) ? 'Unlocked' : points < threshold ? threshold + ' ♥' : 'Needs heirloom'}</p>
            {order?.gifted ? <small>Gifted · {shortDate(order.gifted, save.calendar)}</small>
              : order?.ready ? <button className="lib-button" type="button" disabled={busy} onClick={() => void give(piece)}>Give heirloom</button>
                : order ? <small>Ready {shortDate(order.due, save.calendar)}</small>
                  : <Link className="lib-button" to={`/?sheet=forge&tab=heirlooms&recipient=${id}&piece=${piece}`} state={{ back: true }}>Commission ›</Link>}
          </li>
        })}
      </ul>
      {message && <p role="status">{message}</p>}
    </section>}
  </>
}