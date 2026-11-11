// The farmer's name (F46 decision 11; romance spec RM8): the first screen on a fresh v4 farm, and Menu → Account's
// **Your name**. Letters of any script, spaces, apostrophes and hyphens; trimmed, inner runs of spaces collapsed, then
// 1–16 characters. No default, no pronouns, no gender: the farmer is never drawn (RS2), lines say "you", and `{farmer}`
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

/** Why a name can't be used, in the sheet's words, or null when it can. */
export function farmerNameIssue(raw: string): string | null {
  const name = cleanFarmerName(raw)
  if (!LETTER.test(name)) return 'Enter a name'
  if (!ALLOWED.test(name)) return 'Letters, spaces, \' and - only'
  if ([...name].length > FARMER_NAME_MAX) return `${FARMER_NAME_MAX} characters at most`
  return null
}

/** The farmer named, or renamed (decision 11): a player's change, which the app stamps. Refused with the sheet's words. */
export function nameFarmer(save: SaveV4, raw: string): SaveV4 {
  const issue = farmerNameIssue(raw)
  if (issue) throw new SaveRuleError('bad-job', issue)
  const name = cleanFarmerName(raw)
  return name === save.farmer.name ? save : { ...save, farmer: { name } }
}

/** `{farmer}` filled with the name (the only placeholder the story allows, D42). */
export const withFarmer = (line: string, name: string): string => line.replaceAll('{farmer}', name || FARMER_PLACEHOLDER)
