// Copied from uma-rpg packages/domain/src/save/rules.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// A rule the player broke, with a reason a screen can switch on and words it can show. uma-rpg's tiers, parties and fights
// stay behind. `no-gold` is the loop's (F17): a purchase the farm can't pay for; `no-price` (F19) something the bin
// doesn't take, a seed; `locked` (F19) something the shop sells only from a Farm Rank or a chapter.

export type SaveRuleReason = 'not-owned' | 'bad-slot' | 'no-items' | 'bad-count' | 'busy' | 'bad-job' | 'no-gold' | 'no-price' | 'locked'

export class SaveRuleError extends Error {
  readonly reason: SaveRuleReason
  constructor(reason: SaveRuleReason, message: string) {
    super(message)
    this.name = 'SaveRuleError'
    this.reason = reason
  }
}
