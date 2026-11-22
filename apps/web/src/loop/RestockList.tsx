import { creditLeft, goodName, restockList, type FarmSave } from '@farm/domain'
import { Link } from 'react-router'
import { gold } from './money-words'

export function RestockList({ save }: { save: FarmSave }) {
  const rows = restockList(save)
  if (!rows.length) return null
  return <section className="space-y-1 rounded-md border border-hairline p-2" aria-label="Restock">
    <h3 className="font-semibold">Restock · Needs your approval</h3>
    {rows.map(row => <Link key={row.id} to={row.store === 'shop' ? '/?sheet=shop' : '/town?at=rancher&sheet=rancher'} state={{ back: true }}
      className="flex min-h-11 items-center justify-between gap-2 text-[13px] text-accent-strong">
      <span>{row.count} × {row.id === 'fodder' ? 'Fodder' : goodName(row.id)}</span>
      <span>{gold(row.cost)}{row.cost > save.gold && row.cost <= save.gold + creditLeft(save) ? ' · Financing available' : ''} ›</span>
    </Link>)}
  </section>
}
