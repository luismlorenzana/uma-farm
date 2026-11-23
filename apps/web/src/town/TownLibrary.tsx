import {
  discovered, dishName, farmRankOf, goodCount, goodName, goodOf, ingredientSources, kitchenBase, kitchenBuilt,
  knowsRecipe, learnTroutGrill, RECIPES, recipeLock, recipeOf, recipeWords, TROUT_GRILL, GOOD_IDS, type SaveV4,
} from '@farm/domain'
import { Button } from '@luismlorenzana/uma-kit/ui'
import { useState } from 'react'
import { Link } from 'react-router'
import { changeHomestead } from '../loop/homestead-actions'
import { gold } from '../loop/money-words'
import { RecipeBook } from '../loop/RestaurantSheet'

const GUEST_VIEWS = [['cookbook', 'Cookbook'], ['restaurant', 'Restaurant recipes'], ['guide', 'Field guides']] as const
type LibraryView = typeof GUEST_VIEWS[number][0]

export function TownLibrary({ save, tab }: { save: SaveV4; tab: LibraryView }) {
  const [view, setView] = useState(tab)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const known = knowsRecipe(save, TROUT_GRILL)
  const trout = discovered(save, 'trout')
  const locked = recipeLock(save, TROUT_GRILL)
  const query = search.trim().toLowerCase()
  const names = goodName
  const buy = async (discovery: boolean) => {
    if (busy) return
    setBusy(true)
    try {
      await changeHomestead(current => learnTroutGrill(current, discovery))
      setMessage('Trout Grill learned.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not learn the recipe.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-2" data-town-library={view}>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Library collections">
        {GUEST_VIEWS.map(([key, label]) => <Button key={key} variant={view === key ? undefined : 'secondary'} onClick={() => { setView(key); setSearch('') }}>{label}</Button>)}
      </div>
      {view === 'restaurant' ? <RecipeBook save={save} /> : <>
        {view === 'cookbook' && <section className="space-y-1 rounded-lg border border-hairline bg-panel p-3" data-library-recipe={TROUT_GRILL}>
          <h3 className="font-display text-lg font-bold">Trout Grill</h3>
          <p className="text-sm">{recipeWords(TROUT_GRILL)} per portion</p>
          {kitchenBuilt(save) && <p className="text-xs text-ink-soft">Your Kitchen cooks a menu of {kitchenBase(save)} dishes. The Café needs one Trout Grill.</p>}
          <p className="text-xs text-ink-soft">Trout G2 · {trout ? 'Discovered' : 'Pond in Spring, Autumn or Winter · River Bend year-round'} · {goodCount(save.items, 'trout')} Trout in the Warehouse</p>
          <div className="flex flex-wrap items-center gap-2">
            {!kitchenBuilt(save) ? <Link to="/?peek=kitchen" state={{ back: true }} className="inline-grid min-h-11 items-center text-sm font-semibold underline">Build the Kitchen ›</Link>
              : known ? <Link to="/?sheet=kitchen" state={{ back: true }} className="inline-grid min-h-11 items-center text-sm font-semibold underline">Known · Open Kitchen ›</Link>
                : <>
                  <Button disabled={busy || !trout} onClick={() => void buy(true)}>Learn from your Trout discovery</Button>
                  <Button variant="secondary" disabled={busy || !!locked} onClick={() => void buy(false)}>Buy recipe · {gold(recipeOf(TROUT_GRILL)!.price)}</Button>
                </>}
          </div>
          {message && <p className="text-xs" role="status">{message}</p>}
        </section>}
        <input type="search" aria-label={view === 'guide' ? 'Find ingredients' : 'Find recipes'} placeholder={view === 'guide' ? 'Find ingredients' : 'Find recipes'} value={search}
          onChange={event => setSearch(event.target.value)} className="min-h-11 w-full rounded-md border border-hairline bg-panel px-3 text-base" />
        {view === 'cookbook' ? <ul className="grid gap-1.5 sm:grid-cols-2">
          {RECIPES.filter(recipe => dishName(recipe.dish).toLowerCase().includes(query)).map(recipe =>
            <li key={recipe.dish} className="rounded-md border border-hairline p-2">
              <p className="text-sm font-semibold">{dishName(recipe.dish)} · {knowsRecipe(save, recipe.dish) ? 'Known' : kitchenBuilt(save) ? gold(recipe.price) : 'Kitchen required'}</p>
              <p className="text-xs text-ink-soft">{recipeWords(recipe.dish)}</p>
              {kitchenBuilt(save) && !knowsRecipe(save, recipe.dish) && <Link className="inline-grid min-h-11 items-center text-xs font-semibold underline" to="/town?at=store&sheet=shop" state={{ back: true }}>Recipe shelf ›</Link>}
            </li>)}
        </ul> : <>
          <Link to="/diary" state={{ back: true }} className="inline-grid min-h-11 items-center text-sm font-semibold underline">Town notes in the Diary ›</Link>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {GOOD_IDS.filter(id => names(id).toLowerCase().includes(query)).slice(0, 48).map(id =>
              <li key={id} className="rounded-md border border-hairline p-2 text-xs">
                <p className="text-sm font-semibold">{names(id)} G{goodOf(id)?.grade}</p>
                <p>{discovered(save, id) ? 'Discovered' : 'Undiscovered'} · {goodCount(save.items, id)} in stock</p>
                {ingredientSources(id).map((source, index) =>
                  <p key={index} className="text-ink-soft">{source.label}{source.rank > farmRankOf(save.farm.points) ? ` · Farm Rank ${source.rank}` : ''}</p>)}
              </li>)}
          </ul>
        </>}
      </>}
    </div>
  )
}
