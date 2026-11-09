// The start's picks (F23 decisions 1 and 2; core spec CS2): the first boot shows six candidates, and you pick any three.
// The six are a seeded draw from the release's outfits not on the roster, nudged so the sheet always holds a C-or-better
// farmer (Stamina), forager (Speed) and fisher (Wit). One free redraw replaces all six. A migrated save with k Umas picks
// 3 − k from the same sheet. The sheet isn't saved: it's drawn again from the account, `start.redraws` and the release.
// Loaded with the loop's screens.
import { SaveRuleError } from '../save/rules'
import { picksLeft, type OutfitId, type SaveV3 } from '../save/v3'
import { joinRoster } from './dorm'
import { draw } from './draw'
import type { Activity } from './ranks'
import type { TalentOf, TalentStep } from './talents'

/** Six candidates (CS2). */
export const START_SHEET = 6
/** One free redraw. */
export const START_REDRAWS = 1
/** The sheet always holds a C-or-better farmer, forager and fisher: day 1's three activities. */
export const START_NEEDS: readonly Activity[] = ['farming', 'foraging', 'fishing']
export const START_STEP: TalentStep = 4

/** The release's ids in a seeded order: Fisher–Yates over its order, each swap `draw(uid, 0, what, n)`. */
function shuffled(ids: readonly OutfitId[], uid: string, what: string): OutfitId[] {
  const out = [...ids]
  let n = 0
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(draw(uid, 0, what, n++) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

/** One sheet from the candidates in their drawn order (decision 1): taken in order, except that a card which would leave
 * too few places for the needs still open is passed over for the next draw that fills one. Passed-over cards fill any
 * places left (a release without the needs still gives six). */
function drawSheet(order: readonly OutfitId[], talentOf: TalentOf): OutfitId[] {
  const sheet: OutfitId[] = []
  const passed: OutfitId[] = []
  const good = (id: OutfitId, a: Activity) => talentOf(id, a) >= START_STEP
  for (const id of order) {
    if (sheet.length === START_SHEET) break
    const open = START_NEEDS.filter((a) => !sheet.some((s) => good(s, a)))
    if (open.some((a) => good(id, a)) || START_SHEET - sheet.length - 1 >= open.length) sheet.push(id)
    else passed.push(id)
  }
  return [...sheet, ...passed].slice(0, START_SHEET)
}

/** The six on the sheet now (decision 1): the same six for the same account, release and redraws. Sheet *r* draws the
 * release's outfits not on the roster in the order `start:<r>` shuffles them, those an earlier sheet showed moved last,
 * so a redraw shows six new faces unless only an earlier card fills a need. */
export function startSheet(save: Pick<SaveV3, 'account' | 'roster' | 'start'>, release: readonly OutfitId[], talentOf: TalentOf): OutfitId[] {
  const pool = release.filter((id) => !save.roster[id])
  const shown = new Set<OutfitId>()
  let sheet: OutfitId[] = []
  for (let r = 0; r <= Math.min(save.start.redraws, START_REDRAWS); r++) {
    const order = shuffled(pool, save.account.uid, `start:${r}`)
    sheet = drawSheet([...order.filter((id) => !shown.has(id)), ...order.filter((id) => shown.has(id))], talentOf)
    sheet.forEach((id) => shown.add(id))
  }
  return sheet
}

/** Redraws left. */
export const redrawsLeft = (save: Pick<SaveV3, 'start'>): number => Math.max(0, START_REDRAWS - save.start.redraws)

/** The free redraw (decision 1): `start.redraws` to 1, and six more. Refused once used, or when no picks are left. */
export function redrawStart<S extends SaveV3>(save: S): S {
  if (picksLeft(save) === 0) throw new SaveRuleError('bad-job', 'Your first hands are here.')
  if (redrawsLeft(save) === 0) throw new SaveRuleError('bad-job', 'No redraws left.')
  return { ...save, start: { redraws: save.start.redraws + 1 } }
}

/** Picks the start's Umas from the sheet (decision 2): exactly the picks left (3 − the roster), each joining today, home
 * while a bed is free. */
export function pickStart<S extends SaveV3>(save: S, ids: readonly OutfitId[], release: readonly OutfitId[], talentOf: TalentOf): S {
  const left = picksLeft(save)
  if (left === 0) throw new SaveRuleError('bad-job', 'Your first hands are here.')
  const sheet = startSheet(save, release, talentOf)
  const want = Math.min(left, sheet.length)
  if (new Set(ids).size !== ids.length || ids.length !== want) throw new SaveRuleError('bad-count', `Pick ${want}.`)
  if (ids.some((id) => !sheet.includes(id))) throw new SaveRuleError('bad-job', 'Pick from the sheet.')
  return ids.reduce((next, id) => joinRoster(next, id).save, save)
}
