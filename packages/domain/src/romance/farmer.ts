// The farmer's name: the first screen on a fresh v4 farm, and Menu → Account's
// **Your name**. Letters of any script, spaces, apostrophes and hyphens; trimmed, inner runs of spaces collapsed, then
// 1–16 characters. No default, no pronouns, no gender: the farmer is never drawn, lines say "you", and `{farmer}`
// fills with this name at display time. Small on purpose: the save's parse checks it, so it loads at start.
import { SaveRuleError } from '../save/rules'
import type { SaveV4 } from '../save/v4'

export const FARMER_NAME_MAX = 16
/** What fills an empty field (grey, never stored). */
export const FARMER_PLACEHOLDER = 'Farmer'

/** Letters (any script, with their combining marks), spaces, apostrophes (' and ’) and hyphens. */
const ALLOWED = /^[\p{L}\p{M} '’-]+$/u
const LETTER = /\p{L}/u

/** The name as it's stored: Unicode-composed, trimmed, inner runs of spaces collapsed to one. */
export const cleanFarmerName = (raw: string): string => raw.normalize('NFC').trim().replace(/\s+/g, ' ')

/** Why a name can't be used under the letters rule, up to `max` characters, in the sheet's words, or null when it can. A
 * house's name follows the same rule at 20. */
export function nameIssue(raw: string, max: number): string | null {
  const name = cleanFarmerName(raw)
  if (!LETTER.test(name)) return 'Enter a name'
  if (!ALLOWED.test(name)) return 'Letters, spaces, \' and - only'
  if ([...name].length > max) return `${max} characters at most`
  return null
}

/** Why a name can't be used, in the sheet's words, or null when it can. */
export const farmerNameIssue = (raw: string): string | null => nameIssue(raw, FARMER_NAME_MAX)

/** A house's name: the farmer's letters rule, 1–20 characters. */
export const HOUSE_NAME_MAX = 20
/** What fills a house's empty name field (grey, never stored). */
export const HOUSE_PLACEHOLDER = 'Rose Cottage'
export const houseNameIssue = (raw: string): string | null => nameIssue(raw, HOUSE_NAME_MAX)

/** The farmer named, or renamed: a player's change, which the app stamps. Refused with the sheet's words. */
export function nameFarmer(save: SaveV4, raw: string): SaveV4 {
  const issue = farmerNameIssue(raw)
  if (issue) throw new SaveRuleError('bad-job', issue)
  const name = cleanFarmerName(raw)
  return name === save.farmer.name ? save : { ...save, farmer: { name } }
}

/** `{farmer}` filled with the name (the only placeholder the story allows). */
export const withFarmer = (line: string, name: string): string => line.replaceAll('{farmer}', name || FARMER_PLACEHOLDER)
