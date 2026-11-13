// The evening in words: the kinds sheet's rows with each one's
// three numbers for her today, the picker's rows, Tonight's Evening rows, the Hearts header's marks, the card's sum and
// the profile's Evening button. Pure, so the screens and the tests read the same. Loaded on demand, the romance build only.
import {
  DATE_FROM, EVENING_KINDS, EVENINGS, eveningMarks, eveningPreview, eveningRole, eveningUmas, favouriteKind, GRADE_NAMES, GRADES, HANGOUT_FROM, homeTonight, invitedNow,
  inviteDue, invitePoints, isFestivalNight, kindBuilt, kindOpens, kindsNow, levelWords, ROLE_WORDS, rungName, slotsLeft, type EveningCard, type EveningKind,
  type Grade, type PlayKind, type SaveV4, type StoryPack,
} from '@farm/domain'

type NameOf = (id: string) => string
type Pack = Pick<StoryPack, 'cast' | 'bibles'>

/** A kind on her kinds sheet: open now (with its three numbers), or waiting for her ladder ("At Romance 3"). */
export interface KindRow {
  kind: EveningKind
  name: string
  play: PlayKind
  /** Fine, Great and Perfect with her today: "Perfect +225" before the tap. */
  pays: Readonly<Record<Grade, number>>
  favourite: boolean
  /** Null when she can play it now; else the rung that opens it. */
  locked: string | null
}

/** Her kinds sheet: the kinds open to her now in the kinds' order, festival night last on a festival day, then
 * the kinds her ladder hasn't opened yet, greyed with their rung. Kinds whose game isn't built aren't shown. */
export function kindRows(save: SaveV4, pack: Pack, id: string, birthday: boolean): KindRow[] {
  const love = save.love[id]
  if (!love) return []
  const now = new Set(kindsNow(save, id))
  const favourite = favouriteKind(pack, id)
  const left = slotsLeft(save)
  const rows = EVENING_KINDS.flatMap((kind): KindRow[] => {
    const def = EVENINGS[kind]
    const row = { kind, name: def.name, play: def.play.kind, pays: eveningPreview(save, pack, id, kind, birthday), favourite: kind === favourite }
    if (now.has(kind)) return [{ ...row, locked: null }]
    if (isFestivalNight(kind) || !kindBuilt(kind) || kindOpens(love, kind) || left.evenings === 0) return []
    return [{ ...row, locked: def.hangout !== null && eveningRole(love) === null ? `At Friendship ${def.hangout}` : `At Romance ${def.date}` }]
  })
  return [...rows.filter((r) => r.locked === null), ...rows.filter((r) => r.locked !== null)]
}

/** Her three numbers in a line: "Fine +90 · Great +150 · Perfect +225". */
export const paysWords = (pays: Readonly<Record<Grade, number>>): string => GRADES.map((g) => `${GRADE_NAMES[g]} +${pays[g]}`).join(' · ')

/** What an evening with her is, in words: "A hangout", "A date", "An evening at home". */
export function roleWords(save: SaveV4, id: string): string {
  const love = save.love[id]
  const role = love ? eveningRole(love) : null
  return role ? ROLE_WORDS[role] : `From Friendship ${HANGOUT_FROM}`
}

/** A row of Tonight's picker: who's home and can spend it, her favourite kind, and her invitation. */
export interface PickRow {
  id: string
  name: string
  level: string
  favourite: string
  /** ✉ she asked today and it stands (unanswered or yes); `yes` once you said yes. */
  invite: 'yes' | 'asked' | null
}
/** The picker: the Umas who can spend an evening now, a yes first, then an unanswered invitation, then the cast's order. */
export function pickRows(save: SaveV4, pack: Pack, nameOf: NameOf): PickRow[] {
  const inviteOf = (id: string): PickRow['invite'] => {
    if (!invitedNow(save, id)) return null
    return save.today.invites.find((i) => i.id === id)?.answer === 'yes' ? 'yes' : 'asked'
  }
  const rank = (r: PickRow) => (r.invite === 'yes' ? 0 : r.invite === 'asked' ? 1 : 2)
  return eveningUmas(save, pack).map((id): PickRow => ({
    id, name: nameOf(id), level: levelWords(save.love[id]!), favourite: EVENINGS[favouriteKind(pack, id)].short, invite: inviteOf(id),
  })).map((r, i) => ({ r, i })).sort((a, b) => rank(a.r) - rank(b.r) || a.i - b.i).map(({ r }) => r)
}

/** One of Tonight's Evening rows: a spent slot "with Stand-in 2 · Walk ✓", the Uma who said yes with **Play ›**,
 * or **Pick someone ›**; festival night's its own row on a festival day. */
export type TonightRow =
  | { slot: 'evening' | 'festival'; state: 'spent'; with: string; text: string }
  | { slot: 'evening' | 'festival'; state: 'invited'; with: string; text: string }
  | { slot: 'evening' | 'festival'; state: 'free'; text: string }
  | { slot: 'evening' | 'festival'; state: 'none'; text: string }
export function tonightRows(save: SaveV4, pack: Pack, nameOf: NameOf): TonightRow[] {
  const someone = eveningUmas(save, pack)
  let yesShown = false
  return eveningMarks(save).map((mark): TonightRow => {
    if (mark.spent) return { slot: mark.slot, state: 'spent', with: mark.spent.with, text: `with ${nameOf(mark.spent.with)} · ${EVENINGS[mark.spent.kind].short} ✓` }
    const yes = mark.slot === 'evening' && !yesShown ? save.today.invites.find((i) => i.answer === 'yes' && inviteDue(save, i.id) && someone.includes(i.id)) : undefined
    if (yes) {
      yesShown = true
      return { slot: mark.slot, state: 'invited', with: yes.id, text: `${nameOf(yes.id)} · ${EVENINGS[yes.kind].short}` }
    }
    const can = someone.some((id) => kindsNow(save, id).some((k) => (mark.slot === 'festival' ? isFestivalNight(k) : !isFestivalNight(k))))
    return can ? { slot: mark.slot, state: 'free', text: 'Pick someone ›' } : { slot: mark.slot, state: 'none', text: 'No one free tonight' }
  })
}

/** The Hearts header's marks: ○ free, ● spent, festival night's tinted by its festival. */
export interface HeaderMark {
  key: string
  spent: boolean
  festival: boolean
  label: string
}
export function headerMarks(save: SaveV4, nameOf: NameOf): HeaderMark[] {
  return eveningMarks(save).map((m, i) => ({
    key: `${m.slot}:${i}`, spent: m.spent !== null, festival: m.slot === 'festival',
    label: `${m.slot === 'festival' ? 'Festival night' : 'Evening'}: ${m.spent ? `spent with ${nameOf(m.spent.with)}` : 'free'}`,
  }))
}

/** The card's sum: "+150 Perfect × 1.5 her favourite × 1.5 her birthday = +338", "+20 for saying yes", then
 * "= +358 toward Friendship 3 (+40 banked)". */
export function cardSum(card: EveningCard): { play: string; invite: string | null; total: string } {
  const factors = [
    ...(card.factors.kind ? ['× 1.5 her favourite'] : []), ...(card.factors.birthday ? ['× 1.5 her birthday'] : []), ...(card.factors.anniversary ? ['× 1.5 your anniversary'] : []),
  ]
  const play = `+${card.base} ${GRADE_NAMES[card.grade]}${factors.length > 0 ? ` ${factors.join(' ')} = +${card.points}` : ''}`
  const invite = card.invite > 0 ? `+${card.invite} for saying yes` : null
  const sum = card.points + card.invite
  const total = card.bar.rung === null ? `= +${sum}` : `= +${sum} toward ${rungName(card.bar.rung)}${card.bar.banked > 0 ? ` (+${card.bar.banked.toLocaleString('en-US')} banked)` : ''}`
  return { play, invite, total }
}

/** The (i)'s evening line, in its fifth place. */
export const EVENING_HELP = `One evening a day with someone home: a hangout from Friendship ${HANGOUT_FROM}, a date from Romance ${DATE_FROM}. Fine +60, Great +100, Perfect +150, ×1.5 in her favourite kind, and +20 when she asked you.`

/** What her profile's Evening button says: "Evening ›" while she can spend one, else why not. */
export function eveningButton(save: SaveV4, id: string): { open: boolean; text: string } {
  const love = save.love[id]
  if (!love) return { open: false, text: 'Evening' }
  if (kindsNow(save, id).length > 0) return { open: true, text: 'Evening ›' }
  if (save.today.evenings.some((e) => e.with === id)) return { open: false, text: 'Evening ✓' }
  if (eveningRole(love) === null) return { open: false, text: `Evening · F${HANGOUT_FROM}` }
  if (!homeTonight(save, id)) return { open: false, text: 'Away tonight' }
  return { open: false, text: 'Evening spent' }
}

/** The +20 she'd add tonight (×2 on her anniversary), for the kinds sheet's line. */
export const inviteBonus = (save: SaveV4, id: string): number | null => (inviteDue(save, id) ? invitePoints(save, id) : null)
