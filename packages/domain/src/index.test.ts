import { describe, expect, it } from 'vitest'
import { GAME } from './index'

describe('domain', () => {
  it('names the game', () => expect(GAME).toBe('uma-farm'))
})
