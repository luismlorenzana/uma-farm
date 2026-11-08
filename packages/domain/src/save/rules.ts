// Copied from uma-rpg packages/domain/src/save/rules.ts at 30a322a (F4, FM2); cuts in docs/technical/wilds-copy.md.
// A rule the player broke, with a reason a screen can switch on and words it can show. uma-rpg's tiers, parties and fights
// stay behind.

export type SaveRuleReason = 'not-owned' | 'bad-slot' | 'no-items' | 'bad-count' | 'busy' | 'bad-job'

export class SaveRuleError extends Error {
  readonly reason: SaveRuleReason
  constructor(reason: SaveRuleReason, message: string) {
    super(message)
    this.name = 'SaveRuleError'
    this.reason = reason
  }
}
