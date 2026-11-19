import { dishesHeld, dishName, type FarmSave } from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { putDishInPantry } from './restaurant-actions'

export default function MealDishes({ save }: { save: FarmSave }) {
  const [chosen, setChosen] = useState('')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const held = dishesHeld(save)
  const dish = held.find((row) => row.key === chosen) ?? held[0]
  const convert = async () => {
    if (!dish || pending) return
    setPending(true)
    try {
      await putDishInPantry(dish.key)
      setNote(`6 ★${dish.stars} portions in the pantry.`)
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Try again.')
    } finally {
      setPending(false)
    }
  }
  if (!dish && !note) return null
  return (
    <section className="space-y-1.5" aria-label="Save dishes for meals">
      {dish && <div className="flex flex-wrap gap-1">
        <select aria-label="Dish for the pantry" value={dish.key} onChange={(e) => setChosen(e.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded border border-hairline bg-panel px-2 text-[13px]">
          {held.map((lot) => <option key={lot.key} value={lot.key}>{dishName(lot.id)} · ★{lot.stars} · {lot.count} held</option>)}
        </select>
        <Button variant="secondary" disabled={pending} onClick={() => void convert()}>Save for meals</Button>
      </div>}
      {note && <p role="status" className="text-[13px] text-ink-soft">{note}</p>}
    </section>
  )
}
