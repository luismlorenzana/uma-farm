// The farm's accounts in words: a loan's project by its name, a loan's line ("440g owed · 45g a night · clears in about 10
// nights"), the morning's food, upkeep and loans lines ("From the pantry · 6 meals", "Takeout · 30g"), and the upkeep's
// breakdown. The save holds ids and gold; these say them, for the morning card, the Book, the Diary's projects and the
// mayor's office. Loaded on demand with those screens. Pure, so the screens and the tests read the same.
import {
  DORM_LOAN, HOUSE_LOAN, loanClears, placeNameOf, UPKEEP_BUILDING, UPKEEP_RESIDENT, type FarmPlaceId, type FarmSave, type Loan, type MoneyLine, type StoryPack,
  type Upkeep,
} from '@farm/domain'
import { plural, shortDate, theName } from './words'

export const gold = (n: number): string => `${n.toLocaleString('en-US')}g`

/** How a project's place and house are named: the world's place name, and the house's own name. */
export interface ProjectNames {
  place: (id: FarmPlaceId) => string
  house: (n: number) => string
}
/** The names on this farm: the pack's world for the places (the game's own without it), the save's for the houses. */
export const projectNames = (pack: Partial<Pick<StoryPack, 'world'>> | null, save: Pick<FarmSave, 'homestead'>): ProjectNames => ({
  place: (id) => placeNameOf(pack, id), house: (n) => save.homestead.houses[n]?.name ?? `House ${n}`,
})
/** A loan's project by name: the place as the map names it, or the house by its name ("Rose Cottage"), "House 2" before
 * it has one; a loan a save still holds toward the retired Dorm, "Dorm level 2". */
export function projectName(project: string, names: ProjectNames): string {
  const house = HOUSE_LOAN.exec(project)
  if (house) return names.house(Number(house[1]))
  const dorm = DORM_LOAN.exec(project)
  return dorm ? `Dorm level ${dorm[1]}` : names.place(project as FarmPlaceId)
}
/** "the Mill", "Dorm level 2", "Rose Cottage": a project as a sentence names it. */
export const projectInSentence = (project: string, names: ProjectNames): string =>
  HOUSE_LOAN.test(project) || DORM_LOAN.test(project) ? projectName(project, names) : theName(projectName(project, names))

/** A loan as the Book and the projects list say it: "440g owed · 45g a night · clears in about 10 nights (Spring 11)". */
export function loanWords(save: Pick<FarmSave, 'calendar'>, loan: Loan): string {
  const { nights, day } = loanClears(save, loan)
  return `${gold(loan.owed)} owed · ${gold(loan.nightly)} a night · clears in about ${plural(nights, 'night')} (${shortDate(day)})`
}

/** The upkeep's breakdown, a line each that counts: "2 places built · 30g", "1 house · 15g", "2 spouses on the farm ·
 * 20g". A farmhand isn't in it: her meals on her farm days are her cost. */
export function upkeepLines(upkeep: Upkeep): { key: string; text: string; gold: number }[] {
  return [
    { key: 'places', text: plural(upkeep.places, 'place built', 'places built'), gold: upkeep.places * UPKEEP_BUILDING },
    { key: 'houses', text: plural(upkeep.houses, 'house'), gold: upkeep.houses * UPKEEP_BUILDING },
    { key: 'residents', text: `${plural(upkeep.residents, 'spouse')} on the farm`, gold: upkeep.residents * UPKEEP_RESIDENT },
  ].filter((line) => line.gold > 0)
}

/** One of the morning's upkeep and loans lines: its words, and a warning's tag. */
export interface MoneyWords {
  key: string
  text: string
  tag?: string
  /** A short night's line, drawn as a warning. */
  warn?: boolean
}
/** The morning's food, upkeep and loans lines, in the night's order: each loan's share ("Loan for the Mill · 55g repaid ·
 * 440g left", "· payment skipped", "· cleared"), the staff meal ("Staff meal · 12 at the table · well fed 2
 * days", tagged Well fed), the meals from the pantry ("From the pantry · 6 meals", "· 2
 * spoiled", tagged Well fed when a good meal fed an Uma), the takeout ("Takeout · 30g", or "10g of 30g"), the upkeep
 * ("Upkeep · 45g", or "5g of 45g"), a short night ("Short of upkeep · 40g owed", tagged Warning; from the second, "·
 * farmhands at half pace", tagged Half pace) or the owed paid ("Upkeep paid up · 85g owed", tagged Paid). */
export function moneyLines(lines: readonly MoneyLine[], names: ProjectNames): MoneyWords[] {
  return lines.map((line): MoneyWords => {
    switch (line.kind) {
      case 'loan': {
        const what = `Loan for ${projectInSentence(line.for, names)}`
        if (line.left === 0) return { key: `loan:${line.for}`, text: `${what} · cleared`, tag: 'Cleared' }
        return { key: `loan:${line.for}`, text: `${what} · ${line.paid > 0 ? `${gold(line.paid)} repaid` : 'payment skipped'} · ${gold(line.left)} left` }
      }
      case 'staff': return { key: 'staff', text: `Staff meal · ${line.mouths} at the table · well fed ${line.days === 1 ? 'today' : `${line.days} days`}`, tag: 'Well fed' }
      case 'pantry': return {
        key: 'pantry', text: `From the pantry · ${plural(line.meals, 'meal')}${line.spoiled > 0 ? ` · ${line.spoiled} spoiled` : ''}`,
        ...(line.fed > 0 ? { tag: 'Well fed' } : {}),
      }
      case 'takeout': return { key: 'takeout', text: `Takeout · ${line.paid === line.due ? gold(line.due) : `${gold(line.paid)} of ${gold(line.due)}`}` }
      case 'upkeep': return { key: 'upkeep', text: `Upkeep · ${line.paid === line.due ? gold(line.due) : `${gold(line.paid)} of ${gold(line.due)}`}` }
      case 'short': return line.nights >= 2
        ? { key: 'short', text: `Short of upkeep · ${gold(line.owed)} owed · farmhands at half pace`, tag: 'Half pace', warn: true }
        : { key: 'short', text: `Short of upkeep · ${gold(line.owed)} owed`, tag: 'Warning', warn: true }
      case 'paid-up': return { key: 'paid-up', text: `Upkeep paid up · ${gold(line.owed)} owed`, tag: 'Paid' }
    }
  })
}
