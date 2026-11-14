// Copied from uma-rpg packages/domain/src/save/rules.ts at 30a322a, with its Wilds-only parts cut.
// A rule the player broke, with a reason a screen can switch on and words it can show. uma-rpg's tiers, parties and fights
// stay behind. `no-gold` is the loop's: a purchase the farm can't pay for; `no-price` something the bin
// doesn't take, a seed; `locked` something not open yet (a Farm Rank, a place to build). The Fields add
// `out-of-season` (a seed planted outside its seasons) and `not-ready` (a plot harvested before it's Ready).

export type SaveRuleReason =
  | 'not-owned' | 'bad-slot' | 'no-items' | 'bad-count' | 'busy' | 'bad-job' | 'no-gold' | 'no-price' | 'locked' | 'out-of-season' | 'not-ready'

export class SaveRuleError extends Error {
  readonly reason: SaveRuleReason
  constructor(reason: SaveRuleReason, message: string) {
    super(message)
    this.name = 'SaveRuleError'
    this.reason = reason
  }
}
