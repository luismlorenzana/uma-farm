import type { PlayGrade } from '../farm/rank-rules'

export const RECIPES_PER_STAGE = 15
export const MAX_TRAY = 12
export const WRONG_PLATE_MS = 2500
export const RESTAURANT_STAGES = [
  { name: 'Farm Counter', types: 1, target: 4, tickets: 6, seconds: 45 },
  { name: 'The Pantry', types: 2, target: 5, tickets: 7, seconds: 45 },
  { name: 'From the Water', types: 2, target: 6, tickets: 8, seconds: 50 },
  { name: 'Orchard Table', types: 2, target: 7, tickets: 9, seconds: 50 },
  { name: 'Barn and Mill', types: 3, target: 7, tickets: 10, seconds: 55 },
  { name: 'Woodland Supper', types: 3, target: 8, tickets: 10, seconds: 55 },
  { name: 'Coastal Table', types: 3, target: 9, tickets: 11, seconds: 60 },
  { name: 'House Menu', types: 3, target: 10, tickets: 12, seconds: 60 },
] as const

export const LAST_STAGE = RESTAURANT_STAGES.length
export const restaurantStage = (stage: number) => RESTAURANT_STAGES[stage - 1]
export const restaurantId = (number: number): string => `dish-restaurant-${String(number).padStart(3, '0')}`
export function restaurantGrade(id: string): number {
  if (!/^dish-restaurant-\d{3}$/.test(id)) return 0
  const recipe = Number(id.slice(-3))
  return recipe > 0 && recipe <= LAST_STAGE * RECIPES_PER_STAGE ? Math.ceil(recipe / RECIPES_PER_STAGE) : 0
}
export const isRestaurantDish = (id: string): boolean => restaurantGrade(id) > 0

export interface StockPortions {
  key: string
  count: number
}

export interface ServiceTicket {
  /** Index in the reserved tray. */
  plate: number
  opens: number
  closes: number
}

export interface RestaurantShift {
  day: number
  stage: number
  seed: number
  started: number
  /** The tray is removed from the Warehouse when the shift starts. */
  tray: StockPortions[]
  tickets: ServiceTicket[]
  served: number[]
  penalty: number
  /** One grace order per Serving chore, shared among the farm's servers. */
  graces: number
  tipRate: number
}

export interface RestaurantResult {
  day: number
  stage: number
  covers: number
  sales: number
  tips: number
  grade: PlayGrade
  cleared: boolean
  opened: boolean
  learned: number
}

export interface RestaurantState {
  cleared: number
  shift: RestaurantShift | null
  last: RestaurantResult | null
}
