import type { FarmSave } from '../save/v4'
import { financeEntry } from './credit'

export function recordPurchase<S extends FarmSave>(save: S, title: string, amount: number): S {
  return financeEntry(save, { title, amount, for: 'purchase', kind: 'purchase' })
}
